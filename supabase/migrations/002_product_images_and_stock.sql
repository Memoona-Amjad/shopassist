-- ShopAssist migration 002: product photos and stock levels.
-- Run once in the Supabase SQL Editor (safe to re-run).

-- A photo URL per product (null = show the CSS fabric swatch instead).
alter table products add column if not exists image_url text;

-- How many units are left. in_stock is kept in sync: in_stock = stock > 0.
alter table products add column if not exists stock integer not null default 20;
update products set stock = 0 where in_stock = false and stock = 20;

-- Atomically take stock for an order. Returns the stock left,
-- or null if there was not enough (so two buyers can never oversell).
create or replace function take_stock(p_product_id text, p_qty int)
returns integer
language sql
as $$
  update products
     set stock = stock - p_qty,
         in_stock = (stock - p_qty) > 0
   where id = p_product_id and stock >= p_qty
  returning stock;
$$;

-- Put stock back (used if saving the order fails after stock was taken).
create or replace function give_back_stock(p_product_id text, p_qty int)
returns integer
language sql
as $$
  update products
     set stock = stock + p_qty,
         in_stock = true
   where id = p_product_id
  returning stock;
$$;
