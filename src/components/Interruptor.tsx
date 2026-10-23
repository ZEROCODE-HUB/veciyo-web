import { useId } from 'react'

interface InterruptorProps {
  label: string
  checked: boolean
  onChange: (valor: boolean) => void
  disabled?: boolean
}

/**
 * Un interruptor de sí o no. Lo pidió la responsable de producto para las
 * opciones del acompañante (QA 23/10/2026): se lee mejor que una casilla
 * cuando la opción cambia lo que pide el formulario.
 */
export default function Interruptor({ label, checked, onChange, disabled = false }: InterruptorProps) {
  const id = useId()
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-center justify-between gap-4 select-none ${disabled ? 'opacity-50' : ''}`}
    >
      <span className="text-sm text-ink">{label}</span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-brand' : 'bg-muted/40'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  )
}
