-- Scan & Go — Supabase schema, RLS, and checkout RPCs
-- Run in Supabase SQL Editor (or migrate). Enable Email (password) + Google in Auth settings.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  barcode text not null,
  name text not null,
  price numeric(12, 2) not null check (price >= 0),
  stock integer not null check (stock >= 0),
  created_at timestamptz not null default now(),
  unique (store_id, barcode)
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  type text not null check (type in ('percent', 'flat', 'bogo')),
  value numeric(12, 2) not null check (value >= 0),
  valid_till timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  store_id uuid not null references public.stores (id),
  subtotal numeric(12, 2) not null default 0,
  discount_total numeric(12, 2) not null default 0,
  gst_amount numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  status text not null default 'awaiting_payment'
    check (status in ('awaiting_payment', 'paid', 'failed', 'cancelled')),
  exit_token text unique,
  receipt jsonb,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id),
  qty integer not null check (qty > 0),
  unit_price numeric(12, 2) not null,
  line_subtotal numeric(12, 2) not null,
  offer_snapshot jsonb
);

create index idx_products_store on public.products (store_id);
create index idx_products_barcode on public.products (store_id, barcode);
create index idx_offers_product on public.offers (product_id);
create index idx_orders_user on public.orders (user_id);
create index idx_order_items_order on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- Realtime: product price/stock for active store
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.products;

-- ---------------------------------------------------------------------------
-- New user → profile
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'full_name',
      split_part(coalesce(new.email, 'user'), '@', 1)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Offer math (mirrors frontend utils/offers.js)
-- ---------------------------------------------------------------------------
create or replace function public._line_after_offer(
  p_base_unit numeric,
  p_qty int,
  p_type text,
  p_value numeric
) returns numeric
language plpgsql
immutable
as $$
declare
  base_line numeric := round(p_base_unit * p_qty, 2);
  paid_units numeric;
begin
  if p_type is null then
    return base_line;
  end if;
  if p_type = 'percent' then
    return round(base_line * (1 - least(p_value, 100) / 100.0), 2);
  elsif p_type = 'flat' then
    return greatest(0, round(base_line - p_value, 2));
  elsif p_type = 'bogo' then
    paid_units := ceil(p_qty::numeric / 2);
    return round(paid_units * p_base_unit, 2);
  end if;
  return base_line;
end;
$$;

