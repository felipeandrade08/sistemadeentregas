'use client'

import { useTransition } from 'react'
import { completeDriverOrder } from './acoes'

export default function DriverOrderActions({ orderId, status }: { orderId: string; status: string }) {
  const [pending, startTransition] = useTransition()
  if (status !== 'out_for_delivery') return null
  return <button className="primary-button" disabled={pending} onClick={() => startTransition(() => { void completeDriverOrder(orderId) })}>{pending ? 'Salvando...' : 'Marcar como entregue'}</button>
}