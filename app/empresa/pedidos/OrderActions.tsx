'use client'

import { useTransition } from 'react'
import { advanceOrder, rejectOrder } from './acoes'

export default function OrderActions({ orderId, status }: { orderId: string; status: string }) {
  const [pending, startTransition] = useTransition()
  const canAdvance = ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery'].includes(status)
  const label: Record<string, string> = {
    pending: 'Aceitar', accepted: 'Preparar', preparing: 'Marcar pronto', ready: 'Enviar', out_for_delivery: 'Entregue',
  }
  if (!canAdvance) return null
  return <div className="order-actions">
    <button className="primary-button" disabled={pending} onClick={() => startTransition(() => { void advanceOrder(orderId) })}>{pending ? 'Salvando...' : label[status]}</button>
    {status === 'pending' && <button className="danger-button" disabled={pending} onClick={() => startTransition(() => { void rejectOrder(orderId) })}>Recusar</button>}
  </div>
}
