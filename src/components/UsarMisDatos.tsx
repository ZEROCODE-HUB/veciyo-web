import { useEffect, useState } from 'react'
import Input from './Input'
import Button from './Button'
import { supabase } from '../lib/supabase'
import { porQueFallo } from '../lib/motivo'
import { misDatosParaPrecheckin, type MisDatos } from '../lib/precheckin'

interface Props {
  /** Los datos de su última estancia. Quien monta esto decide qué hace con ellos. */
  onDatos: (datos: MisDatos) => void
}

/**
 * Para quien ya se alojó: que no vuelva a escribirlo todo.
 *
 * Lo pidió el cliente el 09/10/2026. Al terminar un preregistro se invita al
 * huésped a crear su cuenta, y hasta ese día la cuenta no le servía de nada la
 * segunda vez: llegaba al formulario en blanco igual que un desconocido.
 *
 * Con sesión, un botón. Sin sesión, una línea que la ofrece —y el inicio de
 * sesión se hace **aquí mismo**, sin salir del preregistro: mandarlo a otra
 * página y traerlo de vuelta es la forma de perderlo por el camino—.
 *
 * Es opcional de principio a fin: quien no tiene cuenta no ve más que una
 * línea, y la puede ignorar.
 */
export default function UsarMisDatos({ onDatos }: Props) {
  const [conSesion, setConSesion] = useState(false)
  const [abierto, setAbierto] = useState(false)
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [trabajando, setTrabajando] = useState(false)
  const [aviso, setAviso] = useState<{ bien: boolean; texto: string } | null>(null)

  useEffect(() => {
    let vigente = true
    void supabase?.auth.getSession().then(({ data }) => {
      if (vigente) setConSesion(Boolean(data.session))
    })
    return () => {
      vigente = false
    }
  }, [])

  if (!supabase) return null

  const traer = async () => {
    const datos = await misDatosParaPrecheckin()
    if (!datos) {
      setAviso({ bien: false, texto: 'Tu cuenta todavía no tiene datos guardados.' })
      return
    }
    onDatos(datos)
    setAviso({ bien: true, texto: 'Listo. Revisa que sigan siendo correctos.' })
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

  const entrar = async () => {
    if (trabajando || !correo.includes('@') || !clave) return
    setTrabajando(true)
    setAviso(null)
    try {
      const { error } = await supabase!.auth.signInWithPassword({
        email: correo.trim(),
        password: clave,
      })
      if (error) {
        setAviso({ bien: false, texto: 'El correo o la contraseña no coinciden.' })
        return
      }
      setConSesion(true)
      setAbierto(false)
      setClave('')
      await traer()
    } catch (e) {
      setAviso({ bien: false, texto: porQueFallo(e, 'No pudimos iniciar sesión') })
    } finally {
      setTrabajando(false)
    }
  }

  return (
    <div className="mt-6 rounded-xl bg-surface-soft px-4 py-3">
      {conSesion ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink/80">Ya tienes cuenta en Veciyo.</p>
          <Button
            type="button"
            variant="ghost"
            className="px-4 py-2"
            disabled={trabajando}
            onClick={() => void usar()}
          >
            {trabajando ? 'Buscando…' : 'Usar los datos de mi última estancia'}
          </Button>
        </div>
      ) : abierto ? (
        <div className="space-y-3">
          <Input
            label="Correo de tu cuenta"
            type="email"
            tone="soft"
            autoComplete="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
          <Input
            label="Contraseña"
            type="password"
            tone="soft"
            autoComplete="current-password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void entrar()
            }}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              className="flex-1 py-2.5"
              disabled={trabajando || !correo.includes('@') || !clave}
              onClick={() => void entrar()}
            >
              {trabajando ? 'Entrando…' : 'Entrar y usar mis datos'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="flex-1 py-2.5"
              onClick={() => setAbierto(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="text-sm font-semibold text-primary underline"
        >
          ¿Ya te alojaste con Veciyo? Inicia sesión y no vuelvas a escribirlo
        </button>
      )}

      {aviso && (
        <p
          className={`mt-2 text-xs font-semibold ${
            aviso.bien ? 'text-green-700' : 'text-red-600'
          }`}
        >
          {aviso.texto}
        </p>
      )}
    </div>
  )
}
