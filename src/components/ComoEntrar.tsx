import { useState } from 'react'
import { POR_QUE_CREAR_LA_CUENTA } from '../lib/precheckin'
import Input from './Input'
import Button from './Button'
import { supabase } from '../lib/supabase'
import { porQueFallo } from '../lib/motivo'
import { recordarEntrada } from '../lib/precheckin'

interface Props {
  /** Ya eligió: se sigue al preregistro. */
  onListo: () => void
}

/**
 * Las tres formas de empezar el preregistro: como invitado, creando una
 * cuenta o iniciando sesión.
 *
 * Lo pidió la responsable de producto el 16/10/2026: «¿Ya tienes una cuenta?»
 * estaba en el segundo paso, cuando el huésped ya había empezado a escribir, y
 * tiene que estar al inicio.
 *
 * «Crear una cuenta» **no** la crea aquí («no crear la cuenta aún»): se apunta
 * la elección y la cuenta se crea al final, con el acceso que deja el
 * preregistro. Así nadie tiene que poner una contraseña antes de saber si su
 * reserva sigue en pie.
 *
 * «Iniciar sesión» se hace aquí mismo, sin salir de la página, y los datos de
 * su última estancia se ponen solos en el segundo paso.
 */
export default function ComoEntrar({ onListo }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [trabajando, setTrabajando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const elegir = (modo: 'invitado' | 'crear_cuenta') => {
    recordarEntrada(modo)
    onListo()
  }

  const entrar = async () => {
    if (!supabase || trabajando || !correo.includes('@') || !clave) return
    setTrabajando(true)
    setError(null)
    try {
      const { error: fallo } = await supabase.auth.signInWithPassword({
        email: correo.trim(),
        password: clave,
      })
      if (fallo) {
        setError('El correo o la contraseña no coinciden.')
        return
      }
      setClave('')
      recordarEntrada('sesion')
      onListo()
    } catch (e) {
      setError(porQueFallo(e, 'No pudimos iniciar sesión'))
    } finally {
      setTrabajando(false)
    }
  }

  if (abierto) {
    return (
      <div className="mt-8 space-y-3 text-left">
        <p className="text-sm font-semibold text-ink">
          ¿Ya tienes una cuenta en Veciyo? Inicia sesión y utiliza tus datos ya
          guardados
        </p>
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
        {error && <p className="text-xs font-semibold text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button
            type="button"
            className="flex-1 py-3"
            disabled={trabajando || !correo.includes('@') || !clave}
            onClick={() => void entrar()}
          >
            {trabajando ? 'Entrando…' : 'Iniciar sesión'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="flex-1 py-3"
            onClick={() => setAbierto(false)}
          >
            Volver
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-10 flex flex-col gap-3">
      <Button type="button" className="w-full py-3.5" onClick={() => elegir('invitado')}>
        Entrar como invitado
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="w-full py-3.5"
        onClick={() => elegir('crear_cuenta')}
      >
        Crear una cuenta
      </Button>
      {/*
        Las ventajas de la cuenta, para quien duda (QA 23/10/2026). Las mismas
        que al terminar el preregistro.
      */}
      <details className="rounded-xl bg-surface-soft px-4 py-3 text-sm text-ink/80">
        <summary className="cursor-pointer font-semibold text-ink">
          ¿Para qué crear una cuenta?
        </summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {POR_QUE_CREAR_LA_CUENTA.map((texto) => (
            <li key={texto}>{texto}</li>
          ))}
        </ul>
      </details>
      {supabase && (
        <Button
          type="button"
          variant="ghost"
          className="w-full py-3.5"
          onClick={() => setAbierto(true)}
        >
          Iniciar sesión
        </Button>
      )}
    </div>
  )
}
