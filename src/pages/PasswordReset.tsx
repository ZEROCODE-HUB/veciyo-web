import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'

/**
 * Poner una contraseña nueva, desde el enlace que llega por correo.
 *
 * Era una maqueta: el formulario tenía `onSubmit={(e) => e.preventDefault()}`
 * --no hacía nada-- y pedía «la contraseña actual recibida en el correo
 * electrónico», que es la idea que se descartó: aquí nadie manda contraseñas
 * por correo, llega un enlace.
 *
 * Y no estaba enrutada, así que ni siquiera se podía llegar a ella.
 *
 * Así funciona de verdad: Supabase manda un enlace de recuperación, al abrirlo
 * deja una sesión temporal en el navegador, y con ella se puede cambiar la
 * contraseña **una vez**. Sin esa sesión no hay nada que cambiar, y entonces
 * esta pantalla lo dice en vez de enseñar un formulario que va a fallar.
 *
 * Es la tercera de las tres cosas que faltaban para que recuperar la contraseña
 * funcione (REVISAR-A-OJO 58). Las otras dos --`site_url` y la lista de
 * redirecciones-- ya están puestas. Queda el servidor de correo.
 */
const MINIMO = 8

export default function PasswordReset() {
  const [sesion, setSesion] = useState<'buscando' | 'si' | 'no'>('buscando')
  const [clave, setClave] = useState('')
  const [repetida, setRepetida] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [listo, setListo] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setSesion('no')
      return
    }
    /*
      El enlace trae la sesión en el fragmento de la URL y el cliente la
      recoge al cargar. Se pregunta en vez de suponerlo: alguien puede llegar
      aquí escribiendo la dirección a mano.
    */
    supabase.auth
      .getSession()
      .then(({ data }) => setSesion(data.session ? 'si' : 'no'))
      .catch(() => setSesion('no'))
  }, [])

  const guardar = async () => {
    setError('')

    if (clave.length < MINIMO) {
      setError(`La contraseña tiene que tener al menos ${MINIMO} caracteres.`)
      return
    }
    if (clave !== repetida) {
      // Se comprueba antes de mandar nada: equivocarse al repetirla es lo más
      // común, y no hace falta un viaje al servidor para decirlo.
      setError('Las dos contraseñas no coinciden.')
      return
    }

    setGuardando(true)
    const { error: fallo } = await supabase!.auth.updateUser({ password: clave })
    setGuardando(false)

    if (fallo) {
      setError(fallo.message)
      return
    }
    setListo(true)
  }

  return (
    <MainLayout header="default" bg="page" center>
      <div className="w-full px-4 py-10 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-[560px] px-6 py-10 sm:px-12 sm:py-12">
          <h1 className="text-2xl font-bold text-ink sm:text-[28px]">
            Nueva contraseña
          </h1>

          {sesion === 'buscando' && (
            <p className="mt-6 text-sm text-gray-500">Comprobando el enlace...</p>
          )}

          {sesion === 'no' && (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-gray-600">
                Este enlace no es válido o ya venció. Los enlaces de
                recuperación duran poco a propósito.
              </p>
              <p className="text-sm text-gray-600">
                Pide uno nuevo desde la aplicación, en «Recuperar contraseña».
              </p>
              <Link to="/invitacion" className="text-sm font-semibold text-primary">
                Volver
              </Link>
            </div>
          )}

          {sesion === 'si' && !listo && (
            <form
              className="mt-8 space-y-5"
              onSubmit={(e) => {
                e.preventDefault()
                void guardar()
              }}
            >
              <Input
                label="Contraseña nueva"
                type="password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                placeholder={`Al menos ${MINIMO} caracteres`}
              />
              <Input
                label="Repítela"
                type="password"
                value={repetida}
                onChange={(e) => setRepetida(e.target.value)}
                placeholder="La misma, para no equivocarte"
              />

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" className="w-full py-3.5" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar contraseña'}
              </Button>
            </form>
          )}

          {listo && (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-gray-700">
                Listo. Ya puedes entrar en la aplicación con tu contraseña
                nueva.
              </p>
              <Link to="/invitacion" className="text-sm font-semibold text-primary">
                Volver
              </Link>
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  )
}
