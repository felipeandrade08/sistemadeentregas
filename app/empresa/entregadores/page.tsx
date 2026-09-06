import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DriverForm from './DriverForm'
import DriverToggle from './DriverToggle'

export default async function EntregadoresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).maybeSingle()
  if (!profile?.company_id) redirect('/empresa/configurar')
  const { data: drivers, error } = await supabase.from('drivers').select('id,name,phone,is_active,created_at').eq('company_id', profile.company_id).order('is_active', { ascending: false }).order('name')

  return <main className="dashboard"><section className="dashboard-main">
    <div className="dashboard-title"><div><p className="eyebrow">OPERAÇÃO</p><h1>Entregadores</h1><p className="muted">Cadastre sua equipe e acompanhe quem está disponível para receber entregas.</p></div><Link className="secondary-button" href="/empresa">← Voltar aos pedidos</Link></div>
    {error && <div className="form-error">{error.message}</div>}
    <section className="stats-grid">
      <article className="stat-card"><div className="stat-label">Total</div><div className="stat-value">{drivers?.length ?? 0}</div></article>
      <article className="stat-card"><div className="stat-label">Ativos</div><div className="stat-value">{drivers?.filter(d => d.is_active).length ?? 0}</div></article>
      <article className="stat-card"><div className="stat-label">Status</div><div className="stat-value" style={{fontSize: '1.1rem'}}>Pronto para operar</div></article>
    </section>
    <section className="catalog-grid">
      <article className="panel"><h2>Novo entregador</h2><DriverForm /></article>
      <article className="panel"><p className="eyebrow">PRÓXIMA FASE</p><h2>Painel do motorista</h2><p className="muted">O cadastro já está preparado para receber atribuições. Na próxima etapa, cada motorista terá seu próprio acesso, poderá aceitar a corrida e atualizar o status até a entrega.</p></article>
    </section>
    <section className="panel"><div className="panel-header"><div><p className="eyebrow">EQUIPE</p><h2>Entregadores cadastrados</h2></div></div>
      {!drivers?.length ? <div className="empty-order">Nenhum entregador cadastrado ainda.</div> : <div className="product-list">{drivers.map(driver => <article className="product-row" key={driver.id}><div><strong>{driver.name}</strong><p className="muted">{driver.phone || 'Telefone não informado'} · cadastrado em {new Date(driver.created_at).toLocaleDateString('pt-BR')}</p></div><div className="status-pill">{driver.is_active ? '● Ativo' : '● Inativo'}</div><DriverToggle id={driver.id} active={driver.is_active} /></article>)}</div>}
    </section>
  </section></main>
}
