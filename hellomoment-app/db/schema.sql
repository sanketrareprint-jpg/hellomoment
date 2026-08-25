-- hellomoment.in — bare-skeleton schema
-- Just enough to prove registration + login + a DB-backed dashboard work end to end.
-- Later phases (contacts, templates, festivals, message logs) get their own migration files.

create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  business_name text not null,
  email         text not null unique,
  password_hash text not null,
  timezone      text not null default 'Asia/Kolkata',
  created_at    timestamptz not null default now()
);
