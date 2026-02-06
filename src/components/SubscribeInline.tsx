import { useEffect, useMemo, useRef, useState } from 'react';
import { trackEvent } from '../utils/analytics';

type Status = 'idle' | 'loading' | 'success' | 'error' | 'disabled';

type SubscribeInlineProps = {
  heading?: string;
  helperText?: string;
  privacyText?: string;
  location?: string;
};

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: { sitekey: string; callback: (token: string) => void }) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

export default function SubscribeInline({
  heading = 'Smoke notes in your inbox',
  helperText = 'Weekly recipes, technique drills, and altitude tweaks. No fluff, just better cooks.',
  privacyText = 'No spam. Unsubscribe anytime.',
  location = 'inline',
}: SubscribeInlineProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('');
  const [enabled, setEnabled] = useState<boolean>(false);
  const [mode, setMode] = useState<'provider' | 'log-only' | 'disabled'>('disabled');
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [turnstileReady, setTurnstileReady] = useState<boolean>(false);
  const turnstileRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const enableApi = import.meta.env.PUBLIC_ENABLE_SUBSCRIBE_API === 'true';
  const turnstileSiteKey = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? '';
  const enableTurnstile = Boolean(turnstileSiteKey);

  const statusMessage = useMemo(() => {
    if (status === 'success') return message || 'Check your inbox to confirm.';
    if (status === 'error') return message || 'Something went wrong. Try again or come back later.';
    if (status === 'disabled') return message || "Newsletter signup isn't enabled yet.";
    return '';
  }, [status, message]);

  useEffect(() => {
    if (!enableTurnstile) return;
    if (!turnstileRef.current) return;

    const scriptId = 'turnstile-script';
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
    const renderWidget = () => {
      if (!turnstileRef.current || !window.turnstile) return;
      if (widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: turnstileSiteKey,
        callback: (token: string) => {
          setTurnstileToken(token);
          setTurnstileReady(true);
        },
      });
    };

    if (existingScript) {
      if (window.turnstile) {
        renderWidget();
      } else {
        existingScript.addEventListener('load', renderWidget, { once: true });
      }
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.addEventListener('load', renderWidget, { once: true });
    document.head.appendChild(script);
  }, [enableTurnstile, turnstileSiteKey]);

  useEffect(() => {
    if (!enableApi) {
      setEnabled(false);
      setMode('disabled');
      setStatus('disabled');
      setMessage("Newsletter signup isn't enabled yet.");
      return;
    }

    let cancelled = false;
    fetch('/api/subscribe')
      .then((response) => response.json())
      .then((data: { mode?: 'provider' | 'log-only' | 'disabled'; enabled?: boolean; hasCredentials?: boolean }) => {
        if (cancelled) return;
        const currentMode = data.mode ?? 'disabled';
        const canSubmit = Boolean(data.enabled) && (currentMode !== 'provider' || data.hasCredentials);
        setMode(currentMode);
        setEnabled(canSubmit);
        if (!canSubmit) {
          setStatus('disabled');
          setMessage(data.enabled ? 'Signup temporarily unavailable. Please try again later.' : "Newsletter signup isn't enabled yet.");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setMode('disabled');
        setEnabled(false);
        setStatus('disabled');
        setMessage('Signup temporarily unavailable. Please try again later.');
      });

    return () => {
      cancelled = true;
    };
  }, [enableApi]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = (formData.get('email') as string | null)?.trim();
    const honeypot = (formData.get('company') as string | null)?.trim();

    if (status === 'disabled' || !enabled) {
      setStatus('disabled');
      setMessage("Newsletter signup isn't enabled yet.");
      return;
    }

    if (honeypot) {
      form.reset();
      setStatus('idle');
      return;
    }

    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Add a valid email to subscribe.');
      return;
    }

    setStatus('loading');
    setMessage('');
    trackEvent('newsletter_submit', { location, mode });

    if (!enableApi) {
      form.reset();
      setStatus('success');
      setMessage('Newsletter coming soon. You are on the early-access list.');
      trackEvent('newsletter_success', { location, mode: 'log-only' });
      return;
    }

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source_page: location,
          company: honeypot,
          turnstile_token: turnstileToken,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string; mode?: string };

      if (!response.ok || data.ok === false) {
        throw new Error(data?.message || 'Unable to subscribe right now.');
      }

      setStatus('success');
      setMessage(data?.message ?? 'You are subscribed. Welcome aboard.');
      form.reset();
      if (enableTurnstile) {
        setTurnstileToken('');
        setTurnstileReady(false);
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      }
      trackEvent('newsletter_success', { location, mode: data?.mode ?? mode });
    } catch (error) {
      const fallbackMessage = error instanceof Error ? error.message : 'Unable to subscribe right now.';
      setStatus('error');
      setMessage(fallbackMessage);
      if (enableTurnstile) {
        setTurnstileToken('');
        setTurnstileReady(false);
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      }
      trackEvent('newsletter_error', { location, message: fallbackMessage, mode });
    }
  };

  return (
    <section
      className="rounded-3xl border border-neutral-200/70 bg-white/90 p-6 shadow-[0_18px_45px_-35px_rgba(0,0,0,0.65)] sm:p-8"
      aria-live="polite"
    >
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">Newsletter</p>
        <h2 className="text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">{heading}</h2>
        <p className="text-[var(--color-muted)]">{helperText}</p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        {enableTurnstile && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-800">Verification</label>
            <div ref={turnstileRef} className="cf-turnstile" />
          </div>
        )}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1 space-y-2">
            <label htmlFor={`email-${location}`} className="text-sm font-semibold text-neutral-800">
              Email address
            </label>
            <input
              id={`email-${location}`}
              name="email"
              type="email"
              required
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 shadow-sm transition focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300/40"
              placeholder="you@example.com"
              autoComplete="email"
              disabled={status === 'loading' || status === 'disabled' || (enableTurnstile && !turnstileReady)}
              aria-describedby={`subscribe-helper-${location}`}
            />
          </div>
          <div className="flex-none space-y-2 sm:pt-8">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-[var(--color-ink)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={status === 'loading' || status === 'disabled' || (enableTurnstile && !turnstileReady)}
            >
              {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
            </button>
            <p id={`subscribe-helper-${location}`} className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-muted)]">
              {privacyText}
            </p>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
              status === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
            role="status"
          >
            {statusMessage}
          </div>
        )}
      </form>
    </section>
  );
}
