import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import OrderActions from './OrderActions'
import AssignDriver from './AssignDriver'

const statusLabels: Record<string, string> = {
  pending: 'Novo',
  accepted: 'Aceito',
  preparing: 'Em preparo',
  ready: 'Pronto',
  out_for_delivery: 'Em entrega',
  delivered: 'Entregue',
  rejected: 'Recusado',
  cancelled: 'Cancelado',
}

const statusClass: Record<string, string> = {
  pending: 'status-pending',
  accepted: 'status-accepted',
  preparing: 'status-preparing',
  ready: 'status-ready',
  out_for_delivery: 'status-delivery',
  delivered: 'status-delivered',
  rejected: 'status-rejected',
  cancelled: 'status-rejected',
}

export default async function PedidosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('full_name, company_id, companies(name,slug)').eq('id', user.id).maybeSingle()
  if (!profile?.company_id) redirect('/empresa/configurar')

  const company = Array.isArray(profile.companies) ? profile.companies[0] : profile.companies
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_number, status, total, created_at, payment_method, payment_status, delivery_fee, driver_id, drivers(name)')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })
    .limit(200)

  const items = orders || []
  const open = items.filter(o => !['delivered', 'rejected', 'cancelled'].includes(o.status)).length
  const delivered = items.filter(o => o.status === 'delivered').length
  const money = (value: number) => `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`

  return <main className="dashboard-shell">
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand"><span>E</span><div><strong>ENTREGAOS</strong><small>Painel da empresa</small></div></div>
      <nav className="sidebar-nav">
        <p>OPERAÇÃO</p>
        <Link href="/empresa"><span>▦</span> Dashboard</Link>
        <Link className="active" href="/empresa/pedidos"><span>🛒</span> Pedidos</Link>
        <Link href="/empresa/produtos"><span>▤</span> Produtos</Link>
        <Link href="/empresa/produtos#categorias"><span>◈</span> Categorias</Link>
        <Link href="/empresa/entregadores"><span>🚚</span> Entregadores</Link>
        <p>EMPRESA</p>
        <Link href={company?.slug ? `/cliente/${company.slug}` : '/empresa/configurar'} target="_blank"><span>🏪</span> Minha loja</Link>
        <Link href="/empresa/configurar"><span>⚙</span> Configurações</Link>
      </nav>
      <div className="sidebar-footer"><div className="company-avatar">{(company?.name || 'E').charAt(0).toUpperCase()}</div><div><strong>{company?.name || 'Sua empresa'}</strong><small>{user.email}</small></div></div>
    </aside>

    <section className="dashboard-content">
      <header className="dashboard-topbar"><div><p className="eyebrow">OPERAÇÃO</p><h1>Pedidos</h1></div><Link className="store-button" href={company?.slug ? `/cliente/${company.slug}` : '/empresa/configurar'} target="_blank">↗ Abrir minha loja</Link></header>

      <section className="stats-grid dashboard-stats">
        <article className="stat-card"><div className="stat-icon">⏱</div><div><div className="stat-label">Em aberto</div><div className="stat-value">{open}</div><small>Pedidos aguardando operação</small></div></article>
        <article className="stat-card"><div className="stat-icon">✓</div><div><div className="stat-label">Entregues</div><div className="stat-value">{delivered}</div><small>Dentro dos últimos 200 pedidos</small></div></article>
        <article className="stat-card"><div className="stat-icon">#</div><div><div className="stat-label">Total exibido</div><div className="stat-value">{items.length}</div><small>Mais recentes primeiro</small></div></article>
      </section>

      {error && <div className="form-error">Não foi possível carregar os pedidos: {error.message}</div>}

      <section className="orders-table-card">
        <div className="section-heading"><div><p className="eyebrow">CENTRAL DE PEDIDOS</p><h2>Todos os pedidos</h2></div><span className="muted">Atualize a página para sincronizar novas entradas.</span></div>
        <div className="orders-list">
          {items.length === 0 ? <div className="empty-order">Ainda não há pedidos para esta empresa.</div> : items.map(order => {
            const driver = Array.isArray(order.drivers) ? order.drivers[0] : order.drivers
            return <article className="order-row" key={order.id}>
              <div className="order-row-main"><strong>#{order.order_number}</strong><span>{new Date(order.created_at).toLocaleString('pt-BR')}</span></div>
              <div><span className={`order-status ${statusClass[order.status] || ''}`}>{statusLabels[order.status] || order.status}</span><small>{driver?.name ? `Entregador: ${driver.name}` : 'Sem entregador'}</small></div>
              <div><strong>{money(order.total)}</strong><small>{String(order.payment_method).toUpperCase()} · {String(order.payment_status).toUpperCase()}</small></div>
              <div className="order-row-actions">{order.status === 'ready' ? <AssignDriver orderId={order.id} companyId={profile.company_id} /> : <OrderActions orderId={order.id} status={order.status} />}</div>
            </article>
          })}
        </div>
      </section>
    </section>
  </main>
}
