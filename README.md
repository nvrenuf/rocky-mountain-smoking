# Rocky Mountain Smoking

Operator notes for the Rocky Mountain Smoking site built with Astro and deployed to Vercel.

## Deployment architecture
- Astro v5 site deployed on Vercel.
- Uses the official `@astrojs/vercel` adapter (`adapter: vercel()` in `astro.config.mjs`) so server endpoints and on‑demand rendering are packaged as Vercel functions. Without the adapter, API routes like `/api/subscribe` will fail or be excluded from the build.
- Primary rendering mode is static; Vercel serves static assets from the edge CDN and routes API traffic to serverless functions.

## Astro build configuration
- `output: "static"` is set in `astro.config.mjs` for Astro v5. Static builds keep page rendering fast and cacheable.
- Vercel adapter must remain enabled; removing it breaks server routes and Vercel deploys.
- Any server route that should not be prerendered must export `export const prerender = false;` (see `src/pages/api/subscribe.ts`) so Astro ships it as a function.
- `output: "hybrid"` is invalid in Astro v5—do not set it. Use `output: "static"` with selective `prerender = false` for server needs.

## Newsletter / Subscribe system
- Inline forms post to `/api/subscribe`, which writes to Supabase and sends confirmations via Resend.
- Required environment variables:
  - `PUBLIC_ENABLE_SUBSCRIBE_API` (string `true`/`false`)
  - `SITE_URL` (server-only, used for confirm/unsubscribe links)
  - `SUPABASE_URL` (server-only)
  - `SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY` (server-only)
  - `RESEND_API_KEY` (server-only)
  - `RESEND_FROM` (server-only, verified sender)
- Recommended environment variables:
  - `UPSTASH_REDIS_REST_URL` (server-only, rate limiting)
  - `UPSTASH_REDIS_REST_TOKEN` (server-only, rate limiting)

## Analytics (minimal)
- Events:
  - `newsletter_submit`, `newsletter_success`, `newsletter_error` (emitted from subscribe flows with location + mode metadata).
- Enable GA4 by setting `PUBLIC_GA_MEASUREMENT_ID`; analytics uses `gtag` when present.
- Debug behavior:
  - If GA is absent and `PUBLIC_ANALYTICS_DEBUG=true` (or running in dev), events log to the console instead of sending to GA.
  - `warnIfAnalyticsMissing()` emits a console warning during server render when GA is not configured.

## Security headers (Vercel)
- Managed in `vercel.json` and applied to all routes.
- CSP is in Report-Only mode to collect violations without breaking Astro pages.

### Tightening CSP later
1. Watch CSP Report-Only violations in browser DevTools or your reporting endpoint.
2. Add explicit directives as you discover legitimate needs (for example: `script-src`, `style-src`, `img-src`, `font-src`, `connect-src`, `frame-src`, `media-src`).
3. When the policy is stable, switch the header name from `Content-Security-Policy-Report-Only` to `Content-Security-Policy` to enforce.

### Allowing third-party domains
1. Add domains to the relevant directive (avoid `*`). Example: `img-src 'self' https://images.example.com;`
2. Add API hosts to `connect-src` as needed. Example: `connect-src 'self' https://api.example.com;`
3. Keep `object-src 'none'`, `base-uri 'self'`, and `frame-ancestors 'none'` unless you have a strong reason to relax them.

## Operator checklist
- Domains + SSL: set primary domain in Vercel (apex or `www`) and enforce redirects between apex and `www` to avoid duplicate origins; ensure TLS is active on both.
- Required env vars in Vercel:
  - Public: `PUBLIC_ENABLE_SUBSCRIBE_API`, `PUBLIC_ANALYTICS_DEBUG` (optional), `PUBLIC_GA_MEASUREMENT_ID` (optional).
  - Server-only: `SITE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM`.
  - Server-only (recommended): `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
- Healthy deployment verification:
  - `npm run build` succeeds locally or in CI.
  - `/api/subscribe` GET responds with `ready` when fully configured.
  - Page loads show GA script when `PUBLIC_GA_MEASUREMENT_ID` is set; in debug mode, console logs appear when GA is absent.
- Common failure modes:
  - Missing Vercel adapter → API routes omitted or 404 in production.
  - `PUBLIC_ENABLE_SUBSCRIBE_API=true` without Supabase/Resend credentials → server errors on subscribe.
  - Setting `output` to `hybrid` in Astro v5 → build failure. Keep `output: "static"` and mark server routes with `prerender = false`.
