import { useEffect, useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Card from '../components/Card'
import Input from '../components/Input'
import Select from '../components/Select'
import Button from '../components/Button'
import Loading from '../components/Loading'
import Checkbox from '../components/Checkbox'
import VehiculosDeLaEstancia from '../components/VehiculosDeLaEstancia'
import DeclararIncapacidad from '../components/DeclararIncapacidad'
import FileUploader from '../components/FileUploader'
import TarjetaAcompanante from '../components/TarjetaAcompanante'
import LinksIndividuales from '../components/LinksIndividuales'
import BloqueTutela from '../components/BloqueTutela'
import { porQueFallo } from '../lib/motivo'
import { esMayorDeEdadAlLlegar, hoyEnIso } from '../lib/edad'
import {
  soloNombre,
  errorDeFechaExpedicion,
  pideFechaExpedicion,
} from '../lib/ficha'
import {
  cerrarPrecheckin,
  incapacidadesDelPrecheckin,
  retirarIncapacidad,
  consultarPrecheckin,
  fichaDelPrecheckin,
  tieneDosCaras,
  topeDePersonas,
  guardarAcompanante,
  guardarFechaExpedicion,
  abrirEnlaceAcompanante,
  listarAcompanantes,
  quitarAcompanante,

  tokenActual,
  TIPOS_DOCUMENTO,
  adultosDeLaEstancia,
  necesitaPermiso,
  PARENTESCOS,
  subirAutorizacionMenor,
  subirLoElegido,
  avisoDeLoQueNoSubio,
  subirDocumentoPrecheckin,
  type Acompanante,
  type AdultoDeLaEstancia,
  type FichaGuardada,
  type Parentesco,
  type TipoDocumento,
} from '../lib/precheckin'

/**
 * Qué puede ser el responsable de un menor.
 *
 * Padre y madre no necesitan papel —su vínculo no se acredita con un permiso de
 * viaje— y los otros dos sí. Lo pidió el cliente el 02/10/2026: «Menores sin
 * padre o madre siempre pedir documentación del responsable pues!».
 */
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
  /*
    Por quién declaró ya el titular —«esta persona no puede registrarse
    sola»—, con su motivo. Va aparte de la lista porque la lista la comparten
    otras pantallas y esto solo lo ve y lo hace el titular.
  */
  const [incapacidades, setIncapacidades] = useState<Record<string, string>>({})
  const [declarandoPor, setDeclarandoPor] = useState<Acompanante | null>(null)
  const nombreDelTitular =
    (useLocation().state as { nombre?: string } | null)?.nombre ?? ''
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cerrando, setCerrando] = useState(false)

  const [nombre, setNombre] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [tipoDoc, setTipoDoc] = useState<TipoDocumento | ''>('')
  const [documento, setDocumento] = useState('')
  // Solo con cédula de extranjería o PPT: Tus Datos no los consulta sin ella.
  const [fechaExpedicion, setFechaExpedicion] = useState('')
  const [telefono, setTelefono] = useState('')
  const [correo, setCorreo] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [responsableId, setResponsableId] = useState('')
  const [parentesco, setParentesco] = useState<Parentesco | ''>('')
  /*
    Quién puede hacerse cargo. Lista aparte de la de acompañantes porque el
    **titular** también puede serlo —es el caso normal, una madre que viaja con
    su hijo— y aquella devuelve a propósito a todos menos a él.
  */
  const [adultos, setAdultos] = useState<AdultoDeLaEstancia[]>([])
  const [subiendo, setSubiendo] = useState<string | null>(null)
  /*
    La foto del documento y la autorización, elegidas en el mismo formulario
    (15/10/2026). Se suben apenas la persona existe. `altaN` vuelve a montar
    los selectores al limpiar, para que no se queden con el archivo anterior.
  */
  const [fotoDocumento, setFotoDocumento] = useState<File | null>(null)
  const [fotoReverso, setFotoReverso] = useState<File | null>(null)
  const [autorizacion, setAutorizacion] = useState<File | null>(null)
  // «Documento adicional N» de la tutela, como en la maqueta (15/10/2026).
  const [adicionales, setAdicionales] = useState<File[]>([])
  const [altaN, setAltaN] = useState(0)
  /*
    Las dos casillas de la maqueta en la tarjeta del acompañante nuevo:
    «completará su documentación por sí mismo» (al añadirlo se le genera su
    enlace) y «no está en capacidad de aceptar» (al añadirlo se abre la
    declaración por esa persona).
  */
  const [porSiMismo, setPorSiMismo] = useState(false)
  const [noPuedeAceptar, setNoPuedeAceptar] = useState(false)
  // El huésped principal, para su tarjeta de arriba.
  const [titular, setTitular] = useState<FichaGuardada | null>(null)
  /*
    El enlace de un acompañante vuelve **una sola vez**: en la base vive solo su
    sha256. Se guarda aqui para poder enseñarlo y copiarlo; si se cierra sin
    copiarlo, hay que emitir otro y el anterior deja de valer.
  */
  const [enlaces, setEnlaces] = useState<Record<string, string>>({})
  /*
    Cuantas personas caben y de donde sale ese numero.

    Hasta el 09/10/2026 esta pantalla no lo sabia: dejaba añadir sin limite
    hasta que la base decia que no, y la base solo miraba el aforo del
    alojamiento --cuatro en la 102-- porque **lo que el anfitrion reservo no
    se guardaba en ninguna parte**. Asi que en una reserva para una persona se
    podian meter tres mas. Lo vio el cliente abriendo su propio enlace.

    `consultar_precheckin` devuelve ahora el tope y cuantas hay. No se cuentan
    aqui a mano: si la pantalla suma por su cuenta, el limite vive en dos
    sitios y uno de los dos se queda viejo.
  */
  const [cupo, setCupo] = useState<{
    tope: number | null
    esDeLaReserva: boolean
  }>({ tope: null, esDeLaReserva: false })
  const [menoresEsperados, setMenoresEsperados] = useState(0)
  /*
    El día de llegada: es contra él, y no contra hoy, contra el que la base
    decide si alguien es menor. Quien cumple años entre la reserva y el
    check-in llega siendo adulto.
  */
  const [llegada, setLlegada] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    Promise.all([
      listarAcompanantes(token),
      adultosDeLaEstancia(token),
      consultarPrecheckin(token),
    ])
      .then(([acompanantes, mayores, estancia]) => {
        setLista(acompanantes)
        setAdultos(mayores)
        setCupo(topeDePersonas(estancia))
        setMenoresEsperados(estancia?.menores_previstos ?? 0)
        setLlegada(estancia?.fecha_desde ?? null)
      })
      .catch(() => setError('No pudimos cargar la lista'))
      .finally(() => setCargando(false))
    // Aparte: si esto falla, la lista se sigue pudiendo usar.
    incapacidadesDelPrecheckin(token)
      .then(setIncapacidades)
      .catch(() => {})
    fichaDelPrecheckin(token)
      .then(setTitular)
      .catch(() => {})
  }, [token])

  if (!token) return <Navigate to="/invitacion" replace />

  const limpiar = () => {
    setNombre('')
    setApellidos('')
    setTipoDoc('')
    setDocumento('')
    setFechaExpedicion('')
    setTelefono('')
    setCorreo('')
    setFechaNacimiento('')
    setResponsableId('')
    setParentesco('')
    setFotoDocumento(null)
    setFotoReverso(null)
    setAutorizacion(null)
    setAdicionales([])
    setPorSiMismo(false)
    setNoPuedeAceptar(false)
    setAltaN((n) => n + 1)
  }

  /*
    Las mismas reglas que aplica la base, aquí solo para poder decir qué falta
    antes de ir por red: un adulto lleva documento; un menor lleva quién
    responde por él y qué es suyo.
  */
  /*
    El titular cuenta: el tope es de personas, no de acompañantes. `lista` son
    los acompañantes, asi que las personas de la reserva son una mas.
  */
  const personas = lista.length + 1
  const quedanPlazas = cupo.tope === null || personas < cupo.tope
  /*
    Cuantos menores dijo el anfitrion y cuantos van puestos. El titular no
    cuenta: tiene que ser mayor de edad para cerrar la reserva.
  */
  const menoresPuestos = lista.filter((p) => p.es_menor).length

  /*
    Si quien se está añadiendo es menor **lo dice su fecha**, igual que en la
    base. Sin fecha todavía no se sabe, y entonces se le trata como adulto:
    es lo prudente --se le pide el documento-- y es lo que hace la base, que
    sin fecha se queda con lo que le manden.
  */
  const esMenor = fechaNacimiento
    ? esMayorDeEdadAlLlegar(fechaNacimiento, llegada) === false
    : false

  /*
    Un adulto se puede añadir **sin nada**: sin nombre y sin documento.

    Para mandarle su enlace hay que crearlo antes, y hasta el 09/10/2026 para
    crearlo hacían falta su nombre y su documento —que es justo lo que ese
    enlace sirve para conseguir—. El cliente se quedó sin nada que compartir:
    «no había cómo compartir a alguien más para que llene los suyos».

    El documento se le sigue exigiendo, pero donde importa: al cerrar. Sin él
    `cerrar_precheckin` responde «Falta el documento de: X».

    Un menor sí necesita quién responde por él antes de existir: es lo que lo
    distingue de un adulto sin fecha, y sin eso un niño entra sin que nadie
    diga quién lo trae.
  */
  const puedeAnadir =
    quedanPlazas && (esMenor ? responsableId !== '' && parentesco !== '' : true)

  const anadir = async () => {
    if (!puedeAnadir) return
    setError(null)
    try {
      const id = await guardarAcompanante(token, {
        // Vacío vale: la base lo nombra «Acompañante N» hasta que él lo diga.
        nombre: nombre.trim(),
        apellidos: apellidos.trim() || undefined,
        tipoDocumento: tipoDoc || undefined,
        documento: documento.trim() || undefined,
        correo: correo.trim() || undefined,
        telefono: telefono.trim() || undefined,
        esMenor,
        fechaNacimiento: fechaNacimiento || undefined,
        responsableId: esMenor ? responsableId : undefined,
        parentesco: esMenor ? (parentesco as Parentesco) : undefined,
      })
      if (!esMenor && pideFechaExpedicion(tipoDoc) && fechaExpedicion) {
        await guardarFechaExpedicion(token, fechaExpedicion, id)
      }
      const conPermiso = esMenor && necesitaPermiso(parentesco || null)
      const fallos = await subirLoElegido(token, id, {
        documento: fotoDocumento,
        reverso: fotoReverso,
        autorizacion: conPermiso ? autorizacion : null,
        adicionales: conPermiso ? adicionales : [],
      })
      // Lo que se marcó en la tarjeta: su enlace, o declarar por esa persona.
      const quiereEnlace = !esMenor && porSiMismo
      const quiereDeclarar = !esMenor && !porSiMismo && noPuedeAceptar
      const [acompanantes, mayores] = await Promise.all([
        listarAcompanantes(token),
        // Quien acaba de entrar como adulto pasa a poder hacerse cargo de un
        // niño, así que la lista se vuelve a pedir y no se parchea a mano.
        adultosDeLaEstancia(token),
      ])
      setLista(acompanantes)
      setAdultos(mayores)
      limpiar()
      setError(avisoDeLoQueNoSubio(fallos))
      const nueva = acompanantes.find((a) => a.id === id)
      if (nueva && quiereEnlace) void mandarEnlace(nueva)
      if (nueva && quiereDeclarar) setDeclarandoPor(nueva)
    } catch (e) {
      setError(porQueFallo(e, 'No pudimos añadirlo'))
    }
  }

  /**
   * Emite el enlace propio de un acompañante.
   *
   * Es lo que le deja llenar sus datos y, sobre todo, **aceptar sus propios
   * terminos**: el titular puede teclearle la ficha, pero no puede aceptar por
   * el. El enlace vuelve una sola vez.
   */
  const mandarEnlace = async (persona: Acompanante) => {
    if (!token) return
    setError(null)
    try {
      const suToken = await abrirEnlaceAcompanante(token, persona.id)
      setEnlaces((antes) => ({
        ...antes,
        [persona.id]: `${window.location.origin}/access/acompanante/${suToken}`,
      }))
      setLista(await listarAcompanantes(token))
    } catch (e) {
      setError(porQueFallo(e, 'No pudimos generar su enlace'))
    }
  }

  /** El permiso firmado de quien no es su padre ni su madre. */
  const subirPermiso = async (persona: Acompanante, archivo: File) => {
    setError(null)
    setSubiendo(persona.id)
    try {
      await subirAutorizacionMenor(token, persona.id, archivo)
      setLista(await listarAcompanantes(token))
    } catch (e) {
      setError(porQueFallo(e, 'No pudimos guardar la autorización'))
    } finally {
      setSubiendo(null)
    }
  }

  /** Un documento más de la tutela, después del principal. */
  const subirAdicional = async (persona: Acompanante, archivo: File) => {
    setError(null)
    setSubiendo(persona.id)
    try {
      await subirAutorizacionMenor(token, persona.id, archivo, true)
    } catch (e) {
      setError(porQueFallo(e, 'No pudimos guardar el documento'))
    } finally {
      setSubiendo(null)
    }
  }

  /**
   * La foto del documento de un menor.
   *
   * La sube el titular, no el menor: un menor **no tiene enlace propio**
   * --no puede aceptar terminos, asi que no se le emite-- y hasta el
   * 09/10/2026 no habia ningun camino para subirla. La funcion de servidor
   * comprueba que esa persona sea de la misma estancia que el token.
   *
   * Solo el frente: el reverso se pide en el documento del titular porque ahi
   * hay una validacion de identidad detras; aqui lo que hace falta es que la
   * porteria pueda comparar en la puerta.
   */
  const subirDocumentoDeMenor = async (persona: Acompanante, archivo: File) => {
    setError(null)
    setSubiendo(persona.id)
    try {
      await subirDocumentoPrecheckin(token, archivo, 'frente', persona.id)
      setLista(await listarAcompanantes(token))
    } catch (e) {
      setError(porQueFallo(e, 'No pudimos guardar el documento'))
    } finally {
      setSubiendo(null)
    }
  }

  const refrescar = async () => {
    const [acompanantes, declaradas] = await Promise.all([
      listarAcompanantes(token),
      incapacidadesDelPrecheckin(token),
    ])
    setLista(acompanantes)
    setIncapacidades(declaradas)
  }

  const retirarDeclaracion = async (persona: Acompanante) => {
    setError(null)
    try {
      await retirarIncapacidad(token, persona.id)
      await refrescar()
    } catch (e) {
      setError(porQueFallo(e, 'No pudimos retirar la declaración'))
    }
  }

  const quitar = async (id: string) => {
    setError(null)
    try {
      await quitarAcompanante(token, id)
      setLista(await listarAcompanantes(token))
    } catch (e) {
      setError(porQueFallo(e, 'No pudimos quitarlo'))
    }
  }

  const finalizar = async () => {
    setCerrando(true)
    setError(null)
    try {
      /*
        Lo que hay ahora, no lo que se cargó al entrar: un acompañante puede
        haber terminado lo suyo desde su enlace mientras esta pantalla estaba
        abierta, y la validación decía que le faltaban los documentos
        (16/10/2026).
      */
      const actual = await listarAcompanantes(token).catch(() => lista)
      const acceso = await cerrarPrecheckin(token)
      // Como en la maqueta: después de enviar, el detalle de validación.
      const huespedes = [
        {
          nombre:
            `${titular?.nombre ?? nombreDelTitular} ${titular?.apellidos ?? ''}`.trim() || 'Tú',
          identificacion: titular?.documento ?? '',
          principal: true,
          documentoSubido: Boolean(titular?.tieneDocumento),
          terminosAceptados: Boolean(titular?.terminosAceptados),
        },
        ...actual.map((p) => ({
          nombre: `${p.nombre} ${p.apellidos ?? ''}`.trim(),
          identificacion: p.documento_numero ?? '',
          esMenor: p.es_menor,
          documentoSubido: p.tiene_documento,
          terminosAceptados: p.terminos_aceptados,
          exento: Boolean(incapacidades[p.id]),
        })),
      ]
      navigate('/validation', { state: { acceso, huespedes } })
    } catch (e) {
      setError(porQueFallo(e, 'No pudimos cerrar el registro'))
      setCerrando(false)
    }
  }

  /*
    Los adultos a los que todavía les falta algo de su parte --documento o
    términos-- y que no tienen declaración: son los que necesitan su enlace.
  */
  const sinTerminar = lista.filter(
    (p) => !p.es_menor && !incapacidades[p.id] && (!p.terminos_aceptados || !p.tiene_documento),
  )
  const etiquetaDocTitular =
    TIPOS_DOCUMENTO.find((t) => t.value === titular?.tipoDocumento)?.label ?? ''

  /*
    El aspecto es el de la maqueta original del preregistro (15/10/2026, a
    pedido del cliente: «la interfaz debe ser esa, tal cual»): título a la
    izquierda, tarjeta del huésped principal, vehículos, una tarjeta por
    acompañante con su estado de validación, los enlaces individuales y
    «Enviar información». Lo que se construyó encima --menores con quien
    responde, carta de potestad, declarar por quien no puede, cupo de la
    reserva, enlace propio de cada adulto, cierre de verdad-- va dentro de ese
    diseño, no al lado.
  */
  return (
    <MainLayout header="default" bg="soft">
      <div className="mx-auto max-w-[820px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-brand">Paso 3 de 3</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand/20">
            <div className="h-full w-full rounded-full bg-brand" />
          </div>
        </div>

        <h1 className="mt-4 font-display text-3xl font-extrabold text-ink sm:text-[34px]">
          Registro de acompañantes
        </h1>
        <p className="mt-2 text-base text-ink/60">
          Los términos y condiciones de este pre registro de seguridad deben
          ser aceptados por cada miembro de la reservación. Al incluir sus
          correos, recibirán el instructivo para completar su registro.
        </p>

        {/*
          Cuantas caben, siempre a la vista. Un formulario que deja escribir y
          despues dice que no hay sitio hace teclear para nada.
        */}
        {cupo.tope !== null && (
          <p className="mt-2 text-sm text-ink/60">
            {personas} de {cupo.tope} personas
            {cupo.esDeLaReserva ? ' que reservó el anfitrión' : ' que admite el alojamiento'}
          </p>
        )}
        {/*
          Lo que el anfitrión dijo sobre los menores: un aviso, no una regla.
          Quién es menor lo decide su fecha de nacimiento.
        */}
        {menoresEsperados > 0 && menoresEsperados !== menoresPuestos && (
          <p className="mt-1 text-xs text-ink/50">
            El anfitrión indicó que{' '}
            {menoresEsperados === 1
              ? 'una de ellas es menor de edad'
              : `${menoresEsperados} son menores de edad`}
            {menoresPuestos > 0 ? ` (llevas ${menoresPuestos})` : ''}.
          </p>
        )}

        {cargando ? (
          <div className="flex justify-center py-10">
            <Loading />
          </div>
        ) : (
          <>
            {/* Huésped principal */}
            <Card className="mt-6 px-6 py-7 sm:px-10 sm:py-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">
                Huésped principal
              </p>
              <h3 className="mt-1.5 text-lg font-bold text-ink">
                {`${titular?.nombre ?? nombreDelTitular} ${titular?.apellidos ?? ''}`.trim() || 'Tú'}
              </h3>
              {etiquetaDocTitular && (
                <p className="mt-1 text-sm font-semibold text-ink/70">
                  Tipo de documento: <span className="text-ink">{etiquetaDocTitular}</span>
                </p>
              )}
              {titular?.documento && (
                <p className="mt-1 text-sm font-semibold text-ink/70">
                  Identificación: <span className="text-ink">{titular.documento}</span>
                </p>
              )}
            </Card>

            {/* Vehículos */}
            <VehiculosDeLaEstancia token={token} adultos={adultos} />

            {/* Una tarjeta por acompañante */}
            {lista.length > 0 && (
              <div className="mt-6 space-y-6">
                {lista.map((persona, i) => (
                  <TarjetaAcompanante
                    key={persona.id}
                    persona={persona}
                    numero={i + 1}
                    adultos={adultos}
                    incapacidad={incapacidades[persona.id]}
                    declarando={declarandoPor?.id === persona.id}
                    subiendo={subiendo === persona.id}
                    onSubirDocumento={(f) => void subirDocumentoDeMenor(persona, f)}
                    onSubirCarta={(f) => void subirPermiso(persona, f)}
                    onSubirAdicional={(f) => void subirAdicional(persona, f)}
                    onNoPuedeAceptar={(activar) => setDeclarandoPor(activar ? persona : null)}
                    onRetirarDeclaracion={() => void retirarDeclaracion(persona)}
                    onQuitar={() => void quitar(persona.id)}
                  >
                    <DeclararIncapacidad
                      token={token}
                      persona={persona}
                      nombreTitular={nombreDelTitular || titular?.nombre || ''}
                      onCancelar={() => setDeclarandoPor(null)}
                      onHecho={() => {
                        setDeclarandoPor(null)
                        void refrescar().catch(() => {})
                      }}
                    />
                  </TarjetaAcompanante>
                ))}
              </div>
            )}

            {/* Links individuales para acompañantes */}
            <LinksIndividuales
              personas={sinTerminar}
              enlaces={enlaces}
              onGenerar={(persona) => void mandarEnlace(persona)}
            />

            {/* La tarjeta del acompañante nuevo */}
            {quedanPlazas ? (
              <Card className="mt-6 px-6 py-7 sm:px-10 sm:py-8">
                <h3 className="text-lg font-bold text-ink">Acompañante {lista.length + 1}</h3>

                {!esMenor && (
                  <div className="mt-5">
                    <Checkbox
                      label="Este acompañante completará su documentación y sus datos por sí mismo."
                      checked={porSiMismo}
                      onChange={(e) => setPorSiMismo(e.target.checked)}
                    />
                  </div>
                )}

                <div className="mt-5 space-y-4">
                  {porSiMismo && !esMenor && (
                    <div className="rounded-xl bg-brand/5 px-5 py-4">
                      <p className="text-sm leading-relaxed text-ink/80">
                        Este acompañante completará su documentación y sus
                        datos por sí mismo. Al añadirlo te damos su enlace
                        para que se lo mandes.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="Nombres"
                      tone="soft"
                      placeholder="Como figura en el documento"
                      value={nombre}
                      onChange={(e) => setNombre(soloNombre(e.target.value))}
                    />
                    <Input
                      label="Apellidos"
                      tone="soft"
                      placeholder="Como figuran en el documento"
                      value={apellidos}
                      onChange={(e) => setApellidos(soloNombre(e.target.value))}
                    />
                  </div>

                  {porSiMismo && !esMenor ? (
                    <Input
                      label="Correo electrónico del acompañante"
                      type="email"
                      tone="soft"
                      placeholder="correo@ejemplo.com"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                    />
                  ) : (
                    <>
                      {/* Si es menor lo dice su fecha, como en la base. */}
                      <Input
                        label="Fecha de nacimiento"
                        type="date"
                        tone="soft"
                        max={hoyEnIso()}
                        value={fechaNacimiento}
                        onChange={(e) => setFechaNacimiento(e.target.value)}
                      />

                      {esMenor && (
                        <BloqueTutela>
                          <p className="text-xs text-ink/70">
                            Con esa fecha es <strong>menor de edad</strong> el
                            día de llegada. Di quién responde por el menor; si
                            no es su padre ni su madre, sube la carta de
                            potestad o tutela.
                          </p>
                          <Select
                            label="Adulto responsable por el menor"
                            tone="soft"
                            placeholder="Elige a un adulto de esta reserva"
                            options={adultos.map((a) => ({
                              value: a.id,
                              label:
                                `${a.nombre} ${a.apellidos ?? ''}`.trim() +
                                (a.es_titular ? ' (tú)' : ''),
                            }))}
                            value={responsableId}
                            onChange={(e) => setResponsableId(e.target.value)}
                          />
                          <Select
                            label="Parentesco"
                            tone="soft"
                            placeholder="Seleccione"
                            options={PARENTESCOS as unknown as { value: string; label: string }[]}
                            value={parentesco}
                            onChange={(e) => setParentesco(e.target.value as Parentesco | '')}
                          />
                          {necesitaPermiso(parentesco || null) && (
                            <>
                              <FileUploader
                                key={`autorizacion-${altaN}`}
                                tone="soft"
                                title="Carta de potestad / tutela notarial"
                                hint="Foto o PDF."
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                onFileSelected={setAutorizacion}
                              />
                              {autorizacion &&
                                adicionales.map((_, di) => (
                                  <p key={di} className="text-xs font-semibold text-success">
                                    Documento adicional {di + 1} listo para subir
                                  </p>
                                ))}
                              {autorizacion && (
                                <FileUploader
                                  key={`adicional-${altaN}-${adicionales.length}`}
                                  tone="soft"
                                  compact
                                  title={`Documento adicional ${adicionales.length + 1}`}
                                  hint="Si la tutela viene en varias hojas. Foto o PDF."
                                  accept="image/jpeg,image/png,image/webp,application/pdf"
                                  onFileSelected={(f) => setAdicionales((antes) => [...antes, f])}
                                />
                              )}
                            </>
                          )}
                        </BloqueTutela>
                      )}

                      {/* El documento se pide a todos, también a un menor. */}
                      <Select
                        label="Tipo de documento"
                        tone="soft"
                        placeholder="Seleccione"
                        options={TIPOS_DOCUMENTO as unknown as { value: string; label: string }[]}
                        value={tipoDoc}
                        onChange={(e) => setTipoDoc(e.target.value as TipoDocumento | '')}
                      />
                      {tipoDoc && (
                        <div className="space-y-3">
                          <FileUploader
                            key={`frente-${altaN}`}
                            tone="soft"
                            title={tieneDosCaras(tipoDoc) ? 'Foto del frente' : 'Foto del pasaporte'}
                            accept="image/jpeg,image/png,image/webp"
                            onFileSelected={setFotoDocumento}
                          />
                          {tieneDosCaras(tipoDoc) && (
                            <FileUploader
                              key={`reverso-${altaN}`}
                              tone="soft"
                              title="Foto del reverso"
                              accept="image/jpeg,image/png,image/webp"
                              onFileSelected={setFotoReverso}
                            />
                          )}
                        </div>
                      )}
                      <Input
                        label="Número de identificación"
                        tone="soft"
                        placeholder="Tal como aparece en el documento"
                        value={documento}
                        onChange={(e) => setDocumento(e.target.value)}
                      />
                      {!esMenor && pideFechaExpedicion(tipoDoc) ? (
                        <Input
                          label="Fecha de expedición del documento"
                          type="date"
                          tone="soft"
                          max={hoyEnIso()}
                          value={fechaExpedicion}
                          error={errorDeFechaExpedicion(fechaExpedicion, fechaNacimiento, hoyEnIso())}
                          onChange={(e) => setFechaExpedicion(e.target.value)}
                        />
                      ) : null}

                      {!esMenor && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Input
                            label="Teléfono"
                            type="tel"
                            tone="soft"
                            placeholder="Ingrese el teléfono"
                            value={telefono}
                            onChange={(e) => setTelefono(e.target.value)}
                          />
                          <Input
                            label="Correo electrónico"
                            type="email"
                            tone="soft"
                            placeholder="correo@ejemplo.com"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                          />
                        </div>
                      )}

                      {!esMenor && (
                        <div className="border-t border-line pt-4">
                          <Checkbox
                            label="Este usuario no está en capacidad de aceptar por su cuenta los Términos y Condiciones."
                            checked={noPuedeAceptar}
                            onChange={(e) => setNoPuedeAceptar(e.target.checked)}
                          />
                          {noPuedeAceptar && (
                            <p className="mt-2 text-xs text-ink/60">
                              Al completar el registro te pedimos el motivo y tu
                              firma: aceptas los términos en su nombre y asumes
                              la responsabilidad.
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button type="button" disabled={!puedeAnadir} onClick={anadir}>
                      Completar registro
                    </Button>
                  </div>
                  {!esMenor && !porSiMismo && documento.trim() === '' && (
                    <p className="text-right text-xs text-ink/60">
                      Sin su documento también se puede añadir: se lo vas a
                      pedir con su enlace. Hace falta antes de terminar.
                    </p>
                  )}
                  {esMenor && !puedeAnadir && (
                    <p className="text-right text-xs text-ink/60">
                      Falta decir quién responde por el menor y su parentesco.
                    </p>
                  )}
                </div>
              </Card>
            ) : (
              /*
                Lleno. Se dice a quién pedirle más sitio: lo que reservó el
                anfitrión lo cambia él; el aforo del piso es otra conversación.
              */
              <div className="mt-6 rounded-2xl border border-line bg-surface-soft p-5 text-center">
                <p className="text-sm font-semibold text-ink">
                  Ya están todas las personas de la reserva
                </p>
                <p className="mt-1 text-xs text-ink/60">
                  {cupo.esDeLaReserva
                    ? 'Si viene alguien más, pídeselo al anfitrión: es quien amplía la reserva.'
                    : 'El alojamiento no admite más personas.'}
                </p>
              </div>
            )}

            {error && (
              <p className="mt-6 rounded-xl bg-danger/5 px-4 py-3 text-center text-sm font-semibold text-danger">
                {error}
              </p>
            )}

            <div className="mt-10 flex flex-col items-center border-t border-line pt-8">
              <Button
                type="button"
                className="w-full max-w-md py-3.5 text-base"
                disabled={cerrando}
                onClick={finalizar}
              >
                {cerrando ? 'Enviando…' : 'Enviar información'}
              </Button>
              {/* Cerrado el preregistro, la lista deja de tocarse desde aquí. */}
              <p className="mt-3 text-center text-xs text-ink/60">
                Al enviar ya no vas a poder cambiar esta lista desde aquí.
              </p>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}
