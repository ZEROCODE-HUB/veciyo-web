import { useEffect, useState } from 'react'
import Input from './Input'
import Select from './Select'
import Button from './Button'
import FileUploader from './FileUploader'
import BloqueTutela from './BloqueTutela'
import { useDocumentos } from '../lib/useDocumentos'
import { porQueFallo } from '../lib/motivo'
import { esMayorDeEdadAlLlegar, hoyEnIso } from '../lib/edad'
import { errorDeDocumento, soloNombre } from '../lib/ficha'
import {
  adultosParaAcompanante,
  guardarMenorAcompanante,
  menoresACargo,
  necesitaPermiso,
  quitarMenorAcompanante,
  subirAutorizacionMenor,
  subirDocumentoPrecheckin,
  subirLoElegido,
  avisoDeLoQueNoSubio,
  type AdultoParaElegir,
  type MenorACargo,
  type Parentesco,
  type TipoDocumento,
} from '../lib/precheckin'
import { useListaDeLaBase } from '../lib/listas'
import { useAceptaArchivos } from '../lib/formatosDeArchivo'

interface Props {
  token: string
  /** El día de llegada: es contra él contra el que se mide la edad. */
  llegada: string | null
}

/**
 * Los menores que trae un acompañante, desde **su** enlace.
 *
 * Un menor no tiene enlace propio —no puede aceptar términos, así que no se le
 * emite— de modo que alguien tiene que llenar su ficha. Hasta el 09/10/2026
 * ese alguien solo podía ser el titular, que acababa tecleando el documento de
 * un hijo ajeno que no tiene y declarando un parentesco que no le consta. El
 * cliente lo planteó con un ejemplo: «mi amigo sí es el tutor, y quiero que él
 * llene el suyo y el de su hijo».
 *
 * **Quién responde por cada menor lo elige quien lo añade**, no se fuerza a
 * que sea él: puede venir con el hijo de otro. Lo decidió el cliente el mismo
 * día. Lo único que la base exige es que sea un adulto de esta estancia.
 *
 * Y es opcional: quien viene solo no tiene que hacer nada aquí.
 */
