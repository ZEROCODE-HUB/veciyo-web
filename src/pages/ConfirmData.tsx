import { useEffect, useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Input from '../components/Input'
import CampoTelefono from '../components/CampoTelefono'
import { PAIS_POR_DEFECTO } from '../lib/paises'
import Select from '../components/Select'
import Button from '../components/Button'
import Accordion from '../components/Accordion'
import Checkbox from '../components/Checkbox'
import { porQueFallo } from '../lib/motivo'
import {
  aceptarTerminos,
  fichaDelPrecheckin,
  legalesDeLaEstancia,
  type DocumentoLegal,
  guardarFicha,
  MOTIVOS,
  TIPOS_DOCUMENTO,
  tokenActual,
  type Motivo,
  type TipoDocumento,
} from '../lib/precheckin'


/**
 * Los datos del titular.
 *
 * Aquí se perdían: el teléfono, la dirección y el motivo eran `<Input
 * defaultValue>` sin nadie que los leyera, y «Confirmar y continuar» los
 * tiraba y navegaba con «Carlos Balazo» cableado. Ahora se escriben con
 * `guardar_precheckin`.
 *
 * El título decía «Los datos fueron extraídos automáticamente de tu
 * documento». No lo estaban: no hay lector de documentos contratado. Decirlo
 * hacía que alguien diera por buenos unos datos que en realidad estaban en
 * blanco, así que ahora se piden. Cuando exista el lector, esta pantalla
 * seguirá sirviendo tal cual: llegará con los campos llenos en vez de vacíos.
 */
export default function ConfirmData() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = tokenActual()
  /*
    El tipo de documento venia **solo** de `location.state`, asi que recargar
    esta pantalla con el token vivo tiraba al paso 1. Ahora se recupera tambien
    de la ficha ya guardada, que es donde de verdad vive.
  */
  const docTypeDelPaso = (location.state as { docType?: TipoDocumento } | null)?.docType
  const [docTypeGuardado, setDocTypeGuardado] = useState<TipoDocumento | null>(null)
  const docType = docTypeDelPaso ?? docTypeGuardado

  const [nombre, setNombre] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [documento, setDocumento] = useState('')
  const [correo, setCorreo] = useState('')
  const [telefono, setTelefono] = useState('')
  const [codigoPais, setCodigoPais] = useState(PAIS_POR_DEFECTO)
  const [direccion, setDireccion] = useState('')
  const [motivo, setMotivo] = useState<Motivo | ''>('')
  /*
    La RPC la acepta desde el principio y esta pantalla no la pedia: en la base
    habia **cero** invitados con fecha de nacimiento, y el anfitrion la veia
    siempre como «N/A» en los datos del documento. Hace falta para el reporte a
    la autoridad y para saber si alguien es menor.
  */
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  /*
    Lo que pide la Tarjeta de Registro de Alojamiento del ministerio y que no
    se preguntaba en ningún sitio. Sin estos tres, el reporte se rechaza.
  */
  const [ciudadResidencia, setCiudadResidencia] = useState('')
  const [ciudadProcedencia, setCiudadProcedencia] = useState('')
  const [costo, setCosto] = useState('')
  const [aceptados, setAceptados] = useState(false)
  /*
    Los términos reales, no los cuatro párrafos que había escritos aquí. Uno de
    ellos se titulaba «Términos y Condiciones del Condominio» y en la base hay
    un documento con ese nombre, del condominio y vigente, que no leía nadie:
    se estaba aceptando un texto que no es el del edificio.
  */
  const [legales, setLegales] = useState<DocumentoLegal[]>([])

  /**
   * Lo que el huesped ya habia escrito.
   *
   * Hasta el 03/10/2026 esta pantalla arrancaba con los once campos en blanco
   * aunque estuvieran guardados: no habia forma de leerlos. Para alguien que
   * viaja, abandonar el preregistro a medias y volver es el caso normal.
   *
   * `cargando` evita el parpadeo de un formulario vacio que se rellena solo, y
   * sobre todo evita que alguien empiece a escribir encima de lo que esta a
   * punto de llegar.
   */
  const [cargandoFicha, setCargandoFicha] = useState(true)

  useEffect(() => {
    if (!token) {
      setCargandoFicha(false)
      return
    }
    let vigente = true
    fichaDelPrecheckin(token)
      .then((ficha) => {
        if (!vigente || !ficha) return
        setNombre(ficha.nombre)
        setApellidos(ficha.apellidos)
        setDocumento(ficha.documento)
        setCorreo(ficha.correo)
        setTelefono(ficha.telefono)
        if (ficha.codigoPais) setCodigoPais(ficha.codigoPais)
        setDireccion(ficha.direccion)
        setMotivo(ficha.motivo ?? '')
        setFechaNacimiento(ficha.fechaNacimiento)
        setCiudadResidencia(ficha.ciudadResidencia)
        setCiudadProcedencia(ficha.ciudadProcedencia)
        setCosto(ficha.costo === null ? '' : String(ficha.costo))
        setAceptados(ficha.terminosAceptados)
        if (ficha.tipoDocumento) setDocTypeGuardado(ficha.tipoDocumento)
      })
      /*
        Que no se pueda recuperar no impide rellenarlo a mano: es peor dejar al
        huesped sin pantalla que sin autorrelleno.
      */
      .catch(() => {})
      .finally(() => {
        if (vigente) setCargandoFicha(false)
      })
    return () => {
      vigente = false
    }
  }, [token])

  useEffect(() => {
    if (!token) return
    let vigente = true
    legalesDeLaEstancia(token)
      .then((docs) => {
        if (vigente) setLegales(docs)
      })
      .catch(() => {
        if (vigente) setLegales([])
      })
    return () => {
      vigente = false
    }
  }, [token])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /*
    Mientras se busca lo ya escrito no se decide nada: sin esto, al recargar la
    pantalla se iria al paso 1 justo antes de que llegara el tipo de documento
    guardado, que es lo que la mantiene aqui.
  */
  if (cargandoFicha) {
    return (
      <MainLayout header="default" bg="soft">
        <div className="mx-auto max-w-[640px] px-4 py-10">
          <p className="text-center text-sm text-ink/60">Recuperando tus datos...</p>
        </div>
      </MainLayout>
    )
  }

  if (!token || !docType) {
    return <Navigate to="/pre-check-in" replace />
  }

  const etiquetaDoc =
    TIPOS_DOCUMENTO.find((t) => t.value === docType)?.label ?? docType

  /*
    La misma validación que hace la base, para poder decir qué falta antes de
    ir y volver por red. La base la repite de todos modos: es el límite, no
    este formulario.
  */
  const completo =
    nombre.trim() !== '' &&
    apellidos.trim() !== '' &&
    documento.trim() !== '' &&
    correo.includes('@') &&
    aceptados

  const confirmar = async () => {
    if (!completo || guardando) return
    setGuardando(true)
    setError(null)
    try {
      await guardarFicha(token, {
        nombre: nombre.trim(),
        apellidos: apellidos.trim(),
        tipoDocumento: docType,
        documento: documento.trim(),
        correo: correo.trim(),
        telefono: telefono.trim() || undefined,
        codigoPais: telefono.trim() ? codigoPais : undefined,
        direccion: direccion.trim() || undefined,
        motivo: motivo || undefined,
        fechaNacimiento: fechaNacimiento || undefined,
        ciudadResidencia: ciudadResidencia.trim() || undefined,
        ciudadProcedencia: ciudadProcedencia.trim() || undefined,
        /*
          Lo escribe el huésped y no el anfitrión: quien reserva por un portal
          sabe lo que pagó, y el anfitrión no siempre. Decidido el 02/10/2026.
        */
        costo: costo.trim() ? Number(costo.replace(/[^0-9.]/g, '')) : undefined,
      })
      // Dos llamadas y no una: aceptar los términos es un hecho con fecha y
      // con consecuencias legales, no un campo más de la ficha.
      await aceptarTerminos(token)
      navigate('/companions', { state: { nombre: `${nombre} ${apellidos}` } })
    } catch (e) {
      setError(
        porQueFallo(e, 'No pudimos guardar tus datos'),
      )
      setGuardando(false)
    }
  }

  return (
    <MainLayout header="default" bg="soft">
      <div className="mx-auto max-w-[640px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-brand">Paso 2 de 3</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand/20">
            <div className="h-full w-2/3 rounded-full bg-brand" />
          </div>
        </div>

        <h1 className="mt-6 text-center font-display text-3xl font-bold text-ink sm:text-[34px]">
          Tus datos
        </h1>

        <p className="mx-auto mt-3 max-w-md text-center text-base text-ink/60">
          Escríbelos tal como figuran en tu {etiquetaDoc.toLowerCase()}. La
          portería los compara con el documento cuando llegues.
        </p>

        <div className="mt-8 space-y-3">
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
          <div className="rounded-xl bg-surface-soft px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">
              Tipo de identificación
            </p>
            <p className="text-sm font-bold text-ink">{etiquetaDoc}</p>
          </div>
          <Input
            label="Número de identificación"
            tone="soft"
            placeholder="Sin puntos ni guiones"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
          />
          <Input
            label="Correo electrónico"
            type="email"
            tone="soft"
            placeholder="correo@ejemplo.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
          {/*
            Decía «A este correo te llega el acceso a la aplicación», y **no se
            envía ningún correo**: al terminar el preregistro esta web muestra el
            enlace en pantalla y avisa de que no se puede volver a ver. Las dos
            frases se contradecían, y la primera dejaba a alguien esperando algo
            que no llega --que es el incidente del 25/09/2026, cuando quien lo vio
            cerró la pantalla sin copiarlo--.

            El correo sí se envía por el otro camino, el de la aplicación
            (`enviar-invitacion`), que en la práctica no se ejecuta. Si se quiere
            aquí, hay que invocar esa función; está anotado en
            `REVISAR-A-OJO.md` (63). Mientras tanto, el texto dice la verdad.
          */}
          <p className="px-1 text-xs text-ink/60">
            Lo usamos para identificarte. Al terminar te mostramos el enlace de
            acceso a la aplicación, donde vas a ver la clave del wifi y el código
            de la puerta.
          </p>
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/50">
            Datos adicionales
          </p>
          <div className="space-y-3">
            {/*
              El huesped de un alojamiento turistico casi nunca tiene numero del
              pais donde se aloja. Hasta el 03/10/2026 escribia un numero suelto
              y nadie sabia de donde era: ni para llamarle, ni para WhatsApp.
            */}
            <CampoTelefono
              label="Número de teléfono"
              tone="soft"
              codigoPais={codigoPais}
              onCodigoPaisChange={setCodigoPais}
              telefono={telefono}
              onTelefonoChange={setTelefono}
              placeholder="Ingrese su número de teléfono"
            />
            <Input
              label="Dirección de residencia"
              tone="soft"
              placeholder="Tu domicilio habitual, no el del alojamiento"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
            />
            <Input
              label="Ciudad donde vives"
              tone="soft"
              placeholder="Medellín"
              value={ciudadResidencia}
              onChange={(e) => setCiudadResidencia(e.target.value)}
            />
            <Input
              label="Ciudad desde la que viajas"
              tone="soft"
              placeholder="Lima"
              value={ciudadProcedencia}
              onChange={(e) => setCiudadProcedencia(e.target.value)}
            />
            <Input
              label="Lo que pagaste por la estancia"
              type="text"
              inputMode="numeric"
              tone="soft"
              placeholder="850000"
              value={costo}
              onChange={(e) => setCosto(e.target.value)}
            />
            <Input
              label="Fecha de nacimiento"
              type="date"
              tone="soft"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
            />
            <Select
              label="Motivo de alojamiento"
              tone="soft"
              placeholder="Seleccione un motivo"
              options={MOTIVOS as unknown as { value: string; label: string }[]}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value as Motivo | '')}
            />
          </div>
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/50">
            Términos y condiciones
          </p>
          {legales.length > 0 ? (
            <Accordion
              sections={legales.map((doc) => ({
                id: doc.id,
                title: doc.titulo,
                content: <p className="whitespace-pre-line">{doc.contenido}</p>,
              }))}
            />
          ) : (
            /*
              Se dice, en vez de enseñar un texto de relleno: aceptar unos
              términos que no se han podido cargar no vale nada.
            */
            <p className="text-sm leading-relaxed text-ink/70">
              No pudimos cargar los términos y condiciones. Inténtalo de nuevo
              en un momento; si sigue igual, avisa a tu anfitrión.
            </p>
          )}
          <div className="mt-6 flex items-start gap-3">
            <Checkbox
              label="Acepto los términos y condiciones"
              checked={aceptados}
              onChange={(e) => setAceptados(e.target.checked)}
            />
          </div>
        </div>

        {error && (
          <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-center pt-6">
          <Button
            type="button"
            className="w-full max-w-md py-3.5"
            disabled={!completo || guardando}
            onClick={confirmar}
          >
            {guardando ? 'Guardando…' : 'Confirmar y continuar'}
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}
