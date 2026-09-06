'use client'

import { FormEvent, useState, useTransition } from 'react'
import { createDriver } from './acoes'

export default function DriverForm() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [invite, setInvite] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function submit(event: FormEvent) {
    event.preventDefault(); setInvite(''); setError('')
    startTransition(async () => {
      const result = await createDriver(name, phone)
      if (result.error) setError(result.error)
      else if (result.inviteToken) {
        const url = `${window.location.origin}/cadastro?convite=${encodeURIComponent(result.inviteToken)}`
        setName(''); setPhone(''); setInvite(url)
      }
    })
  }

  async function copyInvite() {
    if (!invite) return
    await navigator.clipboard.writeText(invite)
  }

  return <form onSubmit={submit} className="auth-form">
    {error && <div className="form-error">{error}</div>}
    {invite && <div className="success-message"><strong>Entregador criado.</strong><br />Envie este link para ele criar a conta e entrar no painel.<div style={{ marginTop: 8, wordBreak: 'break-all', fontSize: '0.85rem' }}>{invite}</div><button type="button" className="secondary-button" style={{ marginTop: 10 }} onClick={() => void copyInvite()}>Copiar convite</button></div>}
    <label>Nome completo<input value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: João da Silva" required /></label>
    <label>Telefone<input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" inputMode="tel" /></label>
    <button className="primary-button" disabled={pending}>{pending ? 'Cadastrando...' : 'Cadastrar entregador'}</button>
  </form>
}
