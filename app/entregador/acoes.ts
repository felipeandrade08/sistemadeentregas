'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function setDriverAvailability(available: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }
  const { data, error } = await supabase.rpc('set_driver_availability', { p_available: available })
  if (error) return { error: error.message }
  revalidatePath('/entregador')
  revalidatePath('/empresa/entregadores')
  return { ok: true, available: data?.is_available ?? available }
}

export async function completeDriverOrder(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { data: profile } = await supabase.from('profiles').select('company_id,role').eq('id', user.id).maybeSingle()
  if (!profile?.company_id || profile.role !== 'driver') return { error: 'Acesso não autorizado.' }

  const { data: driver } = await supabase.from('drivers').select('id,is_active').eq('company_id', profile.company_id).eq('user_id', user.id).maybeSingle()
  if (!driver?.is_active) return { error: 'Entregador inativo.' }

  const { error } = await supabase.from('orders').update({ status: 'delivered', delivered_at: new Date().toISOString() }).eq('id', orderId).eq('company_id', profile.company_id).eq('driver_id', driver.id).eq('status', 'out_for_delivery')
  if (error) return { error: error.message }

  await supabase.from('drivers').update({ is_available: true }).eq('id', driver.id).eq('company_id', profile.company_id)
  revalidatePath('/entregador')
  revalidatePath('/empresa')
  revalidatePath('/empresa/entregadores')
  return { ok: true }
}
