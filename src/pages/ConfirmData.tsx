import { useEffect, useState } from 'react'
import SelectorDeMoneda from '../components/SelectorDeMoneda'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Input from '../components/Input'
import CampoTelefono from '../components/CampoTelefono'
import { PAIS_POR_DEFECTO } from '../lib/paises'
import Select from '../components/Select'
import Button from '../components/Button'
import Accordion from '../components/Accordion'
import Checkbox from '../components/Checkbox'
import CampoHora from '../components/CampoHora'
import ReglasDelEdificio from '../components/ReglasDelEdificio'
import UsarMisDatos from '../components/UsarMisDatos'
import Recuadro from '../components/Recuadro'
import { porQueFallo } from '../lib/motivo'
import { esMayorDeEdadAlLlegar, hoyEnIso, naceDespuesDeLlegar } from '../lib/edad'
import {
  soloNombre,
  costoComoNumero,
  errorDeCorreo,
  errorDeCosto,
  errorDeDocumento,
  errorDeFechaExpedicion,
  errorDeNacimientoImposible,
  errorDeTelefono,
  limitesDeLaFicha,
  loQueFaltaEnLaFicha,
  pideFechaExpedicion,
} from '../lib/ficha'
import { useParametros } from '../lib/useParametros'
import { useDocumentos } from '../lib/useDocumentos'
import CampoPais from '../components/CampoPais'
import {
  aceptarReglamento,
  aceptarTerminos,
  consultarPrecheckin,
  estadoDelPrecheckin,
  fechasDeExpedicion,
  guardarFechaExpedicion,
  guardarHoras,
  fichaDelPrecheckin,
  legalesDeLaEstancia,
  type DocumentoLegal,
  guardarFicha,
  MOTIVOS,
  TIPOS_DOCUMENTO,
  tokenActual,
  type MisDatos,
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
  // Solo se pide con cédula de extranjería o PPT (Tus Datos la exige).
  const [fechaExpedicion, setFechaExpedicion] = useState('')
  /*
    Lo que pide la Tarjeta de Registro de Alojamiento del ministerio y que no
    se preguntaba en ningún sitio. Sin estos tres, el reporte se rechaza.
  */
  const [ciudadResidencia, setCiudadResidencia] = useState('')
  const [ciudadProcedencia, setCiudadProcedencia] = useState('')
  const [costo, setCosto] = useState('')
  // La moneda de lo que pagó, elegida por país (QA 23/10/2026).
  // Sin elegir, la base pone la del edificio (`moneda_del_condominio`): nacía
  // en «COP» y se grababa así aunque el edificio cobrara en otra
  // (Parametrización, 25/10/2026).
  const [moneda, setMoneda] = useState('')
  /*
    La pide el reporte de extranjeros y no se preguntaba en ninguna pantalla:
    la base la aceptaba desde el principio y llegaba siempre vacía.
  */
  const [nacionalidad, setNacionalidad] = useState('')
  const [aceptados, setAceptados] = useState(false)
  /*
    A qué hora llega y a qué hora se va. Son de la estancia, no de la persona:
    la portería las lee para saber cuándo esperar a alguien. Opcionales --quien
    todavía no tiene vuelo no lo sabe--.
  */
  const [horaLlegada, setHoraLlegada] = useState('')
  const [horaSalida, setHoraSalida] = useState('')
  /*
    Las reglas del edificio. `hayReglas` empieza sin saberse: mientras no se
    sepa no se deja continuar, porque si el edificio las tiene el cierre las
    va a exigir y el huésped se enteraría en el último botón.
  */
  const [hayReglas, setHayReglas] = useState<boolean | null>(null)
  const [reglasAceptadas, setReglasAceptadas] = useState(false)
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

  /*
    El día de llegada, para poder decir aquí mismo si quien reserva es mayor
    de edad. Sin él la cuenta sería contra hoy, y alguien que cumple años
    entre la reserva y el check-in llega siendo adulto.
  */
  const [llegada, setLlegada] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let vigente = true
    consultarPrecheckin(token)
      .then((estancia) => {
        if (vigente) setLlegada(estancia?.fecha_desde ?? null)
      })
      .catch(() => {
        // Sin la fecha, la comprobación de edad cuenta contra hoy. Es la
        // respuesta prudente: la base vuelve a mirarlo con la fecha buena.
        if (vigente) setLlegada(null)
      })
    return () => {
      vigente = false
    }
  }, [token])

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
        if (ficha.moneda) setMoneda(ficha.moneda)
        setNacionalidad(ficha.nacionalidad)
        setAceptados(ficha.terminosAceptados)
        if (ficha.tipoDocumento) setDocTypeGuardado(ficha.tipoDocumento)
        fechasDeExpedicion(token)
          .then((fechas) => {
            if (vigente) setFechaExpedicion(fechas[ficha.invitadoId] ?? '')
          })
          .catch(() => {})
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
    estadoDelPrecheckin(token)
      .then((estado) => {
        if (!vigente) return
        setHoraLlegada(estado.horaLlegada)
        setHoraSalida(estado.horaSalida)
        setReglasAceptadas(estado.reglamentoAceptado)
      })
      // Sin lo ya guardado se vuelve a pedir: es peor no dejar escribirlo.
      .catch(() => {})
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
  // Los límites del teléfono y del año de nacimiento viven en la base.
  const { parametros, error: errorParametros } = useParametros()
  // Los documentos del país del edificio y sus reglas (25/10/2026).
  const { documentos, error: errorDocumentos } = useDocumentos(token)

  /*
    Mientras se busca lo ya escrito no se decide nada: sin esto, al recargar la
    pantalla se iria al paso 1 justo antes de que llegara el tipo de documento
    guardado, que es lo que la mantiene aqui. Tampoco sin los parámetros: sin
    ellos no se puede decir qué está mal.
  */
  if (cargandoFicha || !parametros || !documentos) {
    return (
      <MainLayout header="default" bg="soft">
        <div className="mx-auto max-w-[640px] px-4 py-10">
          <p className="text-center text-sm text-ink/60">
            {errorParametros ?? errorDocumentos ?? 'Recuperando tus datos...'}
          </p>
        </div>
      </MainLayout>
    )
  }
  const limites = limitesDeLaFicha(parametros)

  if (!token || !docType) {
    return <Navigate to="/pre-check-in" replace />
  }

  const regla = documentos.regla(docType)
  const etiquetaDoc =
    regla?.etiqueta ?? TIPOS_DOCUMENTO.find((t) => t.value === docType)?.label ?? docType

  /*
    La misma validación que hace la base, para poder decir qué falta antes de
    ir y volver por red. La base la repite de todos modos: es el límite, no
    este formulario.
  */
  /*
    La edad, **aquí y no al final**.

    La regla es de la base --`cerrar_precheckin` rechaza un titular menor-- y
    hasta el 09/10/2026 esta pantalla no la conocía: se podía escribir la
    fecha de nacimiento, seguir a los acompañantes, subir el documento,
    aceptar los términos, y recibir «Quien reserva tiene que ser mayor de
    edad» en el último botón. El cliente lo recorrió entero así.

    El dato que decide está **en este campo**, así que el aviso va debajo de
    este campo y en el momento en que se escribe. La base lo vuelve a mirar:
    sigue siendo ella el límite, esto es solo decirlo a tiempo.
  */
  const mayorDeEdad = fechaNacimiento
    ? esMayorDeEdadAlLlegar(fechaNacimiento, llegada)
    : null

  const errorDeFecha = !fechaNacimiento
    ? ''
    : errorDeNacimientoImposible(fechaNacimiento, limites)
      ? errorDeNacimientoImposible(fechaNacimiento, limites)
      : naceDespuesDeLlegar(fechaNacimiento, llegada)
        ? 'Esa fecha es posterior al día de llegada. Revisala.'
        : mayorDeEdad === false
          ? 'Quien reserva tiene que ser mayor de edad. Si la fecha está mal corregila; si no, la reserva la tiene que cerrar un adulto.'
          : ''

  /*
    Lo que falta, **con nombre**. El botón se quedaba gris sin decir por qué, y
    lo que el reporte al ministerio exige --ciudades, costo, nacionalidad-- se
    podía dejar en blanco: el anfitrión se enteraba al reportar, con este
    registro ya cerrado y sin dónde completarlo (12/10/2026).
  */
  const faltan = loQueFaltaEnLaFicha(
    {
      nombre,
      apellidos,
      tipoDocumento: docType,
      documento,
      correo,
      telefono,
      fechaNacimiento,
      nacionalidad,
      ciudadResidencia,
      ciudadProcedencia,
      costo,
      fechaExpedicion,
    },
    { esTitular: true, limites, documentos },
  )
  if (errorDeFecha !== '' && !faltan.includes('la fecha de nacimiento')) {
    faltan.push('la fecha de nacimiento')
  }
  if (!aceptados) faltan.push('aceptar los términos y condiciones')
  if (hayReglas && !reglasAceptadas) faltan.push('aceptar las reglas del edificio')

  const completo = faltan.length === 0 && hayReglas !== null

  /*
    Quien ya se alojó con Veciyo trae sus datos de la vez anterior. Se ponen
    donde venga algo —lo que no venga no borra lo que ya había escrito— y los
    revisa antes de confirmar: una dirección o un teléfono cambian.
  */
  const usarMisDatos = (d: MisDatos) => {
    if (d.nombre) setNombre(d.nombre)
    if (d.apellidos) setApellidos(d.apellidos)
    if (d.documento) setDocumento(d.documento)
    if (d.correo) setCorreo(d.correo)
    if (d.telefono) setTelefono(d.telefono)
    if (d.codigoPais) setCodigoPais(d.codigoPais)
    if (d.direccion) setDireccion(d.direccion)
    if (d.fechaNacimiento) setFechaNacimiento(d.fechaNacimiento)
    if (d.ciudadResidencia) setCiudadResidencia(d.ciudadResidencia)
    if (d.ciudadProcedencia) setCiudadProcedencia(d.ciudadProcedencia)
  }

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
        nacionalidad: nacionalidad || undefined,
        /*
          Lo escribe el huésped y no el anfitrión: quien reserva por un portal
          sabe lo que pagó, y el anfitrión no siempre. Decidido el 02/10/2026.
        */
        costo: costoComoNumero(costo),
        moneda,
      })
      if (pideFechaExpedicion(regla)) {
        await guardarFechaExpedicion(token, fechaExpedicion)
      }
      // Dos llamadas y no una: aceptar los términos es un hecho con fecha y
      // con consecuencias legales, no un campo más de la ficha.
      await aceptarTerminos(token)
      await guardarHoras(token, { llegada: horaLlegada, salida: horaSalida })
      // Otro hecho con fecha, y de otro documento: las reglas no son los
      // términos. Solo si el edificio tiene unas que aceptar.
      if (hayReglas) await aceptarReglamento(token)
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
          Confirma tus datos
        </h1>

        <p className="mx-auto mt-3 max-w-md text-center text-base text-ink/60">
          Verifica que tus datos sean correctos y escríbelos tal como figuran
          en tu {etiquetaDoc.toLowerCase()}. Al llegar, el personal de
          seguridad los compara con tu documento físico, y tienen que
          coincidir.
        </p>

        <UsarMisDatos onDatos={usarMisDatos} />

        <div className="mt-8 space-y-3">
          {/*
            La rejilla 2×2 de la maqueta, con los campos editables dentro. En
            un celular de menos de 400 px, una columna: en la mitad de 360 un
            apellido compuesto salía cortado («Gómez Restre…») y un campo no
            puede bajar de línea (auditoría de responsividad, 25/10/2026).
          */}
          <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
            <Recuadro
              etiqueta="Nombre *"
              placeholder="Como figura en el documento"
              value={nombre}
              onChange={(e) => setNombre(soloNombre(e.target.value))}
            />
            <Recuadro
              etiqueta="Apellido *"
              placeholder="Como figuran en el documento"
              value={apellidos}
              onChange={(e) => setApellidos(soloNombre(e.target.value))}
            />
            <Recuadro etiqueta="Tipo de identificación *" value={etiquetaDoc} />
            <Recuadro
              etiqueta="Número de identificación *"
              placeholder="Tal como aparece en el documento"
              value={documento}
              error={errorDeDocumento(regla, documento)}
              onChange={(e) => setDocumento(e.target.value)}
            />
          </div>
          {pideFechaExpedicion(regla) ? (
            <Input
              label="Fecha de expedición del documento *"
              type="date"
              tone="soft"
              max={hoyEnIso()}
              value={fechaExpedicion}
              error={errorDeFechaExpedicion(
                fechaExpedicion,
                fechaNacimiento,
                hoyEnIso(),
              )}
              onChange={(e) => setFechaExpedicion(e.target.value)}
            />
          ) : null}
          <Input
            label="Correo electrónico *"
            type="email"
            tone="soft"
            placeholder="correo@ejemplo.com"
            value={correo}
            error={errorDeCorreo(correo)}
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
            Este correo será tu usuario para entrar a la app de Veciyo, donde
            verás la información del edificio y de tu alojamiento: el wifi, la
            clave de la puerta y las instrucciones de tu anfitrión. También es
            donde te llega la confirmación de tu ingreso.
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
              placeholder="Escribe tu número de teléfono"
            />
            {errorDeTelefono(telefono, limites) ? (
              <p className="-mt-2 text-xs font-semibold text-danger">
                {errorDeTelefono(telefono, limites)}
              </p>
            ) : null}
            <Input
              label="Dirección de residencia"
              tone="soft"
              placeholder="Tu domicilio habitual, no el del alojamiento"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
            />
            <Input
              label="Ciudad donde vives *"
              tone="soft"
              placeholder="Medellín"
              value={ciudadResidencia}
              onChange={(e) => setCiudadResidencia(e.target.value)}
            />
            <Input
              label="Ciudad desde la que viajas *"
              tone="soft"
              placeholder="Lima"
              value={ciudadProcedencia}
              onChange={(e) => setCiudadProcedencia(e.target.value)}
            />
            <Input
              label="Lo que pagaste por la estancia *"
              type="text"
              inputMode="numeric"
              tone="soft"
              placeholder="850000"
              value={costo}
              error={errorDeCosto(costo)}
              onChange={(e) => setCosto(e.target.value)}
            />
            <SelectorDeMoneda label="Moneda de lo que pagaste" value={moneda} onChange={setMoneda} />
            <CampoPais
              label="Nacionalidad *"
              tone="soft"
              placeholder="Elige"
              value={nacionalidad}
              onChange={setNacionalidad}
            />
            {/* Nadie nace mañana: el calendario no ofrece el futuro. */}
            <Input
              label="Fecha de nacimiento *"
              type="date"
              tone="soft"
              max={hoyEnIso()}
              value={fechaNacimiento}
              error={errorDeFecha}
              onChange={(e) => setFechaNacimiento(e.target.value)}
            />
            <Select
              label="Motivo de alojamiento"
              tone="soft"
              placeholder="Elige un motivo"
              options={MOTIVOS as unknown as { value: string; label: string }[]}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value as Motivo | '')}
            />
          </div>
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink/50">
            Llegada y salida
          </p>
          <p className="mb-3 text-sm text-ink/70">
            Una hora aproximada, para que el personal de seguridad sepa cuándo
            esperarte. Si todavía no la sabes, marca «Aún no sé».
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <CampoHora
              label="Hora de llegada"
              valor={horaLlegada}
              onChange={setHoraLlegada}
            />
            <CampoHora
              label="Hora de salida"
              valor={horaSalida}
              onChange={setHoraSalida}
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

        <ReglasDelEdificio
          token={token}
          aceptadas={reglasAceptadas}
          onCambiar={setReglasAceptadas}
          onSaberSiHay={setHayReglas}
        />

        {error && (
          <p className="mt-6 rounded-xl bg-danger/5 px-4 py-3 text-center text-sm font-semibold text-danger">
            {error}
          </p>
        )}

        {faltan.length > 0 && (
          <p
            role="status"
            className="mt-6 rounded-xl bg-gold/10 px-4 py-3 text-center text-sm text-ink"
          >
            Para continuar falta: {faltan.join(', ')}.
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