export default function MenoresQueTraigo({ token, llegada }: Props) {
  const aceptaDocumento = useAceptaArchivos('documento_huesped')
  const aceptaAutorizacion = useAceptaArchivos('autorizacion_menor')
  const parentescos = useListaDeLaBase('responsables_de_menor')
  // Los documentos de un menor en el país del edificio (25/10/2026).
  const { documentos } = useDocumentos(token)
  const [lista, setLista] = useState<MenorACargo[]>([])
  const [adultos, setAdultos] = useState<AdultoParaElegir[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [abierto, setAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo] = useState<string | null>(null)

  const [nombre, setNombre] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [tipoDoc, setTipoDoc] = useState<TipoDocumento | ''>('')
  const [documento, setDocumento] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [responsableId, setResponsableId] = useState('')
  const [parentesco, setParentesco] = useState<Parentesco | ''>('')
  // Elegidos en el formulario y subidos apenas el menor existe (15/10/2026).
  const [fotoDocumento, setFotoDocumento] = useState<File | null>(null)
  const [autorizacion, setAutorizacion] = useState<File | null>(null)

  const refrescar = async () => {
    const [menores, mayores] = await Promise.all([
      menoresACargo(token),
      adultosParaAcompanante(token),
    ])
    setLista(menores)
    setAdultos(mayores)
    // El caso normal es que responda quien está llenando esto, así que viene
    // puesto. Puede cambiarlo: puede venir con el hijo de otro.
    setResponsableId((actual) => actual || (mayores.find((a) => a.soy_yo)?.id ?? ''))
  }

  useEffect(() => {
    let vigente = true
    refrescar()
      .catch(() => {
        if (vigente) setError('No pudimos cargar esta parte')
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })
    return () => {
      vigente = false
    }
    // `token` no cambia mientras esta pantalla vive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const limpiar = () => {
    setNombre('')
    setApellidos('')
    setTipoDoc('')
    setDocumento('')
    setFechaNacimiento('')
    setParentesco('')
    setFotoDocumento(null)
    setAutorizacion(null)
  }

  /*
    Que sea menor lo dice su fecha, contra el día de llegada, igual que en la
    base. Aquí se comprueba para poder decirlo antes de ir por red: un adulto
    no entra por este formulario —tiene su propio enlace— y la base lo rechaza
    con ese mismo motivo.
  */
  const esAdulto =
    fechaNacimiento !== '' &&
    esMayorDeEdadAlLlegar(fechaNacimiento, llegada) === true

  const errorDeFecha = esAdulto
    ? 'Con esa fecha es mayor de edad. Un adulto se añade aparte y llena sus propios datos.'
    : ''

  const puedeGuardar =
    nombre.trim() !== '' &&
    fechaNacimiento !== '' &&
    !esAdulto &&
    responsableId !== '' &&
    parentesco !== ''

  const anadir = async () => {
    if (!puedeGuardar || guardando) return
    setError(null)
    setGuardando(true)
    try {
      const id = await guardarMenorAcompanante(token, {
        nombre: nombre.trim(),
        apellidos: apellidos.trim() || undefined,
        tipoDocumento: tipoDoc || undefined,
        documento: documento.trim() || undefined,
        fechaNacimiento,
        responsableId,
        parentesco: parentesco as Parentesco,
      })
      const fallos = await subirLoElegido(token, id, {
        documento: fotoDocumento,
        autorizacion: necesitaPermiso(parentesco || null) ? autorizacion : null,
      })
      await refrescar()
      limpiar()
      setAbierto(false)
      setError(avisoDeLoQueNoSubio(fallos))
    } catch (e) {
      setError(porQueFallo(e, 'No pudimos añadirlo'))
    } finally {
      setGuardando(false)
    }
  }

  const quitar = async (id: string) => {
    setError(null)
    try {
      await quitarMenorAcompanante(token, id)
      await refrescar()
    } catch (e) {
      setError(porQueFallo(e, 'No pudimos quitarlo'))
    }
  }

  const subir = async (
    menor: MenorACargo,
    archivo: File,
    que: 'documento' | 'autorizacion',
  ) => {
    setError(null)
    setSubiendo(menor.id)
    try {
      if (que === 'documento') {
        await subirDocumentoPrecheckin(token, archivo, 'frente', menor.id)
      } else {
        await subirAutorizacionMenor(token, menor.id, archivo)
      }
      await refrescar()
    } catch (e) {
      setError(porQueFallo(e, 'No pudimos guardar el archivo'))
    } finally {
      setSubiendo(null)
    }
  }

  if (cargando) return null

  return (
    <div className="mt-6 border-t border-line pt-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">
        Menores que vienen contigo
      </p>
      <p className="mt-1 text-xs text-ink/60">
        Solo si traes alguno. Un menor no llena su propia ficha ni acepta
        términos: lo hace el adulto que responde por él.
      </p>

      {lista.length > 0 && (
        <div className="mt-4 space-y-3">
          {lista.map((menor) => (
            <div key={menor.id} className="rounded-2xl border border-line p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">
                    {menor.nombre} {menor.apellidos ?? ''}
                  </p>

                  <p
                    className={`mt-1 text-xs font-semibold ${
                      menor.tiene_documento ? 'text-success' : 'text-ink'
                    }`}
                  >
                    {menor.tiene_documento
                      ? 'Subiste la foto de su documento'
                      : 'Falta la foto de su documento'}
                  </p>
                  {!menor.tiene_documento && (
                    <label className="mt-1 block text-xs font-semibold text-brand underline">
                      {subiendo === menor.id ? 'Subiendo…' : 'Subir su documento'}
                      <input
                        type="file"
                        className="hidden"
                        accept={aceptaDocumento}
                        disabled={subiendo === menor.id}
                        onChange={(e) => {
                          const archivo = e.target.files?.[0]
                          if (archivo) void subir(menor, archivo, 'documento')
                          e.target.value = ''
                        }}
                      />
                    </label>
                  )}

                  {/*
                    El permiso firmado solo si no sos su padre ni su madre: ese
                    vínculo no se acredita con un papel de viaje.
                  */}
                  {necesitaPermiso(menor.parentesco) && (
                    <>
                      <p
                        className={`mt-1 text-xs font-semibold ${
                          menor.tiene_autorizacion
                            ? 'text-success'
                            : 'text-ink'
                        }`}
                      >
                        {menor.tiene_autorizacion
                          ? 'Carta de potestad / tutela subida'
                          : 'Falta su carta de potestad / tutela'}
                      </p>
                      {!menor.tiene_autorizacion && (
                        <label className="mt-1 block text-xs font-semibold text-brand underline">
                          {subiendo === menor.id
                            ? 'Subiendo…'
                            : 'Subir la carta de potestad / tutela'}
                          <input
                            type="file"
                            className="hidden"
                            accept={aceptaAutorizacion}
                            disabled={subiendo === menor.id}
                            onChange={(e) => {
                              const archivo = e.target.files?.[0]
                              if (archivo) void subir(menor, archivo, 'autorizacion')
                              e.target.value = ''
                            }}
                          />
                        </label>
                      )}
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void quitar(menor.id)}
                  aria-label={`Quitar a ${menor.nombre}`}
                  className="shrink-0 text-xs font-semibold text-danger underline"
                >
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {abierto ? (
        <div className="mt-4 space-y-3 rounded-2xl border border-line bg-surface-soft p-4">
          <Input
            label="Nombres"
            tone="soft"
            placeholder="Como figuran en su documento"
            value={nombre}
            onChange={(e) => setNombre(soloNombre(e.target.value))}
          />
          <Input
            label="Apellidos"
            tone="soft"
            value={apellidos}
            onChange={(e) => setApellidos(soloNombre(e.target.value))}
          />
          {/* Nadie nace mañana: el calendario no ofrece el futuro. */}
          <Input
            label="Fecha de nacimiento"
            type="date"
            tone="soft"
            max={hoyEnIso()}
            value={fechaNacimiento}
            error={errorDeFecha}
            onChange={(e) => setFechaNacimiento(e.target.value)}
          />
          {/*
            Su documento, igual que el de un adulto: el ministerio lo pide por
            cada persona. En Colombia es el registro civil hasta los siete y la
            tarjeta de identidad de siete a diecisiete.
          */}
          <Select
            label="Tipo de documento"
            tone="soft"
            placeholder="Elige"
            options={documentos?.ofrecidos('menores') ?? []}
            value={tipoDoc}
            onChange={(e) => setTipoDoc(e.target.value as TipoDocumento | '')}
          />
          <Input
            label="Número de documento"
            tone="soft"
            placeholder="Tal como aparece en el documento"
            value={documento}
            error={errorDeDocumento(documentos?.regla(tipoDoc), documento)}
            onChange={(e) => setDocumento(e.target.value)}
          />
          {/* El bloque del menor de la maqueta, con su texto de protección. */}
          <BloqueTutela>
          <Select
            label="Adulto responsable por el menor"
            tone="soft"
            placeholder="Elige a un adulto de esta reserva"
            options={adultos.map((a) => ({
              value: a.id,
              label:
                `${a.nombre} ${a.apellidos ?? ''}`.trim() +
                (a.soy_yo ? ' (tú)' : a.es_titular ? ' (hizo la reserva)' : ''),
            }))}
            value={responsableId}
            onChange={(e) => setResponsableId(e.target.value)}
          />
          <Select
            label="Parentesco"
            tone="soft"
            placeholder="Elige"
            options={parentescos.opciones}
            value={parentesco}
            onChange={(e) => setParentesco(e.target.value as Parentesco | '')}
          />
          {/*
            La foto y la autorización se eligen aquí mismo (15/10/2026), no
            después de añadirlo. El formulario se desmonta al cerrar, así que
            los selectores empiezan vacíos cada vez.
          */}
          <FileUploader
            compact
            title="Foto de su documento (opcional)"
            hint="El frente, donde se ve la foto"
            accept={aceptaDocumento}
            onFileSelected={setFotoDocumento}
          />
          {necesitaPermiso(parentesco || null) && (
            <FileUploader
              tone="soft"
              title="Carta de potestad / tutela notarial"
              hint="Hace falta al no ser su padre ni su madre. Foto o PDF."
              accept={aceptaAutorizacion}
              onFileSelected={setAutorizacion}
            />
          )}
          </BloqueTutela>

          <div className="flex gap-2">
            <Button
              type="button"
              className="flex-1 py-2.5"
              disabled={!puedeGuardar || guardando}
              onClick={() => void anadir()}
            >
              {guardando ? 'Guardando…' : 'Añadirlo'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="flex-1 py-2.5"
              onClick={() => {
                limpiar()
                setAbierto(false)
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="mt-4 text-sm font-semibold text-brand underline"
        >
          + Añadir un menor
        </button>
      )}

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  )
}
