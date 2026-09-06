import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, company_id, companies(name)')
    .eq('id', user.id)
    .maybeSingle()

  const company = Array.isArray(profile?.companies) ? profile?.companies[0] : profile?.companies

  const { data: orders } = profile?.company_id
    ? await supabase.from('orders').select('id, order_number, status, total, created_at').eq('company_id', profile.company_id).order('created_at', { ascending: false }).limit(100)
    : { data: [] }

  const counts = Object.fromEntries(columns.map(([status]) => [status, orders?.filter((o) => o.status === status).length ?? 0]))

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-brand"><span>E</span> ENTREGAOS</div>
        <div className="status-pill">● Sistema online</div>
      </header>

      <section className="dashboard-main">
        <div className="dashboard-title">
          <div>
            <p className="eyebrow">{company?.name || 'EMPRESA'}</p>
            <h1>Pedidos</h1>
            <p className="muted">Olá, {profile?.full_name || user.email}. Acompanhe sua operação em um só lugar.</p>
          </div>
        </div>

        <section className="stats-grid">
          <article className="stat-card"><div className="stat-label">Novos</div><div className="stat-value">{counts.pending}</div></article>
          <article className="stat-card"><div className="stat-label">Em preparação</div><div className="stat-value">{counts.preparing}</div></article>
          <article className="stat-card"><div className="stat-label">Prontos</div><div className="stat-value">{counts.ready}</div></article>
          <article className="stat-card"><div className="stat-label">Total em aberto</div><div className="stat-value">{(orders || []).filter((o) => !['delivered','rejected','cancelled'].includes(o.status)).length}</div></article>
        </section>

        <section className="board">
          {columns.map(([status, title]) => {
            const items = orders?.filter((order) => order.status === status) ?? []
            return (
              <article className="board-column" key={status}>
                <h2>{title} · {items.length}</h2>
                {items.length === 0 ? <div className="empty-order">Nenhum pedido nesta etapa.</div> : items.slice(0, 20).map((order) => (
                  <div className="empty-order" key={order.id} style={{ marginBottom: 10, borderStyle: 'solid' }}>
                    <strong>Pedido #{order.order_number}</strong>
                    <div style={{ marginTop: 6 }}>R$ {Number(order.total).toFixed(2).replace('.', ',')}</div>
                  </div>
                ))}
              </article>
            )
          })}
        </section>
      </section>
    </main>
  )
}
