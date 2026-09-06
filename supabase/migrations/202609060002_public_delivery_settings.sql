-- Regras de entrega necessárias para calcular o carrinho da loja pública.
-- Não expõe dados de clientes/pedidos.
drop policy if exists "public can read delivery settings" on public.delivery_settings;
create policy "public can read delivery settings"
on public.delivery_settings for select to anon, authenticated
using (
  exists (
    select 1 from public.companies c
    where c.id = delivery_settings.company_id and c.is_active = true
  )
);