-- ---------------------------------------------------------------------------
-- reserve_checkout: lock stock, create awaiting_payment order (payment next)
-- ---------------------------------------------------------------------------
create or replace function public.reserve_checkout(
  p_store_id uuid,
  p_items jsonb,
  p_gst_percent numeric default 5
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_order_id uuid;
  elem jsonb;
  v_pid uuid;
  v_qty int;
  p record;
  o record;
  line_mrp numeric;
  line_discounted numeric;
  v_mrp_subtotal numeric := 0;
  v_discounted numeric := 0;
  v_gst numeric;
  v_grand numeric;
  v_offer jsonb;
  receipt_lines jsonb := '[]'::jsonb;
  r_line jsonb;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty';
  end if;

  insert into public.orders (user_id, store_id, status, subtotal, discount_total, gst_amount, total)
  values (v_uid, p_store_id, 'awaiting_payment', 0, 0, 0, 0)
  returning id into v_order_id;

  for elem in select * from jsonb_array_elements(p_items)
  loop
    v_pid := (elem ->> 'product_id')::uuid;
    v_qty := (elem ->> 'qty')::int;
    if v_qty < 1 then
      raise exception 'Invalid quantity';
    end if;

    select * into p
    from public.products
    where id = v_pid and store_id = p_store_id
    for update;

    if not found then
      raise exception 'Product not in store';
    end if;

    if p.stock < v_qty then
      raise exception 'Insufficient stock for %', p.name;
    end if;

    line_mrp := round(p.price * v_qty, 2);
    v_mrp_subtotal := v_mrp_subtotal + line_mrp;

    select * into o
    from public.offers
    where product_id = p.id and valid_till > now()
    order by valid_till desc
    limit 1;

    if found then
      line_discounted := public._line_after_offer(p.price, v_qty, o.type, o.value);
      v_offer := jsonb_build_object('type', o.type, 'value', o.value, 'valid_till', o.valid_till);
    else
      line_discounted := line_mrp;
      v_offer := null;
    end if;

    v_discounted := v_discounted + line_discounted;

    insert into public.order_items (order_id, product_id, qty, unit_price, line_subtotal, offer_snapshot)
    values (
      v_order_id,
      v_pid,
      v_qty,
      round(line_discounted / nullif(v_qty, 0), 2),
      line_discounted,
      v_offer
    );

    update public.products set stock = stock - v_qty where id = v_pid;

    r_line := jsonb_build_object(
      'product_id', v_pid,
      'name', p.name,
      'barcode', p.barcode,
      'qty', v_qty,
      'unit_price_mrp', p.price,
      'line_mrp', line_mrp,
      'line_payable', line_discounted,
      'offer', v_offer
    );
    receipt_lines := receipt_lines || jsonb_build_array(r_line);
  end loop;

  v_gst := round(v_discounted * (p_gst_percent / 100.0), 2);
  v_grand := round(v_discounted + v_gst, 2);

  update public.orders
  set
    subtotal = v_mrp_subtotal,
    discount_total = round(v_mrp_subtotal - v_discounted, 2),
    gst_amount = v_gst,
    total = v_grand,
    receipt = jsonb_build_object(
      'lines', receipt_lines,
      'mrp_subtotal', v_mrp_subtotal,
      'after_offers', v_discounted,
      'gst_percent', p_gst_percent,
      'store_id', p_store_id
    )
  where id = v_order_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'subtotal', v_mrp_subtotal,
    'discount_total', round(v_mrp_subtotal - v_discounted, 2),
    'after_offers', v_discounted,
    'gst_amount', v_gst,
    'total', v_grand
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- complete_checkout: mark paid + exit token
-- ---------------------------------------------------------------------------
create or replace function public.complete_checkout(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  tok text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  tok := replace(gen_random_uuid()::text, '-', '');

  update public.orders
  set status = 'paid', exit_token = tok
  where id = p_order_id and user_id = v_uid and status = 'awaiting_payment';

  if not found then
    raise exception 'Order not found or not awaiting payment';
  end if;

  return jsonb_build_object('order_id', p_order_id, 'exit_token', tok);
end;
$$;

-- ---------------------------------------------------------------------------
-- fail_checkout / cancel: restore stock (payment failed or user cancelled)
-- ---------------------------------------------------------------------------
create or replace function public.cancel_awaiting_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  r record;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  perform 1 from public.orders
  where id = p_order_id and user_id = v_uid and status = 'awaiting_payment'
  for update;

  if not found then
    return jsonb_build_object('ok', true, 'order_id', p_order_id, 'note', 'nothing_to_cancel');
  end if;

  for r in select product_id, qty from public.order_items where order_id = p_order_id
  loop
    update public.products set stock = stock + r.qty where id = r.product_id;
  end loop;

  update public.orders set status = 'cancelled' where id = p_order_id;

  return jsonb_build_object('ok', true, 'order_id', p_order_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.offers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Profiles: own row
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Stores: read for signed-in shoppers
create policy "stores_read_auth" on public.stores for select to authenticated using (true);

-- Products & offers: read while authenticated
create policy "products_read_auth" on public.products for select to authenticated using (true);
create policy "offers_read_auth" on public.offers for select to authenticated using (true);

-- Orders: own data only
create policy "orders_select_own" on public.orders for select to authenticated using (auth.uid() = user_id);

-- Order items: visible if order belongs to user
create policy "order_items_select_own" on public.order_items for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

-- No direct inserts/updates on orders/order_items/products from clients (RPC only)
-- (Inserts happen via security definer functions.)

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.stores, public.products, public.offers to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.orders, public.order_items to authenticated;
grant execute on function public.reserve_checkout(uuid, jsonb, numeric) to authenticated;
grant execute on function public.complete_checkout(uuid) to authenticated;
grant execute on function public.cancel_awaiting_order(uuid) to authenticated;
