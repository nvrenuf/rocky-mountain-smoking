create extension if not exists pgcrypto;

create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source_page text,
  status text not null default 'pending',
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  confirm_token_hash text,
  confirm_token_expires_at timestamptz,
  unsubscribe_token_hash text,
  unsubscribe_token_expires_at timestamptz,
  last_ip inet,
  last_user_agent text,
  created_at timestamptz not null default now()
);
