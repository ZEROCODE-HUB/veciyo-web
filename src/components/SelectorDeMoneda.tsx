import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface OpcionDeMoneda {
  pais: string
  moneda: string
  nombreMoneda: string
}

interface Props {
  label: string
  /** Código ISO 4217 elegido, como viaja a la base. */
  value: string
  onChange: (moneda: string) => void
}

/**
 * La moneda de lo que pagó, buscándola por país (QA 23/10/2026).
 *
 * La responsable de producto pidió elegir la moneda «con país, que la búsqueda
 * funcione por país, en orden alfabético». Los países y su moneda salen de los
 * catálogos de la base (`pais`, `moneda`), que se leen sin sesión.
 */
export default function SelectorDeMoneda({ label, value, onChange }: Props) {
  const [opciones, setOpciones] = useState<OpcionDeMoneda[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    if (!supabase) return
    let vigente = true
    Promise.all([
      supabase.from('pais').select('nombre, moneda').eq('activo', true),
      supabase.from('moneda').select('codigo, nombre').eq('activa', true),
    ]).then(([paises, monedas]) => {
      if (!vigente || paises.error || monedas.error) return
      const nombreDe = new Map((monedas.data ?? []).map((m) => [m.codigo as string, m.nombre as string]))
      const lista = (paises.data ?? [])
        .filter((p) => p.moneda && nombreDe.has(p.moneda as string))
        .map((p) => ({
          pais: p.nombre as string,
          moneda: p.moneda as string,
          nombreMoneda: nombreDe.get(p.moneda as string) ?? '',
        }))
        .sort((a, b) => a.pais.localeCompare(b.pais, 'es'))
      setOpciones(lista)
    })
    return () => {
      vigente = false
    }
  }, [])

  const filtradas = useMemo(() => {
    const q = busqueda
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .trim()
    if (!q) return opciones
    return opciones.filter((o) =>
      `${o.pais} ${o.nombreMoneda} ${o.moneda}`
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .toLowerCase()
        .includes(q),
    )
  }, [busqueda, opciones])

  const elegida = opciones.find((o) => o.moneda === value)
  const etiqueta = elegida
    ? `${elegida.nombreMoneda} (${elegida.moneda})`
    : value || 'Elige el país de la moneda'

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
            placeholder="Busca el país"
            className="w-full rounded-lg border border-line px-3 py-2 text-base focus:border-brand focus:outline-none"
          />
          <ul className="mt-2 max-h-60 overflow-y-auto">
            {filtradas.map((o) => (
              <li key={`${o.pais}-${o.moneda}`}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.moneda)
                    setBusqueda('')
                    setAbierto(false)
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-brand/5 ${
                    o.moneda === value ? 'font-bold text-ink' : 'text-ink/80'
                  }`}
                >
                  {o.pais} · {o.nombreMoneda} ({o.moneda})
                </button>
              </li>
            ))}
            {filtradas.length === 0 && (
              <li className="px-3 py-2 text-sm text-ink/60">Ningún país con ese nombre.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
