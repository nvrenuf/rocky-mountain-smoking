alter table public.subscribers
  add column if not exists confirm_token_expires_at timestamptz,
  add column if not exists unsubscribe_token_expires_at timestamptz;

create index if not exists subscribers_confirm_token_expires_at_idx
  on public.subscribers (confirm_token_expires_at);

create index if not exists subscribers_unsubscribe_token_expires_at_idx
  on public.subscribers (unsubscribe_token_expires_at);
