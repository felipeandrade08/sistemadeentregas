-- Contas e disponibilidade dos entregadores
alter table public.drivers add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.drivers add column if not exists invite_token text default encode(gen_random_bytes(18), 'hex');
alter table public.drivers add column if not exists is_available boolean not null default true;

update public.drivers set invite_token = encode(gen_random_bytes(18), 'hex') where invite_token is null;
create unique index if not exists idx_drivers_user_id_unique on public.drivers(user_id) where user_id is not null;
create unique index if not exists idx_drivers_invite_token_unique on public.drivers(invite_token);
create index if not exists idx_drivers_company_available on public.drivers(company_id, is_active, is_available);

create or replace function public.current_driver_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from public.drivers where user_id = auth.uid() and is_active = true limit 1;
$$;

-- A conta do motorista só pode enxergar o próprio cadastro.
drop policy if exists "company members manage drivers" on public.drivers;
create policy "staff manage drivers" on public.drivers for all to authenticated
using (company_id = public.current_company_id() and public.current_user_role() in ('owner','manager','operator'))
with check (company_id = public.current_company_id() and public.current_user_role() in ('owner','manager','operator'));
create policy "driver reads own driver" on public.drivers for select to authenticated
using (user_id = auth.uid());

-- Motoristas enxergam apenas pedidos atribuídos a eles; equipe continua enxergando os pedidos da empresa.
drop policy if exists "company members read orders" on public.orders;
create policy "staff read company orders" on public.orders for select to authenticated
using (company_id = public.current_company_id() and public.current_user_role() in ('owner','manager','operator'));
create policy "driver read assigned orders" on public.orders for select to authenticated
using (company_id = public.current_company_id() and public.current_user_role() = 'driver' and driver_id = public.current_driver_id());

drop policy if exists "company members update orders" on public.orders;
create policy "staff update company orders" on public.orders for update to authenticated
using (company_id = public.current_company_id() and public.current_user_role() in ('owner','manager','operator'))
with check (company_id = public.current_company_id() and public.current_user_role() in ('owner','manager','operator'));
create policy "driver update assigned orders" on public.orders for update to authenticated
using (company_id = public.current_company_id() and public.current_user_role() = 'driver' and driver_id = public.current_driver_id())
with check (company_id = public.current_company_id() and public.current_user_role() = 'driver' and driver_id = public.current_driver_id());

-- O motorista pode concluir o próprio pedido, mas o vínculo da conta é feito somente pelo convite.
create or replace function public.claim_driver_invite(p_token text)
returns public.drivers
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_driver public.drivers;
  v_name text;
begin
  if v_user is null then raise exception 'Não autenticado'; end if;
  if nullif(trim(coalesce(p_token, '')), '') is null then raise exception 'Convite inválido'; end if;

  select * into v_driver
  from public.drivers
  where invite_token = trim(p_token)
    and is_active = true
  limit 1;

  if v_driver.id is null then raise exception 'Convite inválido ou expirado'; end if;
  if v_driver.user_id is not null and v_driver.user_id <> v_user then raise exception 'Este convite já foi utilizado'; end if;

  if exists (select 1 from public.profiles where id = v_user and company_id is not null and company_id <> v_driver.company_id) then
    raise exception 'Esta conta já pertence a outra empresa';
  end if;
  if exists (select 1 from public.drivers where user_id = v_user and id <> v_driver.id) then
    raise exception 'Esta conta já está vinculada a outro entregador';
  end if;

  v_name := coalesce(nullif(trim((select full_name from public.profiles where id = v_user)), ''), v_driver.name);
  update public.drivers set user_id = v_user where id = v_driver.id;
  update public.profiles set company_id = v_driver.company_id, role = 'driver', full_name = v_name where id = v_user;

  select * into v_driver from public.drivers where id = v_driver.id;
  return v_driver;
end;
$$;
revoke all on function public.claim_driver_invite(text) from public;
grant execute on function public.claim_driver_invite(text) to authenticated;

create or replace function public.set_driver_availability(p_available boolean)
returns public.drivers
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_driver public.drivers;
begin
  update public.drivers
  set is_available = coalesce(p_available, false)
  where user_id = auth.uid() and is_active = true
  returning * into v_driver;
  if v_driver.id is null then raise exception 'Entregador não encontrado ou inativo'; end if;
  return v_driver;
end;
$$;
revoke all on function public.set_driver_availability(boolean) from public;
grant execute on function public.set_driver_availability(boolean) to authenticated;

-- Realtime para mudanças de pedidos (idempotente).
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders') then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
