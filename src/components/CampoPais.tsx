import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ChevronDownIcon } from './icons'
import { buscarPaises, paisPorCodigo } from '../lib/paises'

type Tone = 'default' | 'soft'

interface Props {
  label?: string
  /** ISO 3166-1 alfa-2. Es lo que se guarda. */
  value: string
  onChange: (codigo: string) => void
  placeholder?: string
  tone?: Tone
  /** Para el teléfono: el botón enseña el prefijo y la lista también. */
  conPrefijo?: boolean
  /** Nombre del botón para quien no ve el rótulo (el del teléfono no lo lleva). */
  ariaLabel?: string
  className?: string
  /** Para que el botón case con lo que tiene al lado (el número del teléfono). */
  claseBoton?: string
}

const tones: Record<Tone, string> = {
  default: 'bg-white border border-line shadow-[0_1px_2px_rgba(16,42,67,0.04)]',
  soft: 'bg-surface-soft border border-brand-100',
}

/**
 * Elegir un país con buscador (26/10/2026).
 *
 * Era un `<select>` nativo, que con treinta países bastaba. Con los 245 del
 * mundo, buscar el tuyo bajando por la lista en un celular no es razonable, y
 * el cliente lo pidió: «obvio que tenga su buscador». Se busca por nombre, sin
 * acentos, por código y por prefijo.
 *
 * Lo usan la nacionalidad y el país del teléfono.
 */
export default function CampoPais({
  label,
  value,
  onChange,
  placeholder = 'Seleccione',
  tone = 'default',
  conPrefijo = false,
  ariaLabel,
  className = '',
  claseBoton,
}: Props) {
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const caja = useRef<HTMLDivElement>(null)
  const id = useId()
  const elegido = paisPorCodigo(value)
  const resultados = useMemo(() => buscarPaises(busqueda), [busqueda])

  const cerrar = () => {
    setAbierto(false)
    setBusqueda('')
  }

  // Se cierra al pulsar fuera, como cualquier desplegable.
  useEffect(() => {
    if (!abierto) return
    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) cerrar()
    }
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [abierto])

  const elegir = (codigo: string) => {
    onChange(codigo)
    cerrar()
  }

  return (
    <div ref={caja} className={`relative ${className}`}>
      {label && (
        <label htmlFor={id} className="mb-2 block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-label={ariaLabel ? `${ariaLabel}: ${elegido?.nombre ?? 'sin elegir'}` : undefined}
        onClick={() => (abierto ? cerrar() : setAbierto(true))}
        className={`flex w-full items-center gap-2 text-left text-base outline-none transition focus:ring-2 focus:ring-brand/30 ${
          claseBoton ?? `rounded-field px-4 py-3 ${tones[tone]}`
        }`}
      >
        <span className={`min-w-0 flex-1 truncate ${elegido ? 'text-ink' : 'text-ink/40'}`}>
          {elegido ? (conPrefijo ? `+${elegido.prefijo}` : elegido.nombre) : placeholder}
        </span>
        <ChevronDownIcon className="h-5 w-5 shrink-0 text-ink" />
      </button>

      {abierto && (
        <div className="absolute left-0 top-full z-30 mt-1 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-line bg-white p-2 shadow-lg">
          <input
            autoFocus
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') cerrar()
              if (e.key === 'Enter' && resultados.length > 0) {
                e.preventDefault()
                elegir(resultados[0].codigo)
              }
            }}
            placeholder={conPrefijo ? 'Busca tu país o tu prefijo' : 'Busca tu país'}
            aria-label="Buscar un país"
            className="mb-2 w-full rounded-xl border border-line px-3 py-2.5 text-base text-ink outline-none placeholder:text-ink/40 focus:border-brand"
          />
          <ul role="listbox" aria-label="Países" className="max-h-72 overflow-y-auto">
            {resultados.map((p) => {
              const esElegido = p.codigo === elegido?.codigo
              return (
                <li key={p.codigo} role="option" aria-selected={esElegido}>
                  <button
                    type="button"
                    onClick={() => elegir(p.codigo)}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm ${
                      esElegido ? 'bg-brand-100 font-semibold text-ink' : 'text-ink/80 hover:bg-ink/[0.04]'
                    }`}
                  >
                    <span className="flex-1">{p.nombre}</span>
                    {conPrefijo && <span className="text-ink/50">+{p.prefijo}</span>}
                  </button>
                </li>
              )
            })}
            {resultados.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-ink/50">Ningún país con ese nombre.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
