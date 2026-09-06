'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })

    if (error || !data.user) {
      setError('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', data.user.id).maybeSingle()
    router.replace(profile?.company_id ? '/empresa' : '/empresa/configurar')
    router.refresh()
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-mark">E</div>
        <p className="eyebrow">ENTREGAOS</p>
        <h1>Entrar no painel</h1>
        <p className="muted">Gerencie pedidos, produtos e entregas da sua empresa.</p>
        <form onSubmit={handleLogin} className="auth-form">
          <label>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com" required /></label>
          <label>Senha<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} /></label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-button" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
        </form>
        <p className="muted" style={{ marginTop: 18 }}>Ainda não possui conta? <a href="/cadastro">Criar conta</a></p>
        <a href="/" className="back-link">← Voltar para o início</a>
      </section>
    </main>
  )
}
