-- Allow all operations for anon key (used by edge functions)
alter table brands disable row level security;
alter table vendors disable row level security;
alter table events disable row level security;
alter table rotation_state disable row level security;

-- Brands
insert into brands (name, domain, slug) values
  ('Aventus', 'aventus.com', 'aventus'),
  ('MaggieStore', 'maggiestore.com', 'maggiestore'),
  ('TusLibrosYa!', 'tuslibrosya.com', 'tuslibrosya');

-- Vendors for Aventus
insert into vendors (brand_id, name, phone, active, schedule)
select id, 'Dario', '5493815272820', true, '{}'::jsonb from brands where slug = 'aventus';

insert into vendors (brand_id, name, phone, active, schedule)
select id, 'Neo', '5493813583226', true, '{}'::jsonb from brands where slug = 'aventus';

insert into vendors (brand_id, name, phone, active, schedule)
select id, 'Facundo', '5493812114879', true, '{}'::jsonb from brands where slug = 'aventus';

-- Vendors for MaggieStore
insert into vendors (brand_id, name, phone, active, schedule)
select id, 'Dario', '5493815272820', true, '{}'::jsonb from brands where slug = 'maggiestore';

-- Vendors for TusLibrosYa!
insert into vendors (brand_id, name, phone, active, schedule)
select id, 'Dario', '5493815272820', true, '{}'::jsonb from brands where slug = 'tuslibrosya';

insert into vendors (brand_id, name, phone, active, schedule)
select id, 'Neo', '5493813583226', true, '{}'::jsonb from brands where slug = 'tuslibrosya';

insert into vendors (brand_id, name, phone, active, schedule)
select id, 'Facundo', '5493812114879', true, '{}'::jsonb from brands where slug = 'tuslibrosya';
