import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { monedasDelMundo, type MonedaDelMundo } from '../lib/monedasDelMundo'

interface Props {
  label: string
  /** Código ISO 4217 elegido, como viaja a la base. */
  value: string
  onChange: (moneda: string) => void
}

const sinTildes = (t: string) =>
  t
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()

/**
 * La moneda de lo que pagó.
 *
 * QA 23/10/2026: buscarla también por país. 09/11/2026 (Correcciones fila 15):
 * cualquier moneda del mundo, no solo las de los países activos de la base
 * (que eran tres). Las de aquí --COP, PEN, USD-- van primero; se busca por el
 * nombre de la moneda, su código o el país (los países salen de la base, que
 * se lee sin sesión; si no carga, se busca igual por moneda).
 */
export default function SelectorDeMoneda({ label, value, onChange }: Props) {
  const [paisesPorMoneda, setPaisesPorMoneda] = useState<Map<string, string[]>>(new Map())
  const [busqueda, setBusqueda] = useState('')
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    if (!supabase) return
    let vigente = true
    supabase
      .from('pais')
      .select('nombre, moneda')
      .then(({ data, error }) => {
        if (!vigente || error) return
        const mapa = new Map<string, string[]>()
        for (const p of data ?? []) {
          if (!p.moneda) continue
          const lista = mapa.get(p.moneda as string) ?? []
          lista.push(p.nombre as string)
          mapa.set(p.moneda as string, lista)
        }
        setPaisesPorMoneda(mapa)
      })
    return () => {
      vigente = false
    }
  }, [])

  const opciones = useMemo(() => monedasDelMundo(paisesPorMoneda), [paisesPorMoneda])

  const filtradas = useMemo(() => {
    const q = sinTildes(busqueda)
    if (!q) return opciones
    return opciones.filter((o) => sinTildes(`${o.nombre} ${o.codigo} ${o.paises.join(' ')}`).includes(q))
  }, [busqueda, opciones])

  const elegida: MonedaDelMundo | undefined = opciones.find((o) => o.codigo === value)
  const etiqueta = elegida ? `${elegida.nombre} (${elegida.codigo})` : value || 'Elige la moneda'

  return (
    <div className="relative">
      <span className="mb-1.5 block text-sm font-medium text-ink/70">{label}</span>
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        className="w-full rounded-xl border border-line bg-surface-soft px-4 py-3 text-left text-sm text-ink"
      >
        {etiqueta}
      </button>
      {abierto && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-line bg-white p-2 shadow-lg">
          <input
            autoFocus
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Busca la moneda o el país"
            className="w-full rounded-lg border border-line px-3 py-2 text-base focus:border-brand focus:outline-none"
          />
          <ul className="mt-2 max-h-60 overflow-y-auto">
            {filtradas.map((o) => (
              <li key={o.codigo}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.codigo)
                    setBusqueda('')
                    setAbierto(false)
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-brand/5 ${
                    o.codigo === value ? 'font-bold text-ink' : 'text-ink/80'
                  }`}
                >
                  {o.nombre} ({o.codigo})
                  {o.paises.length ? <span className="text-ink/50"> · {o.paises.join(', ')}</span> : null}
                </button>
              </li>
            ))}
            {filtradas.length === 0 && (
              <li className="px-3 py-2 text-sm text-ink/60">Ninguna moneda ni país con ese nombre.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
