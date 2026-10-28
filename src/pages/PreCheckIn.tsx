import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Select from '../components/Select'
import Button from '../components/Button'
import FileUploader from '../components/FileUploader'
import Loading from '../components/Loading'
import { porQueFallo } from '../lib/motivo'
import { useDocumentos } from '../lib/useDocumentos'
import {
  subirDocumentoPrecheckin,
  consultarPrecheckin,
  estadoDeLaReserva,
  fichaDelPrecheckin,
  avisoDeLlegada,
  tieneDosCaras,
  tokenActual,
  type EstanciaPrecheckin,
  type TipoDocumento,
} from '../lib/precheckin'

/**
 * Primer paso del preregistro: qué documento trae el huésped.
 *
 * Estaba entera escrita a mano --«Bienvenido Carlos Balazo», «edificio Los
 * Pinos», documento «1616516»--, así que le daba la bienvenida a Carlos a
 * cualquiera que abriera el enlace.
 *
 * Y la lista de documentos no era la de la base: ofrecía «dni | pasaporte |
 * extranjero | otro» con la etiqueta «Cédula» encima de `dni`. En Colombia la
 * cédula es `cedula_ciudadania`; `dni` es otra cosa y «otro» no existe. Ahora
 * los valores son los que la base acepta, en `lib/precheckin.ts`.
 */
