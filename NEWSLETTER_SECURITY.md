# Newsletter Security Controls

## Routes and Token Flow
- Subscribe: `POST /api/subscribe` (JSON). `GET /api/subscribe` returns readiness status.
- Confirm: `GET /api/confirm?token=...`
- Unsubscribe: `GET /api/unsubscribe?token=...`

Token flow:
1. Subscribe validates input, generates a confirmation token (32-byte random hex), stores only the SHA-256 hash plus an expiry timestamp (24h), and emails the raw token in the confirm link.
2. Confirm hashes the provided token and looks up a matching, unexpired record. If found, it updates the subscriber to `active`, clears the confirmation token fields, and issues a new unsubscribe token (stored only as a hash, with a 24h expiry). The update is conditional on the token hash and `pending` status to enforce single-use semantics.
3. Unsubscribe hashes the token, looks up a matching, unexpired record, and clears all token fields while marking the subscriber `unsubscribed`.

## Validation and Response Behavior
- Strict method enforcement on each route.
- Content-type enforcement for JSON POST requests.
- Email normalization and validation before processing.
- Non-enumerating behavior: subscribe always returns the same success response for existing or new emails; confirm/unsubscribe redirect to a fixed success page regardless of token validity.

## Rate Limiting (Serverless-Safe)
Upstash Redis is used for serverless-safe rate limiting.
- IP-based and token/email-based limits are applied on subscribe/confirm/unsubscribe.
- If Upstash is not configured, rate limiting is disabled (with a server-side warning).

Required env vars for rate limiting:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Honeypot
A lightweight honeypot is enforced on `POST /api/subscribe`:
- Requests with `honeypot` or `company` fields set are treated as successful but ignored.

## Required Environment Variables
- `PUBLIC_ENABLE_SUBSCRIBE_API`
- `SITE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM`
- `UPSTASH_REDIS_REST_URL` (rate limiting)
- `UPSTASH_REDIS_REST_TOKEN` (rate limiting)

## Local Testing Steps
1. Set env vars in `.env` (or `.env.local`) including `PUBLIC_ENABLE_SUBSCRIBE_API=true` and valid Supabase/Resend/Upstash credentials.
2. Start the dev server: `npm run dev`.
3. Subscribe with a JSON POST:
   - `curl -X POST http://localhost:4321/api/subscribe -H "Content-Type: application/json" -d '{"email":"you@example.com"}'`
4. Confirm using the emailed link, or copy the confirm token and hit:
   - `curl -I "http://localhost:4321/api/confirm?token=YOUR_TOKEN"`
5. Unsubscribe with the emailed link, or copy the token:
   - `curl -I "http://localhost:4321/api/unsubscribe?token=YOUR_TOKEN"`
6. Verify non-enumeration by repeating subscribe for the same email and checking that responses remain identical.
