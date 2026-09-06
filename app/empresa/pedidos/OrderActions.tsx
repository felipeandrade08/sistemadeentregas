'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { advanceOrder, rejectOrder } from './acoes'

export default function OrderActions({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const canAdvance = ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery'].includes(status)
  const label: Record<string, string> = {
    pending: 'Aceitar', accepted: 'Preparar', preparing: 'Marcar pronto', ready: 'Enviar', out_for_delivery: 'Entregue',
  }

  if (!canAdvance) return null

  function run(action: () => Promise<{ ok?: boolean; error?: string }>) {
    setError('')
    startTransition(async () => {
      const result = await action()
      if (result.error) setError(result.error)
      else router.refresh()
    })
  }

  return <div className="order-actions">
    <button className="primary-button" disabled={pending} onClick={() => run(() => advanceOrder(orderId))}>{pending ? 'Salvando...' : label[status]}</button>
    {status === 'pending' && <button className="danger-button" disabled={pending} onClick={() => run(() => rejectOrder(orderId))}>Recusar</button>}
    {error && <p className="form-error">{error}</p>}
  </div>
}
