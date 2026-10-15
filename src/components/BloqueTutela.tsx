import type { ReactNode } from 'react'

/**
 * El bloque del menor de la maqueta (15/10/2026): el aviso de protección y
 * «Documentación de tutela requerida», en `bg-gold/5`.
 *
 * El texto es el literal de la maqueta, recuperado a pedido del cliente: se
 * había quedado solo en la portería y en el aviso de «Antes de empezar».
 */
export const TEXTO_PROTECCION_MENORES =
  'Este condominio tiene principal interés en proteger la integridad de los menores de edad y prevenir la explotación comercial sexual de las niñas, niños y adolescentes.'

export default function BloqueTutela({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl bg-gold/5 px-5 py-4">
      <div className="mb-4 rounded-lg bg-brand/5 px-4 py-3">
        <p className="text-sm font-semibold text-ink">{TEXTO_PROTECCION_MENORES}</p>
      </div>
      <p className="mb-3 text-sm font-semibold text-ink">Documentación de tutela requerida</p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}