export default function PreCheckIn() {
  const navigate = useNavigate()
  const token = tokenActual()
  // Los documentos del país del edificio y sus reglas (25/10/2026).
  const { documentos, error: errorDocumentos } = useDocumentos(token)

  const [estancia, setEstancia] = useState<EstanciaPrecheckin | null>(null)
  const [cargando, setCargando] = useState(true)
  const [docType, setDocType] = useState<TipoDocumento | null>(null)
  const [comenzado, setComenzado] = useState(false)
  const [frente, setFrente] = useState<File | null>(null)
  const [reverso, setReverso] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [errorFoto, setErrorFoto] = useState('')
  // «Faltan 3 días»: lo pidió la responsable de producto (14/10/2026).
  const [aviso, setAviso] = useState<string | null>(null)
  // Para el «Bienvenido {nombre}» de la maqueta. Vacío si el anfitrión no lo
  // puso o es el nombre de relleno: entonces «Bienvenido, …».
  const [nombre, setNombre] = useState('')

  useEffect(() => {
    if (!token) {
      navigate('/invitacion', { replace: true })
      return
    }
    let vigente = true
    consultarPrecheckin(token)
      .then((datos) => {
        if (!vigente) return
        if (!datos || !datos.vigente) navigate('/invitacion', { replace: true })
        else setEstancia(datos)
      })
      .catch(() => vigente && navigate('/invitacion', { replace: true }))
      .finally(() => vigente && setCargando(false))
    estadoDeLaReserva(token)
      .then((r) => vigente && setAviso(avisoDeLlegada(r?.estado, r?.diasParaLlegar ?? 0)))
      .catch(() => {})
    fichaDelPrecheckin(token)
      .then((f) => vigente && setNombre(f?.nombre?.trim() ?? ''))
      .catch(() => {})
    return () => {
      vigente = false
    }
  }, [token, navigate])

  /*
    Desde el 16/10/2026 las fotos son **obligatorias** (responsable de
    producto: «obligatorio cargar documentos», el mismo flujo para el titular y
    para cada acompañante). Antes eran opcionales.

    Hasta el 02/10/2026 se elegian y se quedaban en la memoria de la pestaña:
    el bucket es privado, sus politicas derivan de quien puede ver la visita, y
    quien hace el preregistro no tiene sesion. No habia a quien darle el
    permiso. Lo resuelve `subir-documento-precheckin`, una funcion de servidor
    que comprueba el enlace antes de dejar escribir nada.

    Si la subida falla, no se sigue: se dice por qué y se puede reintentar.
  */
  const regla = documentos?.regla(docType) ?? null
  const faltanFotos = tieneDosCaras(regla)
    ? !(frente && reverso)
    : !frente

  /**
   * Sube lo que haya y pasa al siguiente paso.
   *
   * Las dos caras van por separado, que es como las saca una persona. Un fallo
   * no detiene el preregistro: se avisa y se sigue, porque el dato que de
   * verdad hace falta --el numero-- ya esta.
   */
  const continuar = async () => {
    if (!token || faltanFotos) return
    setErrorFoto('')
    setSubiendo(true)
    try {
      if (frente) await subirDocumentoPrecheckin(token, frente, 'frente')
      if (reverso) await subirDocumentoPrecheckin(token, reverso, 'reverso')
    } catch (e) {
      setErrorFoto(porQueFallo(e, 'No se pudo guardar la foto del documento'))
      setSubiendo(false)
      return
    }
    setSubiendo(false)
    navigate('/confirm-data', { state: { docType } })
  }

  if (cargando) {
    return (
      <MainLayout header="default" bg="soft">
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loading />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout header="default" bg="soft">
      <div className="mx-auto max-w-[640px] px-4 py-10 sm:px-6 lg:px-8">
        {aviso ? (
          <p className="mb-3 inline-block rounded-full bg-brand/10 px-3 py-1 text-sm font-bold text-brand">
            {aviso}
          </p>
        ) : null}
        <h1 className="font-display text-2xl font-extrabold leading-snug text-ink sm:text-[40px] sm:leading-tight">
          Bienvenido{nombre ? ` ${nombre}` : ''}, este es el preregistro de
          seguridad del edificio {estancia?.condominio}.
        </h1>

        {estancia?.anfitrion && (
          <p className="mt-3 text-base text-ink/70">
            Te lo envió {estancia.anfitrion} tu anfitrión, para tu estadía en
            la vivienda{' '}
            {estancia.unidad}.
          </p>
        )}

        {!comenzado && (
          <>
            <div className="mt-4 rounded-2xl bg-brand/5 px-5 py-4 text-sm leading-relaxed text-ink/80 sm:mt-6">
              <p className="font-semibold text-ink">Tienes dos opciones</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Llenar tú los datos de todos los que vienen contigo.</li>
                <li>
                  O dejar que cada uno llene los suyos: le llega un correo con su
                  enlace.
                </li>
              </ul>
              <p className="mt-2">
                En los dos casos, cada adulto acepta sus propios términos y
                condiciones desde el enlace que le llega a su correo.
              </p>
            </div>
            <p className="mt-4 text-base leading-relaxed text-ink/70">
              Para completar tu preregistro de seguridad, ten a la mano lo
              siguiente:
            </p>
            <ul className="mt-3 space-y-2 text-base leading-relaxed text-ink/70">
              {[
                'Los documentos de identidad de todos los huéspedes',
                'Dirección de residencia',
                'Correos electrónicos de contacto',
                'Placas de los vehículos',
              ].map((linea) => (
                <li key={linea} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {linea}
                </li>
              ))}
              <li className="flex items-start gap-2 font-semibold text-ink">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                Esto solo te tomará unos 2 minutos por persona
              </li>
            </ul>

            <div className="flex justify-center pt-8">
              <Button
                type="button"
                className="w-full max-w-md py-3.5"
                onClick={() => setComenzado(true)}
              >
                Comencemos
              </Button>
            </div>
          </>
        )}

        {comenzado && (
          <>
            <div className="mt-6 flex items-center gap-3">
              <span className="text-sm font-bold text-brand">Paso 1 de 3</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand/20">
                <div className="h-full w-1/3 rounded-full bg-brand" />
              </div>
            </div>

            <div className="mt-6 space-y-6">
              {errorDocumentos ? (
                <p className="text-sm text-danger">{errorDocumentos}</p>
              ) : null}
              <Select
                label="Tipo de documento"
                tone="soft"
                placeholder="Elige"
                options={documentos?.ofrecidos() ?? []}
                value={docType ?? ''}
                onChange={(e) => {
                  setDocType((e.target.value || null) as TipoDocumento | null)
                  setFrente(null)
                  setReverso(null)
                }}
              />

              {docType && (
                <div className="space-y-4">
                  <FileUploader
                    tone="soft"
                    title={
                      tieneDosCaras(regla)
                        ? 'Foto del frente del documento'
                        : 'Foto del documento'
                    }
                    onFileSelected={setFrente}
                  />
                  {tieneDosCaras(regla) && (
                    <FileUploader
                      tone="soft"
                      title="Foto del reverso del documento"
                      onFileSelected={setReverso}
                    />
                  )}
                </div>
              )}

              {docType && faltanFotos && (
                <p className="rounded-xl bg-gold/10 px-4 py-3 text-sm leading-relaxed text-ink">
                  Sube las fotos de tu documento para continuar.
                </p>
              )}

              {errorFoto && (
                <p className="text-center text-sm text-danger">
                  {errorFoto} Inténtalo de nuevo.
                </p>
              )}

              <div className="flex justify-center pt-2">
                <Button
                  type="button"
                  className="w-full max-w-md py-3.5"
                  disabled={!docType || faltanFotos || subiendo}
                  onClick={() => void continuar()}
                >
                  {subiendo ? 'Guardando documento...' : 'Continuar'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}
