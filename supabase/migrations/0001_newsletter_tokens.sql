create extension if not exists pgcrypto;

alter table public.subscribers
  add column if not exists status text not null default 'pending',
  add column if not exists confirmed_at timestamptz,
  add column if not exists unsubscribed_at timestamptz,
  add column if not exists confirm_token_hash text,
  add column if not exists unsubscribe_token_hash text,
  add column if not exists last_ip inet,
  add column if not exists last_user_agent text;

create index if not exists subscribers_status_idx on public.subscribers (status);
