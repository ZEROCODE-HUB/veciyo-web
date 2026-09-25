import { useEffect, useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Card from '../components/Card'
import Input from '../components/Input'
import Select from '../components/Select'
import Checkbox from '../components/Checkbox'
import Button from '../components/Button'
import Loading from '../components/Loading'
import {
  cerrarPrecheckin,
  guardarAcompanante,
  listarAcompanantes,
  quitarAcompanante,

  tokenActual,
  TIPOS_DOCUMENTO,
  type Acompanante,
  type TipoDocumento,
} from '../lib/precheckin'

/**
 * Con quién viene el huésped, y el cierre del preregistro.
 *
 * Esta pantalla estaba entera sobre datos inventados: dos acompañantes fijos
 * en `MOCK_RESERVATION_COMPANIONS`, «María González» y «Luis González» con sus
 * documentos en `MOCK_EXTRACTED`, y un «Finalizar» que escribía
 * `localStorage.setItem('veciyo_registration_completed', 'true')` y no
 * guardaba a nadie en ninguna parte.
 *
 * Es lo que el cliente encontró por el otro lado: reservando la piscina como
 * huésped podía apuntar a personas que nunca habían pasado por portería,
 * porque la única lista que existía era la de las membresías de la vivienda.
 * Ahora los acompañantes son personas de esta estancia, con su documento, y
 * pasan por lo mismo que el titular.
 *
 * Los vehículos se quedan fuera por ahora, y queda dicho: la tabla ya tiene
 * placa, marca y color, pero conectar el formulario entero no cabía en este
 * paso y prefiero no dejar otro formulario que finge guardar.
 */
export default function Companions() {
  const navigate = useNavigate()
  const token = tokenActual()

  const [lista, setLista] = useState<Acompanante[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cerrando, setCerrando] = useState(false)

  const [nombre, setNombre] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [tipoDoc, setTipoDoc] = useState<TipoDocumento | ''>('')
  const [documento, setDocumento] = useState('')
  const [telefono, setTelefono] = useState('')
  const [esMenor, setEsMenor] = useState(false)

  useEffect(() => {
    if (!token) return
    listarAcompanantes(token)
      .then(setLista)
      .catch(() => setError('No pudimos cargar la lista'))
      .finally(() => setCargando(false))
  }, [token])

  if (!token) return <Navigate to="/invitacion" replace />

  const limpiar = () => {
    setNombre('')
    setApellidos('')
    setTipoDoc('')
    setDocumento('')
    setTelefono('')
    setEsMenor(false)
  }

  // La misma regla que aplica la base: un menor no lleva documento propio, un
  // adulto sí. Aquí solo para poder decir qué falta antes de ir por red.
  const puedeAnadir =
    nombre.trim() !== '' && (esMenor || documento.trim() !== '')

  const anadir = async () => {
    if (!puedeAnadir) return
    setError(null)
    try {
      await guardarAcompanante(token, {
        nombre: nombre.trim(),
        apellidos: apellidos.trim() || undefined,
        tipoDocumento: tipoDoc || undefined,
        documento: documento.trim() || undefined,
        telefono: telefono.trim() || undefined,
        esMenor,
      })
      setLista(await listarAcompanantes(token))
      limpiar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos añadirlo')
    }
  }

  const quitar = async (id: string) => {
    setError(null)
    try {
      await quitarAcompanante(token, id)
      setLista(await listarAcompanantes(token))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos quitarlo')
    }
  }

  const finalizar = async () => {
    setCerrando(true)
    setError(null)
    try {
      const acceso = await cerrarPrecheckin(token)
      navigate('/download-app', { state: { acceso } })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos cerrar el registro')
      setCerrando(false)
    }
  }

  return (
    <MainLayout header="default" bg="soft">
      <div className="mx-auto max-w-[640px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-brand">Paso 3 de 3</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand/20">
            <div className="h-full w-full rounded-full bg-brand" />
          </div>
        </div>

        <h1 className="mt-6 text-center font-display text-3xl font-bold text-ink sm:text-[34px]">
          ¿Viene alguien contigo?
        </h1>
        <p className="mx-auto mt-3 max-w-md text-center text-base text-ink/60">
          La portería necesita el documento de cada persona que se aloje
          contigo. Si vienes solo, continúa sin añadir a nadie.
        </p>

        {cargando ? (
          <div className="flex justify-center py-10">
            <Loading />
          </div>
        ) : (
          <>
            {lista.length > 0 && (
              <div className="mt-8 space-y-3">
                {lista.map((persona) => (
                  <Card key={persona.id} className="flex items-start justify-between gap-4 p-4">
                    <div>
                      <p className="text-sm font-bold text-ink">
                        {persona.nombre} {persona.apellidos ?? ''}
                      </p>
                      <p className="text-xs text-ink/60">
                        {persona.es_menor
                          ? 'Menor de edad · sin documento propio'
                          : persona.documento_numero}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => quitar(persona.id)}
                      className="shrink-0 text-xs font-semibold text-red-600 underline"
                      aria-label={`Quitar a ${persona.nombre}`}
                    >
                      Quitar
                    </button>
                  </Card>
                ))}
              </div>
            )}

            <div className="mt-8 rounded-2xl border border-line bg-white p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/50">
                Añadir a alguien
              </p>
              <div className="space-y-3">
                <Input
                  label="Nombres"
                  tone="soft"
                  placeholder="Como figura en el documento"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
                <Input
                  label="Apellidos"
                  tone="soft"
                  placeholder="Como figuran en el documento"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                />

                <Checkbox
                  label="Es menor de edad"
                  checked={esMenor}
                  onChange={(e) => {
                    setEsMenor(e.target.checked)
                    if (e.target.checked) {
                      setTipoDoc('')
                      setDocumento('')
                    }
                  }}
                />

                {/*
                  A un menor no se le pide documento propio ni se le hace
                  aceptar términos: los asume tu anfitrión, con un clic suyo,
                  desde su pantalla.
                */}
                {!esMenor && (
                  <>
                    <Select
                      label="Tipo de documento"
                      tone="soft"
                      placeholder="Seleccione"
                      options={TIPOS_DOCUMENTO as unknown as { value: string; label: string }[]}
                      value={tipoDoc}
                      onChange={(e) => setTipoDoc(e.target.value as TipoDocumento | '')}
                    />
                    <Input
                      label="Número de identificación"
                      tone="soft"
                      placeholder="Sin puntos ni guiones"
                      value={documento}
                      onChange={(e) => setDocumento(e.target.value)}
                    />
                    <Input
                      label="Teléfono (opcional)"
                      type="tel"
                      tone="soft"
                      placeholder="Ingrese el teléfono"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                    />
                  </>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full py-3"
                  disabled={!puedeAnadir}
                  onClick={anadir}
                >
                  Añadir a la reserva
                </Button>
                {!esMenor && nombre.trim() !== '' && documento.trim() === '' && (
                  <p className="px-1 text-xs text-ink/60">
                    Falta el número de documento. Es lo que la portería compara
                    cuando llegan.
                  </p>
                )}
              </div>
            </div>

            {error && (
              <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-700">
                {error}
              </p>
            )}

            <div className="flex justify-center pt-8">
              <Button
                type="button"
                className="w-full max-w-md py-3.5"
                disabled={cerrando}
                onClick={finalizar}
              >
                {cerrando ? 'Cerrando tu registro…' : 'Finalizar preregistro'}
              </Button>
            </div>
            {/* No es un detalle: cerrado el preregistro, la lista deja de
                tocarse desde este enlace. */}
            <p className="mt-3 text-center text-xs text-ink/60">
              Al finalizar ya no vas a poder cambiar esta lista desde aquí.
            </p>
          </>
        )}
      </div>
    </MainLayout>
  )
}
