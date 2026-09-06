'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function companyId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, error: 'Sessão expirada. Entre novamente.' }
  const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).maybeSingle()
  if (!profile?.company_id) return { supabase, error: 'Empresa não configurada.' }
  if (!['owner', 'manager', 'operator'].includes(profile.role)) return { supabase, error: 'Sem permissão para gerenciar entregadores.' }
  return { supabase, companyId: profile.company_id }
}

export async function createDriver(name: string, phone: string) {
  const ctx = await companyId()
  if (ctx.error) return { error: ctx.error }
  if (!name.trim()) return { error: 'Informe o nome do entregador.' }
  const { data, error } = await ctx.supabase.from('drivers').insert({ company_id: ctx.companyId, name: name.trim(), phone: phone.trim() || null, is_active: true }).select('id,invite_token').single()
  if (error) return { error: error.message }
  revalidatePath('/empresa/entregadores')
  return { ok: true, inviteToken: data.invite_token }
}

export async function toggleDriver(driverId: string, isActive: boolean) {
  const ctx = await companyId()
  if (ctx.error) return { error: ctx.error }
  const { error } = await ctx.supabase.from('drivers').update({ is_active: isActive, is_available: isActive }).eq('id', driverId).eq('company_id', ctx.companyId)
  if (error) return { error: error.message }
  revalidatePath('/empresa/entregadores')
  revalidatePath('/empresa')
  return { ok: true }
}

export async function assignDriver(orderId: string, driverId: string) {
  const ctx = await companyId()
  if (ctx.error) return { error: ctx.error }
  const { data: driver } = await ctx.supabase.from('drivers').select('id,name,is_available').eq('id', driverId).eq('company_id', ctx.companyId).eq('is_active', true).maybeSingle()
  if (!driver) return { error: 'Entregador não encontrado ou inativo.' }
  if (!driver.is_available) return { error: 'Este entregador está indisponível no momento.' }
  const { data: order } = await ctx.supabase.from('orders').select('id,status').eq('id', orderId).eq('company_id', ctx.companyId).maybeSingle()
  if (!order) return { error: 'Pedido não encontrado.' }
  if (order.status !== 'ready') return { error: 'Só é possível atribuir entregador a pedidos prontos.' }
  const { error } = await ctx.supabase.from('orders').update({ driver_id: driver.id, status: 'out_for_delivery', dispatched_at: new Date().toISOString() }).eq('id', orderId).eq('company_id', ctx.companyId).eq('status', 'ready')
  if (error) return { error: error.message }
  await ctx.supabase.from('drivers').update({ is_available: false }).eq('id', driver.id).eq('company_id', ctx.companyId)
  revalidatePath('/empresa')
  revalidatePath('/empresa/entregadores')
  return { ok: true, driverName: driver.name }
}
