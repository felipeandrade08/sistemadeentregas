'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { assignDriver } from '../entregadores/acoes'

interface Driver { id: string; name: string; phone: string | null }

export default function AssignDriver({ orderId, companyId }: { orderId: string; companyId: string }) {
  const supabase = createClient()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [driverId, setDriverId] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    let mounted = true
    supabase.from('drivers').select('id,name,phone').eq('company_id', companyId).eq('is_active', true).order('name').then(({ data }) => { if (mounted) setDrivers(data || []) })
    return () => { mounted = false }
  }, [companyId, supabase])

  function dispatch() {
    if (!driverId) { setError('Selecione um entregador.'); return }
    setError('')
    startTransition(async () => {
      const result = await assignDriver(orderId, driverId)
      if (result.error) setError(result.error)
      else window.location.reload()
    })
  }

  return <div className="assign-driver">
    <select value={driverId} onChange={e => setDriverId(e.target.value)} disabled={pending}>
      <option value="">Escolher entregador</option>
      {drivers.map(driver => <option key={driver.id} value={driver.id}>{driver.name}{driver.phone ? ` · ${driver.phone}` : ''}</option>)}
    </select>
    <button className="primary-button" disabled={pending || !drivers.length} onClick={dispatch}>{pending ? 'Enviando...' : 'Enviar para entrega'}</button>
    {!drivers.length && <p className="muted">Cadastre um entregador ativo em Entregadores.</p>}
    {error && <p className="form-error">{error}</p>}
  </div>
}
