-- ENTREGAOS — Loja pública e criação segura de pedidos
-- Execute este arquivo no SQL Editor do Supabase.

-- A empresa precisa ser consultável pelo slug para abrir a loja pública.
drop policy if exists "public can read active company by slug" on public.companies;
create policy "public can read active company by slug"
on public.companies for select to anon, authenticated
using (is_active = true);

-- Catálogo público somente de empresas ativas.
drop policy if exists "public can read active catalog" on public.categories;
create policy "public can read active catalog"
on public.categories for select to anon, authenticated
using (
  is_active = true
  and exists (
    select 1 from public.companies c
    where c.id = categories.company_id and c.is_active = true
  )
);

drop policy if exists "public can read active products" on public.products;
create policy "public can read active products"
on public.products for select to anon, authenticated
using (
  is_active = true
  and exists (
    select 1 from public.companies c
    where c.id = products.company_id and c.is_active = true
  )
);

-- O cliente nunca insere diretamente em customers/orders/order_items.
-- Esta função valida a empresa, os produtos e recalcula os valores no banco.
create or replace function public.create_public_order(
  p_company_id uuid,
  p_customer jsonb,
  p_address jsonb,
  p_items jsonb,
  p_payment_method public.payment_method,
  p_notes text default null,
  p_distance_km numeric default null
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_company public.companies;
  v_customer public.customers;
  v_address public.addresses;
  v_order public.orders;
  v_delivery public.delivery_settings;
  v_item jsonb;
  v_product public.products;
  v_quantity integer;
  v_subtotal numeric(12,2) := 0;
  v_delivery_fee numeric(12,2) := 0;
  v_total numeric(12,2) := 0;
  v_distance numeric(8,2);
  v_item_total numeric(12,2);
begin
  if p_company_id is null then raise exception 'Empresa inválida'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'O carrinho está vazio'; end if;
  if nullif(trim(coalesce(p_customer->>'name', '')), '') is null then raise exception 'Informe seu nome'; end if;
  if nullif(trim(coalesce(p_customer->>'phone', '')), '') is null then raise exception 'Informe seu telefone'; end if;
  if nullif(trim(coalesce(p_address->>'street', '')), '') is null then raise exception 'Informe a rua'; end if;

  select * into v_company from public.companies where id = p_company_id and is_active = true;
  if not found then raise exception 'Loja não encontrada ou inativa'; end if;

  select * into v_delivery from public.delivery_settings where company_id = p_company_id;
  if not found then
    insert into public.delivery_settings(company_id) values (p_company_id)
    returning * into v_delivery;
  end if;

  -- Cliente é identificado por empresa + telefone.
  insert into public.customers(company_id, name, phone, email)
  values (
    p_company_id,
    trim(p_customer->>'name'),
    trim(p_customer->>'phone'),
    nullif(trim(coalesce(p_customer->>'email', '')), '')
  )
  on conflict (company_id, phone)
  do update set
    name = excluded.name,
    email = excluded.email,
    updated_at = now()
  returning * into v_customer;

  insert into public.addresses(
    customer_id, label, street, number, complement, neighborhood, city, state, postal_code, reference, latitude, longitude
  ) values (
    v_customer.id,
    coalesce(nullif(trim(p_address->>'label'), ''), 'Principal'),
    trim(p_address->>'street'),
    nullif(trim(coalesce(p_address->>'number', '')), ''),
    nullif(trim(coalesce(p_address->>'complement', '')), ''),
    nullif(trim(coalesce(p_address->>'neighborhood', '')), ''),
    nullif(trim(coalesce(p_address->>'city', '')), ''),
    nullif(trim(coalesce(p_address->>'state', '')), ''),
    nullif(trim(coalesce(p_address->>'postal_code', '')), ''),
    nullif(trim(coalesce(p_address->>'reference', '')), ''),
    nullif(p_address->>'latitude', '')::double precision,
    nullif(p_address->>'longitude', '')::double precision
  ) returning * into v_address;

  if p_distance_km is not null and p_distance_km < 0 then
    raise exception 'Distância inválida';
  end if;
  v_distance := case when p_distance_km is null then null else round(p_distance_km, 2) end;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := greatest(1, least(999, coalesce((v_item->>'quantity')::integer, 0)));
    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid
      and company_id = p_company_id
      and is_active = true;

    if not found then raise exception 'Um dos produtos não está mais disponível'; end if;
    if v_product.stock is not null and v_product.stock < v_quantity then
      raise exception 'Estoque insuficiente para: %', v_product.name;
    end if;

    v_item_total := round(v_product.price * v_quantity, 2);
    v_subtotal := v_subtotal + v_item_total;
  end loop;

  if v_delivery.free_delivery_minimum is not null and v_subtotal >= v_delivery.free_delivery_minimum then
    v_delivery_fee := 0;
  elsif v_delivery.pricing_type = 'fixed' then
    v_delivery_fee := greatest(v_delivery.minimum_fee, v_delivery.fixed_fee);
  elsif v_delivery.pricing_type = 'per_km' then
    if v_distance is null then raise exception 'Informe a distância aproximada da entrega'; end if;
    if v_delivery.max_distance_km is not null and v_distance > v_delivery.max_distance_km then
      raise exception 'Seu endereço está fora da área de entrega';
    end if;
    v_delivery_fee := greatest(v_delivery.minimum_fee, round(v_distance * v_delivery.price_per_km, 2));
  end if;

  v_total := round(v_subtotal + v_delivery_fee, 2);

  insert into public.orders(
    company_id, customer_id, address_id, payment_method, payment_status,
    subtotal, discount, delivery_fee, total, distance_km, notes
  ) values (
    p_company_id, v_customer.id, v_address.id, p_payment_method, 'pending',
    v_subtotal, 0, v_delivery_fee, v_total, v_distance, nullif(trim(coalesce(p_notes, '')), '')
  ) returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := greatest(1, least(999, coalesce((v_item->>'quantity')::integer, 0)));
    select * into v_product from public.products
    where id = (v_item->>'product_id')::uuid and company_id = p_company_id and is_active = true;

    insert into public.order_items(order_id, product_id, product_name, quantity, unit_price, total_price, notes)
    values (
      v_order.id, v_product.id, v_product.name, v_quantity, v_product.price,
      round(v_product.price * v_quantity, 2), nullif(trim(coalesce(v_item->>'notes', '')), '')
    );

    if v_product.stock is not null then
      update public.products
      set stock = stock - v_quantity, updated_at = now()
      where id = v_product.id and stock is not null;
    end if;
  end loop;

  return jsonb_build_object(
    'id', v_order.id,
    'order_number', v_order.order_number,
    'status', v_order.status,
    'subtotal', v_subtotal,
    'delivery_fee', v_delivery_fee,
    'total', v_total,
    'distance_km', v_distance,
    'company_name', v_company.name
  );
end;
$$;

revoke all on function public.create_public_order(uuid, jsonb, jsonb, jsonb, public.payment_method, text, numeric) from public;
grant execute on function public.create_public_order(uuid, jsonb, jsonb, jsonb, public.payment_method, text, numeric) to anon, authenticated;
