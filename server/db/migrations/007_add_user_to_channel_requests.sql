alter table channel_requests
  add column if not exists user_id bigint references users(id) on delete set null;

create index if not exists channel_requests_user_created_at_idx
  on channel_requests (user_id, created_at desc)
  where user_id is not null;
