alter table channel_requests
  add column if not exists site_id bigint references sites(id) on delete set null;

create unique index if not exists channel_requests_site_id_unique
  on channel_requests (site_id)
  where site_id is not null;
