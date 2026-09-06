import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import OrderActions from './pedidos/OrderActions'
import AssignDriver from './pedidos/AssignDriver'
import RealtimeOrders from './pedidos/RealtimeOrders'

const columns = [['pending', 'Novos'], ['accepted', 'Aceitos'], ['preparing', 'Em preparação'], ['ready', 'Prontos']] as const

export default async function EmpresaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('full_name, role, company_id, companies(name,slug,phone,address)').eq('id', user.id).maybeSingle()
  if (!profile?.company_id) redirect('/empresa/configurar')

  const company = Array.isArray(profile.companies) ? profile.companies[0] : profile.companies
  const [{ data: orders }, { count: productCount }] = await Promise.all([
    supabase.from('orders').select('id, order_number, status, total, created_at, payment_method, delivery_fee, driver_id, drivers(name)').eq('company_id', profile.company_id).order('created_at', { ascending: false }).limit(100),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('company_id', profile.company_id).eq('is_active', true)
  ])

  const allOrders = orders || []
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const todayOrders = allOrders.filter(o => new Date(o.created_at) >= today)
  const todayRevenue = todayOrders.filter(o => !['rejected', 'cancelled'].includes(o.status)).reduce((sum, o) => sum + Number(o.total || 0), 0)
  const deliveredToday = todayOrders.filter(o => o.status === 'delivered').length
  const openOrders = allOrders.filter(o => !['delivered', 'rejected', 'cancelled'].includes(o.status)).length
  const money = (value: number) => `R$ ${Number(value).toFixed(2).replace('.', ',')}`
  const storeUrl = company?.slug ? `/cliente/${company.slug}` : '/empresa/configurar'

  return <main className="dashboard-shell">
    <RealtimeOrders companyId={profile.company_id} />
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand"><span>E</span><div><strong>ENTREGAOS</strong><small>Painel da empresa</small></div></div>
      <nav className="sidebar-nav">
        <p>OPERAÇÃO</p>
        <Link className="active" href="/empresa"><span>▦</span> Dashboard</Link>
        <Link href="/empresa/pedidos"><span>🛒</span> Pedidos</Link>
        <Link href="/empresa/produtos"><span>▤</span> Produtos</Link>
        <Link href="/empresa/produtos#categorias"><span>◈</span> Categorias</Link>
        <Link href="/empresa/entregadores"><span>🚚</span> Entregadores</Link>
        <p>EMPRESA</p>
        <Link href={storeUrl} target="_blank"><span>🏪</span> Minha loja</Link>
        <Link href="/empresa/configurar"><span>⚙</span> Configurações</Link>
      </nav>
      <div className="sidebar-footer"><div className="company-avatar">{(company?.name || 'E').charAt(0).toUpperCase()}</div><div><strong>{company?.name || 'Sua empresa'}</strong><small>{user.email}</small></div></div>
    </aside>

    <section className="dashboard-content">
      <header className="dashboard-topbar"><div><span className="mobile-brand">ENTREGAOS</span><p className="eyebrow">PAINEL DA EMPRESA</p><h1>Visão geral</h1></div><div className="topbar-actions"><Link className="store-button" href={storeUrl} target="_blank">↗ Abrir minha loja</Link><div className="status-pill">● Sistema online</div></div></header>

      <div className="welcome-row"><div><h2>{company?.name || 'Sua empresa'}</h2><p className="muted">Olá, {profile.full_name || user.email}. Aqui está o resumo da sua operação.</p></div><span className="date-label">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</span></div>

      <section className="stats-grid dashboard-stats">
        <article className="stat-card stat-highlight"><div className="stat-icon">$</div><div><div className="stat-label">Faturamento hoje</div><div className="stat-value">{money(todayRevenue)}</div><small>{todayOrders.length} pedido(s) hoje</small></div></article>
        <article className="stat-card"><div className="stat-icon">🛒</div><div><div className="stat-label">Pedidos hoje</div><div className="stat-value">{todayOrders.length}</div><small>Entradas de hoje</small></div></article>
        <article className="stat-card"><div className="stat-icon">⏱</div><div><div className="stat-label">Em aberto</div><div className="stat-value">{openOrders}</div><small>Aguardando operação</small></div></article>
        <article className="stat-card"><div className="stat-icon">✓</div><div><div className="stat-label">Entregues hoje</div><div className="stat-value">{deliveredToday}</div><small>{productCount || 0} produtos ativos</small></div></article>
      </section>

      <section className="quick-actions"><Link href="/empresa/produtos" className="quick-card"><span>＋</span><div><strong>Cadastrar produto</strong><small>Adicione itens à sua loja</small></div></Link><Link href="/empresa/entregadores" className="quick-card"><span>🚚</span><div><strong>Gerenciar entregadores</strong><small>Equipe e disponibilidade</small></div></Link><Link href={storeUrl} target="_blank" className="quick-card"><span>🏪</span><div><strong>Ver minha loja</strong><small>Confira como o cliente vê</small></div></Link></section>

      <div className="section-heading"><div><p className="eyebrow">TEMPO REAL</p><h2>Pedidos em andamento</h2></div><Link href="/empresa/pedidos" className="view-all">Ver todos →</Link></div>
      <section className="board">{columns.map(([status, title]) => { const items = allOrders.filter(order => order.status === status); return <article className="board-column" key={status}><div className="board-column-title"><h3>{title}</h3><span>{items.length}</span></div>{items.length === 0 ? <div className="empty-order">Nenhum pedido nesta etapa.</div> : items.slice(0, 8).map(order => <div className="order-card" key={order.id}><div className="order-card-top"><strong>#{order.order_number}</strong><span>{new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span></div><div className="order-total">{money(order.total)}</div><div className="order-meta">Pagamento: {order.payment_method.toUpperCase()} · Entrega: {money(order.delivery_fee)}</div>{status === 'ready' ? <AssignDriver orderId={order.id} companyId={profile.company_id} /> : <OrderActions orderId={order.id} status={order.status} />}</div>)}</article> })}</section>
    </section>
  </main>
}
