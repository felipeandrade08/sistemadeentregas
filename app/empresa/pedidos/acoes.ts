'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const transitions: Record<string, { next: string; label: string }> = {
  pending: { next: 'accepted', label: 'Aceitar pedido' },
  accepted: { next: 'preparing', label: 'Iniciar preparo' },
  preparing: { next: 'ready', label: 'Marcar como pronto' },
  ready: { next: 'out_for_delivery', label: 'Enviar para entrega' },
  out_for_delivery: { next: 'delivered', label: 'Marcar como entregue' },
}

export async function advanceOrder(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada. Entre novamente.' }

  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).maybeSingle()
  if (!profile?.company_id) return { error: 'Empresa não configurada.' }

  const { data: order } = await supabase.from('orders').select('id,status,driver_id').eq('id', orderId).eq('company_id', profile.company_id).maybeSingle()
  if (!order) return { error: 'Pedido não encontrado.' }

  const transition = transitions[order.status]
  if (!transition) return { error: 'Este pedido não pode avançar.' }

  const now = new Date().toISOString()
  const timestamps: Record<string, string> = {}
  if (transition.next === 'accepted') timestamps.accepted_at = now
  if (transition.next === 'preparing') timestamps.preparing_at = now
  if (transition.next === 'ready') timestamps.ready_at = now
  if (transition.next === 'out_for_delivery') timestamps.dispatched_at = now
  if (transition.next === 'delivered') timestamps.delivered_at = now

  const { error } = await supabase.from('orders').update({ status: transition.next, ...timestamps }).eq('id', orderId).eq('company_id', profile.company_id)
  if (error) return { error: error.message }

  if (transition.next === 'delivered' && order.driver_id) {
    await supabase.from('drivers').update({ is_available: true }).eq('id', order.driver_id).eq('company_id', profile.company_id)
  }

  revalidatePath('/empresa')
  revalidatePath('/empresa/pedidos')
  revalidatePath('/empresa/entregadores')
  return { ok: true, status: transition.next }
}

export async function rejectOrder(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada. Entre novamente.' }
  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).maybeSingle()
  if (!profile?.company_id) return { error: 'Empresa não configurada.' }
  const { error } = await supabase.from('orders').update({ status: 'rejected' }).eq('id', orderId).eq('company_id', profile.company_id).eq('status', 'pending')
  if (error) return { error: error.message }
  revalidatePath('/empresa')
  revalidatePath('/empresa/pedidos')
  return { ok: true }
}
