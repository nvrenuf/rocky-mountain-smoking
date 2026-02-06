import type { APIRoute } from "astro";
import { isIP } from "node:net";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import {
  createToken,
  getClientIp,
  hashValue,
  isValidEmail,
  normalizeEmail,
  tokenExpiresAt,
} from "../../utils/newsletter";
import { rateLimitNewsletter } from "../../utils/rate-limit";

export const prerender = false;

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const getEnv = () => {
  const enabled = (import.meta.env.PUBLIC_ENABLE_SUBSCRIBE_API ?? "").toLowerCase() === "true";
  const siteUrl = import.meta.env.SITE_URL as string | undefined;

  const supabaseUrl = import.meta.env.SUPABASE_URL as string | undefined;
  const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
  const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY as string | undefined;

  const resendApiKey = import.meta.env.RESEND_API_KEY as string | undefined;
  const resendFrom = import.meta.env.RESEND_FROM as string | undefined;

  const hasSupabase = Boolean(supabaseUrl && (supabaseServiceRoleKey || supabaseAnonKey));
  const hasResend = Boolean(resendApiKey && resendFrom);

  return {
    enabled,
    siteUrl,
    supabaseUrl,
    supabaseKey: supabaseServiceRoleKey || supabaseAnonKey,
    resendApiKey,
    resendFrom,
    hasCredentials: hasSupabase && hasResend && Boolean(siteUrl),
  };
};

export const GET: APIRoute = () => {
  const env = getEnv();
  const status = env.enabled && env.hasCredentials ? "ready" : "needs_config";
  return json(200, {
    status,
    enabled: env.enabled,
    hasCredentials: env.hasCredentials,
    provider: "supabase+resend",
  });
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, message: "Method not allowed.", error: "method_not_allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", Allow: "POST" },
    });
  }

  const env = getEnv();
  const clientIp = getClientIp(request, clientAddress) ?? "unknown";
  const genericSuccess = json(200, { ok: true, status: "pending", message: "Check your inbox to confirm." });

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return json(400, { ok: false, message: "Invalid request.", error: "bad_request" });
  }

  const parsed = await request.json().catch(() => ({}));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return json(400, { ok: false, message: "Invalid request.", error: "bad_request" });
  }

  const payload = parsed as {
    email?: string;
    source?: string;
    source_page?: string;
    honeypot?: string;
    company?: string;
  };

  if (payload.honeypot || payload.company) {
    return genericSuccess;
  }

  const rawEmail = typeof payload.email === "string" ? payload.email : "";
  const normalizedEmail = normalizeEmail(rawEmail);
  if (!isValidEmail(normalizedEmail)) {
    return json(400, { ok: false, message: "Add a valid email to subscribe.", error: "bad_request" });
  }

  if (!env.enabled) {
    return json(503, {
      ok: false,
      message: "Newsletter signup isn't enabled yet.",
      error: "disabled",
    });
  }

  const ipRateLimit = await rateLimitNewsletter(`subscribe:ip:${clientIp}`, {
    limit: 10,
    window: "1 m",
    prefix: "newsletter",
  });
  if (!ipRateLimit.allowed) {
    return json(429, { ok: false, message: "Please wait and try again.", error: "rate_limited" });
  }

  const emailRateLimit = await rateLimitNewsletter(`subscribe:email:${hashValue(normalizedEmail)}`, {
    limit: 3,
    window: "1 h",
    prefix: "newsletter",
  });
  if (!emailRateLimit.allowed) {
    return json(429, { ok: false, message: "Please wait and try again.", error: "rate_limited" });
  }

  if (!env.supabaseUrl || !env.supabaseKey) {
    console.error("[newsletter] Missing Supabase credentials");
    return json(500, {
      ok: false,
      message: "Signup temporarily unavailable. Please try again later.",
      error: "missing_supabase_credentials",
    });
  }

  if (!env.resendApiKey || !env.resendFrom) {
    console.error("[newsletter] Missing Resend credentials");
    return json(500, {
      ok: false,
      message: "Signup temporarily unavailable. Please try again later.",
      error: "missing_resend_credentials",
    });
  }

  const rawSource = payload.source_page ?? payload.source ?? "";
  const sourceValue = typeof rawSource === "string" ? rawSource.slice(0, 200) : "";

  try {
    const supabase = createClient(env.supabaseUrl, env.supabaseKey, {
      auth: { persistSession: false },
    });

    const { data: existingSubscriber, error: lookupError } = await supabase
      .from("subscribers")
      .select("status")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (lookupError) {
      console.error("[newsletter] Supabase lookup error", lookupError);
      return json(500, {
        ok: false,
        message: "Unable to subscribe right now. Please try again later.",
        error: "db_error",
      });
    }

    if (existingSubscriber?.status === "active") {
      return genericSuccess;
    }

    const confirmToken = createToken();
    const lastIp = isIP(clientIp) ? clientIp : null;
    const lastUserAgent = request.headers.get("user-agent");

    const { error: upsertError } = await supabase
      .from("subscribers")
      .upsert(
        {
          email: normalizedEmail,
          source_page: sourceValue || null,
          status: "pending",
          confirmed_at: null,
          unsubscribed_at: null,
          confirm_token_hash: hashValue(confirmToken),
          confirm_token_expires_at: tokenExpiresAt(),
          unsubscribe_token_hash: null,
          unsubscribe_token_expires_at: null,
          last_ip: lastIp,
          last_user_agent: lastUserAgent ?? null,
        },
        { onConflict: "email" },
      );

    if (upsertError) {
      console.error("[newsletter] Supabase upsert error", upsertError);
      return json(500, {
        ok: false,
        message: "Signup temporarily unavailable. Please try again later.",
        error: "db_error",
      });
    }

    const resend = new Resend(env.resendApiKey);
    const base = (env.siteUrl ?? new URL(request.url).origin).replace(/\/$/, "");
    const confirmUrl = `${base}/api/confirm?token=${confirmToken}`;

    const sendResult = await resend.emails.send({
      from: env.resendFrom,
      to: [normalizedEmail],
      subject: "Confirm your Rocky Mountain Smoking subscription",
      text: `Confirm your subscription to Rocky Mountain Smoking:\n\n${confirmUrl}\n\nIf you didn't request this, you can ignore this email.`,
    });

    const resendError =
      typeof sendResult === "object" && sendResult && "error" in sendResult
        ? (sendResult as { error?: unknown }).error
        : undefined;

    if (resendError) {
      console.error("[newsletter] Resend send error", resendError);
      return json(502, {
        ok: false,
        message: "Unable to subscribe right now. Please try again later.",
        error: "email_error",
      });
    }

    return json(200, { ok: true, status: "pending", message: "Check your inbox to confirm." });
  } catch (err) {
    console.error("[newsletter] unexpected error", err);
    return json(500, {
      ok: false,
      message: "Something went wrong. Try again in a bit.",
      error: "unexpected_error",
    });
  }
};
