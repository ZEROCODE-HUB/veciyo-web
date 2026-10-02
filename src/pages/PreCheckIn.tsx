import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Select from '../components/Select'
import Button from '../components/Button'
import FileUploader from '../components/FileUploader'
import Loading from '../components/Loading'
import {
  subirDocumentoPrecheckin,
  consultarPrecheckin,
  tieneDosCaras,
  tokenActual,
  TIPOS_DOCUMENTO,
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

  const [estancia, setEstancia] = useState<EstanciaPrecheckin | null>(null)
  const [cargando, setCargando] = useState(true)
  const [docType, setDocType] = useState<TipoDocumento | null>(null)
  const [comenzado, setComenzado] = useState(false)
  const [frente, setFrente] = useState<File | null>(null)
  const [reverso, setReverso] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [errorFoto, setErrorFoto] = useState('')

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
    return () => {
      vigente = false
    }
  }, [token, navigate])

  /*
    Las fotos siguen siendo opcionales --nadie se queda fuera por no tener
    camara-- pero **ya se guardan**.

    Hasta el 02/10/2026 se elegian y se quedaban en la memoria de la pestaña:
    el bucket es privado, sus politicas derivan de quien puede ver la visita, y
    quien hace el preregistro no tiene sesion. No habia a quien darle el
    permiso. Lo resuelve `subir-documento-precheckin`, una funcion de servidor
    que comprueba el enlace antes de dejar escribir nada.

    Si la subida falla no se bloquea el paso: el numero de documento --que es
    lo que TRA/SIRE pide-- ya esta guardado, y la porteria compara con el
    documento fisico al llegar, que es lo que hace de todas formas. Pero se
    dice, en vez de callar.
  */
  const faltanFotos = tieneDosCaras(docType)
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
    setErrorFoto('')
    if (token && (frente || reverso)) {
      setSubiendo(true)
      try {
        if (frente) await subirDocumentoPrecheckin(token, frente, 'frente')
        if (reverso) await subirDocumentoPrecheckin(token, reverso, 'reverso')
      } catch (e) {
        setErrorFoto(
          e instanceof Error
            ? e.message
            : 'No se pudo guardar la foto del documento',
        )
      } finally {
        setSubiendo(false)
      }
    }
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
        <h1 className="font-display text-2xl font-extrabold leading-snug text-ink sm:text-[40px] sm:leading-tight">
          Este es el preregistro de seguridad de {estancia?.condominio}.
        </h1>

        {estancia?.anfitrion && (
          <p className="mt-3 text-base text-ink/70">
            Te lo envió {estancia.anfitrion}, para tu estadía en la vivienda{' '}
            {estancia.unidad}.
          </p>
        )}

        {!comenzado && (
          <>
            <p className="mt-4 text-base leading-relaxed text-ink/70 sm:mt-6">
              Completa tu registro de ingreso al condominio. Ten a la mano lo
              siguiente:
            </p>
            <ul className="mt-3 space-y-2 text-base leading-relaxed text-ink/70">
              {[
                'Tu documento de identidad',
                'Dirección de residencia',
                'Correo electrónico de contacto',
                'Placas de los vehículos',
                'Documentos de todos los huéspedes',
              ].map((linea) => (
                <li key={linea} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {linea}
                </li>
              ))}
              <li className="flex items-start gap-2 font-semibold text-ink">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                Esto solo te tomará 2 minutos
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
              <Select
                label="Tipo de documento"
                tone="soft"
                placeholder="Seleccione"
                options={TIPOS_DOCUMENTO as unknown as { value: string; label: string }[]}
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
                      tieneDosCaras(docType)
                        ? 'Foto del frente del documento'
                        : 'Foto del pasaporte'
                    }
                    onFileSelected={setFrente}
                  />
                  {tieneDosCaras(docType) && (
                    <FileUploader
                      tone="soft"
                      title="Foto del reverso del documento"
                      onFileSelected={setReverso}
                    />
                  )}
                </div>
              )}

              {docType && faltanFotos && (
                <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
                  Puedes continuar sin subir las fotos. Si lo haces, ten el
                  documento a mano al llegar: la portería te lo va a pedir.
                </p>
              )}

              {errorFoto && (
                <p className="text-center text-sm text-red-600">
                  {errorFoto} Puedes continuar: tu documento se revisa en
                  porteria al llegar.
                </p>
              )}

              <div className="flex justify-center pt-2">
                <Button
                  type="button"
                  className="w-full max-w-md py-3.5"
                  disabled={!docType || subiendo}
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
