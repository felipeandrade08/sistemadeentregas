'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function completeDriverOrder(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { data: profile } = await supabase.from('profiles').select('company_id,role,full_name').eq('id', user.id).maybeSingle()
  if (!profile?.company_id || profile.role !== 'driver') return { error: 'Acesso não autorizado.' }

  const { data: driver } = await supabase.from('drivers').select('id,is_active').eq('company_id', profile.company_id).eq('name', profile.full_name || '').maybeSingle()
  if (!driver?.is_active) return { error: 'Entregador inativo.' }

  const { error } = await supabase.from('orders').update({ status: 'delivered', delivered_at: new Date().toISOString() }).eq('id', orderId).eq('company_id', profile.company_id).eq('driver_id', driver.id).eq('status', 'out_for_delivery')
  if (error) return { error: error.message }

  revalidatePath('/entregador')
  revalidatePath('/empresa')
  return { ok: true }
}