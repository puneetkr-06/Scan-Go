-- Demo seed: two stores, products, offers (adjust store IDs after insert if needed)
-- Run after schema.sql. Or insert via Table Editor.

insert into public.stores (id, name, location) values
  ('11111111-1111-1111-1111-111111111101', 'FreshMart Indiranagar', 'Bengaluru — 100 Ft Road'),
  ('11111111-1111-1111-1111-111111111102', 'QuickPick Koramangala', 'Bengaluru — 5th Block')
on conflict (id) do nothing;

-- Barcodes are common test/EAN-style strings
insert into public.products (store_id, barcode, name, price, stock) values
  ('11111111-1111-1111-1111-111111111101', '8901030865398', 'Amul Gold Milk 500ml', 33.00, 120),
  ('11111111-1111-1111-1111-111111111101', '8901491100288', 'Britannia Whole Wheat Bread', 45.00, 40),
  ('11111111-1111-1111-1111-111111111101', '8901030693619', 'Amul Butter 100g', 56.00, 60),
  ('11111111-1111-1111-1111-111111111101', '8901491102237', 'Good Day Butter Cookies 75g', 20.00, 200),
  ('11111111-1111-1111-1111-111111111102', '8901030865398', 'Amul Gold Milk 500ml', 34.00, 80),
  ('11111111-1111-1111-1111-111111111102', '8901491100288', 'Britannia Whole Wheat Bread', 46.00, 25)
on conflict (store_id, barcode) do nothing;

-- Offers (link to products by barcode subquery — run after products exist)
-- Run once per project; delete duplicate offer rows in SQL Editor if re-run.
insert into public.offers (product_id, type, value, valid_till)
select p.id, 'percent', 10, now() + interval '30 days'
from public.products p
where p.barcode = '8901030865398' and p.store_id = '11111111-1111-1111-1111-111111111101';

insert into public.offers (product_id, type, value, valid_till)
select p.id, 'bogo', 0, now() + interval '14 days'
from public.products p
where p.barcode = '8901491102237' and p.store_id = '11111111-1111-1111-1111-111111111101';

insert into public.offers (product_id, type, value, valid_till)
select p.id, 'flat', 5, now() + interval '7 days'
from public.products p
where p.barcode = '8901491100288' and p.store_id = '11111111-1111-1111-1111-111111111101';
