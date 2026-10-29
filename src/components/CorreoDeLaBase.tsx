import { useEffect, useState } from 'react'
import { parametrosPublicos } from '../lib/parametros'

/**
 * Un correo de contacto de VeciYo, como enlace (28/10/2026).
 *
 * Estaban escritos en las páginas legales (privacidad@, hola@). Ahora son los
 * ajustes `correo_privacidad` y `correo_contacto`, que el administrador de la
 * app cambia desde su panel. Mientras llega se enseñan unos puntos: no hay
 * correo de respaldo escrito aquí, porque es justo el que se quería quitar.
 */
export default function CorreoDeLaBase({ clave }: { clave: 'correo_privacidad' | 'correo_contacto' }) {
  const [correo, setCorreo] = useState<string | null>(null)

  useEffect(() => {
    let vigente = true
    parametrosPublicos()
      .then((p) => {
        if (vigente) setCorreo(p.texto(clave).trim())
      })
      .catch(() => {})
    return () => {
      vigente = false
    }
  }, [clave])

  if (!correo) return <span>…</span>
  return (
    <a className="underline" href={`mailto:${correo}`}>
      {correo}
    </a>
  )
}
