create table if not exists channel_requests (
  id bigserial primary key,
  telegram_channel text not null,
  email text not null,
  comment text,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists channel_requests_status_created_at_idx
  on channel_requests (status, created_at desc);
