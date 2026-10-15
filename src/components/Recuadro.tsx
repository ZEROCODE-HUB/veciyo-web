import type { InputHTMLAttributes } from 'react'

/**
 * El recuadro de dato de la maqueta: etiqueta pequeña en mayúsculas sobre el
 * valor, en un bloque `rounded-xl bg-surface-soft` (15/10/2026).
 *
 * En la maqueta eran de solo lectura porque los datos «salían del documento».
 * Aquí se escriben, así que el valor es un campo sin borde dentro del mismo
 * recuadro: se ve igual que la maqueta y se puede corregir. Sin `onChange`
 * queda de solo lectura, como el tipo de identificación.
 */
interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  etiqueta: string
  error?: string | null
}

export default function Recuadro({ etiqueta, error, value, onChange, ...resto }: Props) {
  return (
    <div>
      <label className="block rounded-xl border border-line bg-surface-soft px-4 py-3 focus-within:border-brand">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink/60">
          {etiqueta}
        </span>
        {onChange ? (
          <input
            {...resto}
            value={value}
            onChange={onChange}
            aria-invalid={error ? true : undefined}
            className="mt-0.5 w-full bg-transparent text-sm font-bold text-ink placeholder:font-normal placeholder:text-muted focus:outline-none"
          />
        ) : (
          <span className="mt-0.5 block text-sm font-bold text-ink">{value || '—'}</span>
        )}
      </label>
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </div>
  )
}
