import { useEffect, useState } from 'react'
import { parametrosPublicos } from '../lib/parametros'

/**
 * Los botones de App Store y Google Play.
 *
 * Los enlaces viven en la base (`tienda_app_store_url`,
 * `tienda_google_play_url`) y se cambian desde el panel: hoy son provisionales
 * porque la aplicación todavía no está publicada (hueco 4, 21/10/2026). Un
 * enlace vacío oculta su botón. Se enseñan cuando el huésped decidió crear su
 * cuenta, que es cuando le sirven (16/10/2026).
 */
const TIENDAS = [
  { nombre: 'App Store', clave: 'tienda_app_store_url', imagen: '/tiendas/app-store.png' },
  { nombre: 'Google Play', clave: 'tienda_google_play_url', imagen: '/tiendas/google-play.webp' },
]

export default function Tiendas() {
  const [enlaces, setEnlaces] = useState<Record<string, string>>({})

  useEffect(() => {
    let vigente = true
    parametrosPublicos()
      .then((p) => {
        if (!vigente) return
        const leidos: Record<string, string> = {}
        for (const t of TIENDAS) {
          try {
            const url = p.texto(t.clave).trim()
            if (/^https:\/\//.test(url)) leidos[t.clave] = url
          } catch {
            // Sin el parámetro no hay botón: mejor eso que un enlace inventado.
          }
        }
        setEnlaces(leidos)
      })
      .catch(() => {})
    return () => {
      vigente = false
    }
  }, [])

  const visibles = TIENDAS.filter((t) => enlaces[t.clave])
  if (visibles.length === 0) return null

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {visibles.map((t) => (
        <a
          key={t.nombre}
          href={enlaces[t.clave]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Descargar en ${t.nombre}`}
        >
          <img src={t.imagen} alt={`Descargar en ${t.nombre}`} className="h-11 w-auto" />
        </a>
      ))}
    </div>
  )
}
