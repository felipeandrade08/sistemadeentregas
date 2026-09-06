# EntregaOS

SaaS multiempresa para pedidos e entregas.

## Fluxo principal

Cliente faz o pedido → empresa recebe → aceita/recusa → prepara → marca como pronto → sai para entrega → entregue.

## Entrega

Cada empresa poderá escolher entre:

- taxa fixa;
- cobrança por quilômetro;
- taxa mínima e distância máxima;
- futuramente faixas por distância e entrega grátis por valor mínimo.

## Stack

- Next.js + TypeScript
- Supabase PostgreSQL
- Supabase Auth
- Supabase Realtime
- Vercel

## Estrutura atual

- `/` landing inicial
- `/cliente` área inicial do cliente
- `/empresa` painel inicial da empresa
- `/supabase/schema.sql` banco multiempresa com RLS

## Próximo passo

Criar o projeto no Supabase, executar `supabase/schema.sql`, configurar as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` e conectar autenticação, catálogo e pedidos em tempo real.
