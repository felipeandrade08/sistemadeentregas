'use client'

import { useState, useTransition } from 'react'
import { setDriverAvailability } from './acoes'

export default function AvailabilityToggle({ available }: { available: boolean }) {
  const [active, setActive] = useState(available)
  const [pending, startTransition] = useTransition()
  function toggle() {
    const next = !active
    startTransition(async () => {
      const result = await setDriverAvailability(next)
      if (result.ok) setActive(next)
    })
  }
  return <button className={active ? 'primary-button' : 'secondary-button'} disabled={pending} onClick={toggle}>{pending ? 'Salvando...' : active ? '● Disponível para entregas' : '○ Estou indisponível'}</button>
}
