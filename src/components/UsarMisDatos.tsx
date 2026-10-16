import { useEffect, useState } from 'react'
import Button from './Button'
import { supabase } from '../lib/supabase'
import { porQueFallo } from '../lib/motivo'
import { entradaElegida, misDatosParaPrecheckin, type MisDatos } from '../lib/precheckin'

interface Props {
  /** Los datos de su última estancia. Quien monta esto decide qué hace con ellos. */
  onDatos: (datos: MisDatos) => void
}

/**
 * Para quien ya se alojó: que no vuelva a escribirlo todo.
 *
 * Lo pidió el cliente el 09/10/2026. Desde el 16/10/2026 el inicio de sesión
 * se ofrece en la primera pantalla (`ComoEntrar`), no aquí. Si entró con su
 * sesión, sus datos se ponen solos al llegar; y mientras tenga la sesión
 * abierta, el botón sigue a mano por si los borró.
 *
 * Sin sesión no se ve nada.
 */
export default function UsarMisDatos({ onDatos }: Props) {
  const [conSesion, setConSesion] = useState(false)
  const [trabajando, setTrabajando] = useState(false)
  const [aviso, setAviso] = useState<{ bien: boolean; texto: string } | null>(null)

  const traer = async () => {
    const datos = await misDatosParaPrecheckin()
    if (!datos) {
      setAviso({ bien: false, texto: 'Tu cuenta todavía no tiene datos guardados.' })
      return
    }
    onDatos(datos)
    setAviso({ bien: true, texto: 'Pusimos tus datos guardados. Revisa que sigan siendo correctos.' })
  }

  const usar = async () => {
    if (trabajando) return
    setTrabajando(true)
    setAviso(null)
    try {
      await traer()
    } catch (e) {
      setAviso({ bien: false, texto: porQueFallo(e, 'No pudimos traer tus datos') })
    } finally {
      setTrabajando(false)
    }
  }

  useEffect(() => {
    let vigente = true
    void supabase?.auth.getSession().then(({ data }) => {
      if (!vigente) return
      const hay = Boolean(data.session)
      setConSesion(hay)
      // Eligió «Iniciar sesión» en la primera pantalla: se ponen solos.
      if (hay && entradaElegida() === 'sesion') void usar()
    })
    return () => {
      vigente = false
    }
    // Solo al montar: `usar` cambia en cada render y repetirlo pisaría lo que
    // el huésped corrija.
  }, [])

  if (!supabase || !conSesion) return null

  return (
    <div className="mt-6 rounded-xl bg-surface-soft px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink/80">Ya tienes cuenta en Veciyo.</p>
        <Button
          type="button"
          variant="ghost"
          className="px-4 py-2"
          disabled={trabajando}
          onClick={() => void usar()}
        >
          {trabajando ? 'Buscando…' : 'Usar mis datos guardados'}
        </Button>
      </div>

      {aviso && (
        <p
          className={`mt-2 text-xs font-semibold ${
            aviso.bien ? 'text-success' : 'text-danger'
          }`}
        >
          {aviso.texto}
        </p>
      )}
    </div>
  )
}
