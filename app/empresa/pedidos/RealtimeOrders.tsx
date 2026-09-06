'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RealtimeOrders({ companyId }: { companyId: string }) {
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase.channel(`orders-${companyId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `company_id=eq.${companyId}` }, () => {
        window.dispatchEvent(new CustomEvent('entregaos:new-order'))
        window.location.reload()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `company_id=eq.${companyId}` }, () => {
        window.dispatchEvent(new CustomEvent('entregaos:order-updated'))
        window.location.reload()
      })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [companyId, supabase])

  return null
}
