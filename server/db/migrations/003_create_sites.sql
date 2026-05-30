create table if not exists sites (
  id bigserial primary key,
  channel_id bigint references channels(id) on delete set null,
  name text not null,
  slug text not null unique,
  title text not null,
  description text,
  widget_enabled boolean not null default true,
  blog_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into sites (channel_id, name, slug, title, description)
select
  c.id,
  coalesce(c.title, 'Default site'),
  'default',
  coalesce(c.title, 'Default site'),
  'Telegram-powered updates'
from channels c
order by c.updated_at desc, c.id desc
limit 1
on conflict (slug) do nothing;
