import { CheckIcon, ClockIcon } from './icons'

/**
 * Una línea de «Estado de validación», como en la maqueta (15/10/2026).
 *
 *  · `hecho`: fondo `bg-success/5`, palomita.
 *  · `pendiente`: fondo `bg-gold/10`, el reloj de la maqueta (el búho girando
 *    se veía con su texto «Veciyo» y desbordaba la línea).
 *  · `exento`: fondo `bg-brand/5`, palomita en azul (lo aceptó otro por ella).
 *
 * Las clases van escritas enteras: Tailwind no ve las que se arman con `${}`.
 */
export type EstadoHito = 'hecho' | 'pendiente' | 'exento'

const ESTILO: Record<Exclude<EstadoHito, 'pendiente'>, { fondo: string; texto: string }> = {
  hecho: { fondo: 'bg-success/5', texto: 'text-success' },
  exento: { fondo: 'bg-brand/5', texto: 'text-brand' },
}

export default function Hito({ estado, children }: { estado: EstadoHito; children: string }) {
  if (estado === 'pendiente') {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-gold/10 px-3 py-2">
        <ClockIcon className="h-4 w-4 shrink-0 text-gold" />
        <span className="text-xs font-semibold text-gold">{children}</span>
      </div>
    )
  }
  const { fondo, texto } = ESTILO[estado]
  return (
    <div className={`flex items-center gap-2 rounded-lg ${fondo} px-3 py-2`}>
      <CheckIcon className={`h-4 w-4 shrink-0 ${texto}`} />
      <span className={`text-xs font-semibold ${texto}`}>{children}</span>
    </div>
  )
}
