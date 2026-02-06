import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { getClientIp, hashValue, isValidToken } from "../../utils/newsletter";
import { rateLimitNewsletter } from "../../utils/rate-limit";

export const prerender = false;

const getEnv = () => {
  const siteUrl = import.meta.env.SITE_URL as string | undefined;

  const supabaseUrl = import.meta.env.SUPABASE_URL as string | undefined;
  const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
  const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY as string | undefined;

  return {
    siteUrl,
    supabaseUrl,
    supabaseKey: supabaseServiceRoleKey || supabaseAnonKey,
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

  if (!env.supabaseUrl || !env.supabaseKey) {
    console.error("[newsletter] Missing Supabase credentials");
    return new Response("Signup temporarily unavailable.", { status: 500 });
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();

  if (!token || !isValidToken(token)) {
    return redirectTo(request, "/newsletter/unsubscribed", env.siteUrl);
  }

  try {
    const supabase = createClient(env.supabaseUrl, env.supabaseKey, {
      auth: { persistSession: false },
    });

    const tokenHash = hashValue(token);

    const ipRateLimit = await rateLimitNewsletter(`unsubscribe:ip:${clientIp}`, {
      limit: 30,
      window: "10 m",
      prefix: "newsletter",
    });
    if (!ipRateLimit.allowed) {
      return redirectTo(request, "/newsletter/unsubscribed", env.siteUrl);
    }

    const tokenRateLimit = await rateLimitNewsletter(`unsubscribe:token:${tokenHash}`, {
      limit: 10,
      window: "10 m",
      prefix: "newsletter",
    });
    if (!tokenRateLimit.allowed) {
      return redirectTo(request, "/newsletter/unsubscribed", env.siteUrl);
    }

    const { data: subscriber, error: lookupError } = await supabase
      .from("subscribers")
      .select("id")
      .eq("unsubscribe_token_hash", tokenHash)
      .gt("unsubscribe_token_expires_at", new Date().toISOString())
      .maybeSingle();

    if (lookupError) {
      console.error("[newsletter] Supabase unsubscribe lookup error", lookupError);
      return redirectTo(request, "/newsletter/unsubscribed", env.siteUrl);
    }

    if (subscriber) {
      const { error: updateError } = await supabase
        .from("subscribers")
        .update({
          status: "unsubscribed",
          unsubscribed_at: new Date().toISOString(),
          confirm_token_hash: null,
          confirm_token_expires_at: null,
          unsubscribe_token_hash: null,
          unsubscribe_token_expires_at: null,
        })
        .eq("id", subscriber.id);

      if (updateError) {
        console.error("[newsletter] Supabase unsubscribe update error", updateError);
      }
    }

    return redirectTo(request, "/newsletter/unsubscribed", env.siteUrl);
  } catch (err) {
    console.error("[newsletter] unexpected unsubscribe error", err);
    return redirectTo(request, "/newsletter/unsubscribed", env.siteUrl);
  }
};
