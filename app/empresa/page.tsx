import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import OrderActions from './pedidos/OrderActions'

const columns = [
  ['pending', 'Novos'],
  ['accepted', 'Aceitos'],
  ['preparing', 'Em preparação'],
  ['ready', 'Prontos'],
] as const

export default async function EmpresaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('full_name, role, company_id, companies(name)').eq('id', user.id).maybeSingle()
  if (!profile?.company_id) redirect('/empresa/configurar')
  const company = Array.isArray(profile.companies) ? profile.companies[0] : profile.companies
  const { data: orders } = await supabase.from('orders').select('id, order_number, status, total, created_at, payment_method, delivery_fee').eq('company_id', profile.company_id).order('created_at', { ascending: false }).limit(100)
  const counts = Object.fromEntries(columns.map(([status]) => [status, orders?.filter((o) => o.status === status).length ?? 0]))
  const money = (value: number) => `R$ ${Number(value).toFixed(2).replace('.', ',')}`

  return <main className="dashboard">
    <header className="dashboard-header"><div className="dashboard-brand"><span>E</span> ENTREGAOS</div><div className="dashboard-nav"><Link href="/empresa">Pedidos</Link><Link href="/empresa/produtos">Produtos</Link><div className="status-pill">● Sistema online</div></div></header>
    <section className="dashboard-main">
      <div className="dashboard-title"><div><p className="eyebrow">{company?.name || 'EMPRESA'}</p><h1>Pedidos</h1><p className="muted">Olá, {profile.full_name || user.email}. Acompanhe sua operação em tempo real.</p></div></div>
      <section className="stats-grid"><article className="stat-card"><div className="stat-label">Novos</div><div className="stat-value">{counts.pending}</div></article><article className="stat-card"><div className="stat-label">Em preparação</div><div className="stat-value">{counts.preparing}</div></article><article className="stat-card"><div className="stat-label">Prontos</div><div className="stat-value">{counts.ready}</div></article><article className="stat-card"><div className="stat-label">Total em aberto</div><div className="stat-value">{(orders || []).filter((o) => !['delivered','rejected','cancelled'].includes(o.status)).length}</div></article></section>
      <section className="board">
        {columns.map(([status, title]) => { const items = orders?.filter((order) => order.status === status) ?? []; return <article className="board-column" key={status}><h2>{title} · {items.length}</h2>{items.length === 0 ? <div className="empty-order">Nenhum pedido nesta etapa.</div> : items.slice(0, 20).map((order) => <div className="order-card" key={order.id}><div className="order-card-top"><strong>Pedido #{order.order_number}</strong><span>{new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span></div><div className="order-total">{money(order.total)}</div><div className="order-meta">Pagamento: {order.payment_method.toUpperCase()} · Entrega: {money(order.delivery_fee)}</div><OrderActions orderId={order.id} status={order.status} /></div>)}</article> })}
      </section>
    </section>
  </main>
}
