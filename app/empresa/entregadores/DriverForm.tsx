'use client'

import { FormEvent, useState, useTransition } from 'react'
import { createDriver } from './acoes'

export default function DriverForm() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function submit(event: FormEvent) {
    event.preventDefault(); setMessage(''); setError('')
    startTransition(async () => {
      const result = await createDriver(name, phone)
      if (result.error) setError(result.error)
      else { setName(''); setPhone(''); setMessage('Entregador cadastrado com sucesso.'); window.location.reload() }
    })
  }

  return <form onSubmit={submit} className="auth-form">
    {error && <div className="form-error">{error}</div>}
    {message && <div className="success-message">{message}</div>}
    <label>Nome completo<input value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: João da Silva" required /></label>
    <label>Telefone<input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" inputMode="tel" /></label>
    <button className="primary-button" disabled={pending}>{pending ? 'Cadastrando...' : 'Cadastrar entregador'}</button>
  </form>
}
