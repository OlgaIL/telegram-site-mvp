create table if not exists posts (
  id bigserial primary key,
  channel_id bigint not null references channels(id) on delete cascade,
  telegram_message_id bigint not null,
  text text,
  html_text text,
  caption text,
  media_type text not null default 'none',
  media_url text,
  telegram_file_id text,
  media_status text not null default 'none',
  original_url text,
  published_at timestamptz,
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (channel_id, telegram_message_id)
);

create index if not exists posts_channel_id_published_at_idx
  on posts (channel_id, published_at desc);
