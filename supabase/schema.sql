-- users, videos, payments (already created)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  telegram_id text unique,
  subscription_status text default 'free',
  stripe_customer_id text,
  created_at timestamp with time zone default now()
);

create table if not exists videos (
  id bigserial primary key,
  user_id uuid references users(id) on delete cascade,
  file_url text not null,
  status text default 'pending',
  scheduled_time timestamp with time zone,
  youtube_url text,
  created_at timestamp with time zone default now()
);

create table if not exists payments (
  id bigserial primary key,
  user_id uuid references users(id) on delete cascade,
  stripe_session_id text,
  amount numeric(10,2),
  status text default 'pending',
  created_at timestamp with time zone default now()
);
