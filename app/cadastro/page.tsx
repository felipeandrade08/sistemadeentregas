'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CadastroPage() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() } },
    })

    if (error) {
      setError(error.message.includes('already registered') ? 'Este e-mail já está cadastrado.' : error.message)
      setLoading(false)
      return
    }

    if (data.session) {
      router.replace('/empresa/configurar')
      router.refresh()
      return
    }

    setSuccess('Conta criada! Confirme seu e-mail e depois entre para configurar sua empresa.')
    setLoading(false)
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-mark">E</div>
        <p className="eyebrow">ENTREGAOS</p>
        <h1>Criar conta</h1>
        <p className="muted">Comece sua operação de pedidos e entregas.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>Nome do responsável<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required /></label>
          <label>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com" required /></label>
          <label>Senha<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo de 6 caracteres" minLength={6} required /></label>
          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}
          <button className="primary-button" disabled={loading}>{loading ? 'Criando conta...' : 'Criar minha conta'}</button>
        </form>

        <p className="muted" style={{ marginTop: 18 }}>Já possui conta? <a href="/login">Entrar</a></p>
        <a href="/" className="back-link">← Voltar para o início</a>
      </section>
    </main>
  )
}
