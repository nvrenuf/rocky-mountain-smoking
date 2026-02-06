import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { createToken, getClientIp, hashValue, isValidToken, tokenExpiresAt } from "../../utils/newsletter";
import { rateLimitNewsletter } from "../../utils/rate-limit";

export const prerender = false;

const getEnv = () => {
  const enabled = (import.meta.env.PUBLIC_ENABLE_SUBSCRIBE_API ?? "").toLowerCase() === "true";
  const siteUrl = import.meta.env.SITE_URL as string | undefined;

  const supabaseUrl = import.meta.env.SUPABASE_URL as string | undefined;
  const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
  const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY as string | undefined;

  const resendApiKey = import.meta.env.RESEND_API_KEY as string | undefined;
  const resendFrom = import.meta.env.RESEND_FROM as string | undefined;

  return {
    enabled,
    siteUrl,
    supabaseUrl,
    supabaseKey: supabaseServiceRoleKey || supabaseAnonKey,
    resendApiKey,
    resendFrom,
  };
};

const redirectTo = (request: Request, path: string, siteUrl?: string) => {
  const base = siteUrl ?? new URL(request.url).origin;
  return Response.redirect(new URL(path, base).toString(), 302);
};

export const GET: APIRoute = async ({ request, clientAddress }) => {
  if (request.method !== "GET") {
    return new Response("Method not allowed.", { status: 405, headers: { Allow: "GET" } });
  }

  const env = getEnv();
  const clientIp = getClientIp(request, clientAddress) ?? "unknown";

  if (!env.enabled) {
    return new Response(JSON.stringify({ ok: false, message: "Newsletter signup isn't enabled yet.", error: "disabled" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!env.supabaseUrl || !env.supabaseKey) {
    console.error("[newsletter] Missing Supabase credentials");
    return new Response("Signup temporarily unavailable.", { status: 500 });
  }

  if (!env.resendApiKey || !env.resendFrom) {
    console.error("[newsletter] Missing Resend credentials");
    return new Response("Signup temporarily unavailable.", { status: 500 });
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();

  if (!token || !isValidToken(token)) {
    return redirectTo(request, "/newsletter/confirmed", env.siteUrl);
  }

  const tokenHash = hashValue(token);

  const ipRateLimit = await rateLimitNewsletter(`confirm:ip:${clientIp}`, {
    limit: 30,
    window: "10 m",
    prefix: "newsletter",
  });
  if (!ipRateLimit.allowed) {
    return redirectTo(request, "/newsletter/confirmed", env.siteUrl);
  }

  const tokenRateLimit = await rateLimitNewsletter(`confirm:token:${tokenHash}`, {
    limit: 10,
    window: "10 m",
    prefix: "newsletter",
  });
  if (!tokenRateLimit.allowed) {
    return redirectTo(request, "/newsletter/confirmed", env.siteUrl);
  }

  try {
    const supabase = createClient(env.supabaseUrl, env.supabaseKey, {
      auth: { persistSession: false },
    });

    const { data: subscriber, error: lookupError } = await supabase
      .from("subscribers")
      .select("id,status,email")
      .eq("confirm_token_hash", tokenHash)
      .gt("confirm_token_expires_at", new Date().toISOString())
      .maybeSingle();

    if (lookupError) {
      console.error("[newsletter] Supabase confirm lookup error", lookupError);
      return redirectTo(request, "/newsletter/confirmed", env.siteUrl);
    }

    if (!subscriber) {
      return redirectTo(request, "/newsletter/confirmed", env.siteUrl);
    }

    if (subscriber.status === "unsubscribed") {
      return redirectTo(request, "/newsletter/confirmed", env.siteUrl);
    }

    const unsubscribeToken = createToken();
    const unsubscribeTokenHash = hashValue(unsubscribeToken);

    const { data: updatedSubscriber, error: updateError } = await supabase
      .from("subscribers")
      .update({
        status: "active",
        confirmed_at: new Date().toISOString(),
        confirm_token_hash: null,
        confirm_token_expires_at: null,
        unsubscribe_token_hash: unsubscribeTokenHash,
        unsubscribe_token_expires_at: tokenExpiresAt(),
      })
      .eq("id", subscriber.id)
      .eq("confirm_token_hash", tokenHash)
      .eq("status", "pending")
      .select("id");

    if (updateError) {
      console.error("[newsletter] Supabase confirm update error", updateError);
      return redirectTo(request, "/newsletter/confirmed", env.siteUrl);
    }

    if (!updatedSubscriber || updatedSubscriber.length === 0) {
      return redirectTo(request, "/newsletter/confirmed", env.siteUrl);
    }

    const base = (env.siteUrl ?? new URL(request.url).origin).replace(/\/$/, "");
    const unsubscribeUrl = `${base}/api/unsubscribe?token=${unsubscribeToken}`;
    const resend = new Resend(env.resendApiKey);
    const sendResult = await resend.emails.send({
      from: env.resendFrom,
      to: [subscriber.email],
      subject: "Welcome to Rocky Mountain Smoking",
      text:
        "Welcome to Rocky Mountain Smoking.\n\n" +
        "What you'll receive: weekly recipes, technique drills, and altitude adjustments.\n\n" +
        `Home: ${base}\n\n` +
        `Unsubscribe: ${unsubscribeUrl}`,
    });

    const resendError =
      typeof sendResult === "object" && sendResult && "error" in sendResult
        ? (sendResult as { error?: unknown }).error
        : undefined;

    if (resendError) {
      console.error("[newsletter] Resend send error", resendError);
    }

    return redirectTo(request, "/newsletter/confirmed", env.siteUrl);
  } catch (err) {
    console.error("[newsletter] unexpected confirm error", err);
    return redirectTo(request, "/newsletter/confirmed", env.siteUrl);
  }
};
