create table if not exists channels (
  id bigserial primary key,
  telegram_chat_id bigint not null unique,
  username text,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
