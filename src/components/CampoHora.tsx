import { useState } from 'react'
import Input from './Input'
import Checkbox from './Checkbox'

interface Props {
  label: string
  /** «HH:MM», o vacía si no se sabe. */
  valor: string
  onChange: (valor: string) => void
}

/**
 * Una hora aproximada, con la salida de «Aún no sé».
 *
 * Lo pidió la responsable de producto el 16/10/2026: dejar la casilla vacía no
 * dice nada —puede ser que no la sepa o que se le pasó—. Marcar «Aún no sé»
 * guarda lo mismo que antes, vacía, pero el huésped lo elige.
 */
export default function CampoHora({ label, valor, onChange }: Props) {
  const [noSe, setNoSe] = useState(false)

  return (
    <div className="space-y-2">
      <Input
        label={label}
        type="time"
        tone="soft"
        value={noSe ? '' : valor}
        disabled={noSe}
        onChange={(e) => onChange(e.target.value)}
      />
      <Checkbox
        label="Aún no sé"
        checked={noSe}
        onChange={(e) => {
          setNoSe(e.target.checked)
          if (e.target.checked) onChange('')
        }}
      />
    </div>
  )
}
