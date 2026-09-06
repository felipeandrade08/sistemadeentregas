'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function makeSlug(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function ConfigurarEmpresaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }
    const { error } = await supabase.rpc('create_company_for_current_user', { p_name: name, p_slug: makeSlug(slug || name), p_phone: phone || null, p_address: address || null })
    if (error) { setError(error.code === '23505' ? 'Este endereço da loja já está em uso. Escolha outro.' : error.message); setLoading(false); return }
    router.replace('/empresa'); router.refresh()
  }

  const previewSlug = makeSlug(slug || name) || 'sua-empresa'
  return (
    <main className="auth-page">
      <section className="auth-card" style={{ maxWidth: 560 }}>
        <div className="brand-mark">E</div><p className="eyebrow">PRIMEIRO PASSO</p>
        <h1>Configure sua empresa</h1><p className="muted">Esses dados serão usados para criar sua loja e organizar seus pedidos.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>Nome da empresa<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Mercado do Felipe" required /></label>
          <label>Identificador da loja (slug)<input value={slug} onChange={(e) => setSlug(makeSlug(e.target.value))} placeholder="mercado-do-felipe" /></label>
          <small className="muted">Sua loja usará o identificador <strong>{previewSlug}</strong>.</small>
          <label>Telefone / WhatsApp<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" /></label>
          <label>Endereço<input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro, cidade" /></label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-button" disabled={loading}>{loading ? 'Criando empresa...' : 'Criar empresa e continuar'}</button>
        </form>
      </section>
    </main>
  )
}
