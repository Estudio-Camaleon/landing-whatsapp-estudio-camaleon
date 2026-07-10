create table brands (
  id uuid primary key default gen_random_uuid(),
  name text,
  domain text unique,
  slug text unique
);

create table vendors (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  name text,
  phone text,
  active boolean default true,
  schedule jsonb default '{}'::jsonb
);

create table rotation_state (
  brand_id uuid primary key references brands(id),
  last_vendor_index int default 0
);

create table events (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid,
  vendor_id uuid references vendors(id) on delete set null,
  ip text,
  user_agent text,
  created_at timestamp default now()
);
