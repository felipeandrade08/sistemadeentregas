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

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }

    router.replace('/empresa')
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
          <label>
            E-mail
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com" required />
          </label>
          <label>
            Senha
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
          </label>

          {error && <div className="form-error">{error}</div>}

          <button className="primary-button" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <a href="/" className="back-link">← Voltar para o início</a>
      </section>
    </main>
  )
}
