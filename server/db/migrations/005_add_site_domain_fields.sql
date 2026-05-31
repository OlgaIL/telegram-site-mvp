alter table sites
  add column if not exists subdomain text,
  add column if not exists custom_domain text,
  add column if not exists domain_status text not null default 'not_configured';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sites_domain_status_check'
  ) then
    alter table sites
      add constraint sites_domain_status_check
      check (domain_status in ('not_configured', 'pending', 'active', 'error'));
  end if;
end $$;

create unique index if not exists sites_subdomain_unique
  on sites (lower(subdomain))
  where subdomain is not null and subdomain <> '';

create unique index if not exists sites_custom_domain_unique
  on sites (lower(custom_domain))
  where custom_domain is not null and custom_domain <> '';
