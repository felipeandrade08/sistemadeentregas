'use client'

import { useTransition } from 'react'
import { toggleDriver } from './acoes'

export default function DriverToggle({ id, active }: { id: string; active: boolean }) {
  const [pending, startTransition] = useTransition()
  return <button className={active ? 'secondary-button' : 'primary-button'} disabled={pending} onClick={() => startTransition(async () => { const result = await toggleDriver(id, !active); if (result.error) alert(result.error); else window.location.reload() })}>{pending ? 'Salvando...' : active ? 'Desativar' : 'Ativar'}</button>
}
