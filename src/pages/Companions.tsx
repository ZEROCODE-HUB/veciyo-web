import { useEffect, useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Card from '../components/Card'
import Input from '../components/Input'
import Select from '../components/Select'
import Button from '../components/Button'
import Loading from '../components/Loading'
import Modal from '../components/Modal'
import VehiculosDeLaEstancia from '../components/VehiculosDeLaEstancia'
import DeclararIncapacidad from '../components/DeclararIncapacidad'
import FileUploader from '../components/FileUploader'
import { porQueFallo } from '../lib/motivo'
import { esMayorDeEdadAlLlegar, hoyEnIso } from '../lib/edad'
import { errorDeFechaExpedicion, pideFechaExpedicion } from '../lib/ficha'
import {
  cerrarPrecheckin,
  incapacidadesDelPrecheckin,
  retirarIncapacidad,
  consultarPrecheckin,
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
  const [autorizacion, setAutorizacion] = useState<File | null>(null)
  const [altaN, setAltaN] = useState(0)
  /*
    El enlace de un acompañante vuelve **una sola vez**: en la base vive solo su
    sha256. Se guarda aqui para poder enseñarlo y copiarlo; si se cierra sin
    copiarlo, hay que emitir otro y el anterior deja de valer.
  */
  const [enlace, setEnlace] = useState<{ nombre: string; url: string } | null>(null)
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
    setAutorizacion(null)
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
      const fallos = await subirLoElegido(token, id, {
        documento: fotoDocumento,
        autorizacion: esMenor && necesitaPermiso(parentesco || null) ? autorizacion : null,
      })
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
      setEnlace({
        nombre: persona.nombre,
        url: `${window.location.origin}/access/acompanante/${suToken}`,
      })
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
      const acceso = await cerrarPrecheckin(token)
      navigate('/download-app', { state: { acceso } })
    } catch (e) {
      setError(porQueFallo(e, 'No pudimos cerrar el registro'))
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
                          ? 'Menor de edad'
                          : persona.documento_numero}
                      </p>

                      {/*
                        Lo que le falta a un niño. Sin esto el titular pulsa
                        «finalizar», recibe un error con un nombre y no tiene
                        nada que hacer desde donde está.
                      */}
                      {persona.es_menor && (
                        <>
                          {/*
                            Su documento, igual que el de un adulto: el
                            ministerio lo pide por cada persona. La diferencia
                            es quien lo sube --el titular, porque un menor no
                            tiene enlace propio-- no si hace falta.
                          */}
                          <p
                            className={`mt-1 text-xs font-semibold ${
                              persona.tiene_documento
                                ? 'text-green-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {persona.tiene_documento
                              ? '✓ Subiste la foto de su documento'
                              : 'Falta la foto de su documento'}
                          </p>
                          {!persona.tiene_documento && (
                            <label className="mt-1 block text-xs font-semibold text-primary underline">
                              {subiendo === persona.id
                                ? 'Subiendo…'
                                : 'Subir la foto de su documento'}
                              <input
                                type="file"
                                className="hidden"
                                accept="image/jpeg,image/png,image/webp"
                                disabled={subiendo === persona.id}
                                onChange={(e) => {
                                  const archivo = e.target.files?.[0]
                                  if (archivo)
                                    void subirDocumentoDeMenor(persona, archivo)
                                  // Para poder volver a elegir el mismo
                                  // archivo si la primera vez falló.
                                  e.target.value = ''
                                }}
                              />
                            </label>
                          )}
                          <p className="mt-1 text-xs text-ink/60">
                            {persona.responsable_id
                              ? `Responde por él: ${
                                  adultos.find((a) => a.id === persona.responsable_id)
                                    ?.nombre ?? 'alguien de la reserva'
                                } (${
                                  PARENTESCOS.find((x) => x.value === persona.parentesco)
                                    ?.label ?? '—'
                                })`
                              : 'Falta decir quién responde por él'}
                          </p>

                          {necesitaPermiso(persona.parentesco) && (
                            <p
                              className={`mt-1 text-xs font-semibold ${
                                persona.tiene_autorizacion
                                  ? 'text-green-700'
                                  : 'text-amber-700'
                              }`}
                            >
                              {persona.tiene_autorizacion
                                ? '✓ Autorización firmada subida'
                                : 'Falta su autorización firmada'}
                            </p>
                          )}

                          {necesitaPermiso(persona.parentesco) &&
                            !persona.tiene_autorizacion && (
                              <label className="mt-2 block text-xs font-semibold text-primary underline">
                                {subiendo === persona.id
                                  ? 'Subiendo…'
                                  : 'Subir la autorización'}
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/jpeg,image/png,image/webp,application/pdf"
                                  disabled={subiendo === persona.id}
                                  onChange={(e) => {
                                    const archivo = e.target.files?.[0]
                                    if (archivo) void subirPermiso(persona, archivo)
                                    // Para poder volver a elegir el mismo
                                    // archivo si la primera vez falló.
                                    e.target.value = ''
                                  }}
                                />
                              </label>
                            )}
                        </>
                      )}
                      {/*
                        Quien falta por aceptar. Desde el 03/10/2026 el registro
                        no se cierra hasta que cada adulto acepte lo suyo, asi
                        que decirlo aqui es lo que evita pulsar «finalizar» y
                        recibir un error con tres nombres y nada que hacer.
                      */}
                      {/*
                        Las **dos** cosas que le faltan, no una.

                        Antes solo se decía lo de los términos, así que quien
                        leía esto daba por hecho que el documento ya estaba o
                        que lo subía el titular. Ninguna de las dos: lo sube él
                        desde su enlace, porque va junto con aceptar lo suyo y
                        eso nadie lo puede hacer por otro. Lo preguntó el
                        cliente el 09/10/2026.
                      */}
                      {!persona.es_menor && (
                        <>
                          <p
                            className={`mt-1 text-xs font-semibold ${
                              persona.tiene_documento
                                ? 'text-green-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {persona.tiene_documento
                              ? '✓ Subió la foto de su documento'
                              : 'Sin foto de su documento (opcional, la sube desde su enlace)'}
                          </p>
                          <p
                            className={`mt-1 text-xs font-semibold ${
                              persona.terminos_aceptados
                                ? 'text-green-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {incapacidades[persona.id]
                              ? '✓ Aceptaste por esta persona'
                              : persona.terminos_aceptados
                                ? '✓ Aceptó sus términos'
                                : 'Le falta aceptar sus términos'}
                          </p>
                        </>
                      )}
                      {/*
                        Quien no puede hacerlo por sí mismo. Declarado: se dice
                        por qué, se deja deshacer, y la foto de su documento la
                        sube el titular —a esta persona no le llega un enlace—.
                      */}
                      {!persona.es_menor && incapacidades[persona.id] && (
                        <>
                          <p className="mt-1 text-xs text-ink/60">
                            Declaraste que no puede registrarse sola:{' '}
                            {incapacidades[persona.id]}
                          </p>
                          {!persona.tiene_documento && (
                            <label className="mt-2 block text-xs font-semibold text-primary underline">
                              {subiendo === persona.id
                                ? 'Subiendo…'
                                : 'Subir la foto de su documento'}
                              <input
                                type="file"
                                className="hidden"
                                accept="image/jpeg,image/png,image/webp"
                                disabled={subiendo === persona.id}
                                onChange={(e) => {
                                  const archivo = e.target.files?.[0]
                                  if (archivo) void subirDocumentoDeMenor(persona, archivo)
                                  e.target.value = ''
                                }}
                              />
                            </label>
                          )}
                          <button
                            type="button"
                            onClick={() => void retirarDeclaracion(persona)}
                            className="mt-2 block text-xs font-semibold text-ink/60 underline"
                          >
                            Retirar la declaración
                          </button>
                        </>
                      )}
                      {!persona.es_menor &&
                        !incapacidades[persona.id] &&
                        !persona.terminos_aceptados && (
                          <button
                            type="button"
                            onClick={() => setDeclarandoPor(persona)}
                            className="mt-2 block text-xs font-semibold text-ink/60 underline"
                          >
                            Esta persona no puede hacerlo por sí misma
                          </button>
                        )}
                      {!persona.es_menor &&
                        !incapacidades[persona.id] &&
                        (!persona.terminos_aceptados || !persona.tiene_documento) && (
                          <button
                            type="button"
                            onClick={() => void mandarEnlace(persona)}
                            className="mt-2 text-xs font-semibold text-primary underline"
                          >
                            {persona.tiene_enlace
                              ? 'Generar otro enlace para esta persona'
                              : 'Darle su enlace para que los complete'}
                          </button>
                        )}
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

            {/*
              Cuantas caben, siempre a la vista. Un formulario que deja
              escribir y despues dice que no hay sitio hace teclear para nada.
            */}
            {cupo.tope !== null && (
              <p className="mt-6 text-center text-sm text-ink/60">
                {personas} de {cupo.tope} personas
                {cupo.esDeLaReserva ? ' que reservó el anfitrión' : ' que admite el alojamiento'}
              </p>
            )}

            {/*
              Lo que el anfitrión dijo sobre los menores.

              La ficha de un menor sin nombre no llega a crearse --las rellena
              quien lea este enlace-- así que sin decirlo aquí, «1 de los 2 es
              menor» se perdía entre la reserva y esta pantalla. Es un aviso,
              no una regla: quién es menor lo decide su fecha de nacimiento, y
              si al final vienen otros, vienen otros.
            */}
            {menoresEsperados > 0 && menoresEsperados !== menoresPuestos && (
              <p className="mt-1 text-center text-xs text-ink/50">
                El anfitrión indicó que{' '}
                {menoresEsperados === 1
                  ? 'una de ellas es menor de edad'
                  : `${menoresEsperados} son menores de edad`}
                {menoresPuestos > 0 ? ` (llevás ${menoresPuestos})` : ''}.
              </p>
            )}

            {quedanPlazas ? (
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

                {/*
                  **No se pregunta si es menor: lo dice su fecha.**

                  Había una casilla «Es menor de edad» además de este campo, y
                  el cliente la encontró absurda el 09/10/2026: «la anfitriona
                  puso que 1 era menor, y a mí me sigue preguntando si es menor
                  o no».

                  Tenía dos motivos para irse. Uno, que la base ya lo decide
                  desde el 03/10/2026 --`es_menor` se calcula contra el día de
                  llegada y la casilla se **ignora** cuando hay fecha-- así que
                  era un control que no decidía nada. Y dos, que era la puerta
                  de atrás: a un menor no se le pide documento, así que
                  marcarse menor era la forma de entrar al edificio sin
                  identificarse.

                  Es la misma familia que el interruptor de menor que se quitó
                  el mismo día en la pantalla del anfitrión: un dato con dos
                  sitios donde decidirse.
                */}
                {/* Nadie nace mañana: el calendario no ofrece el futuro. */}
                <Input
                  label="Fecha de nacimiento"
                  type="date"
                  tone="soft"
                  max={hoyEnIso()}
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                />

                {/*
                  Al quitar la casilla, el formulario cambia solo en cuanto se
                  escribe la fecha: desaparece el documento y aparece quién
                  responde. Eso sin decir nada se lee como un fallo, así que se
                  dice. Es lo que la casilla hacía de explicación, y lo único
                  suyo que valía la pena conservar.
                */}
                {esMenor && (
                  <p className="rounded-xl bg-ink/[0.04] px-3 py-2 text-xs text-ink/70">
                    Con esa fecha es <strong>menor de edad</strong> el día de
                    llegada. Hace falta decir quién responde por él, y su
                    documento —registro civil o tarjeta de identidad—, que es
                    lo que pide el ministerio por cada persona.
                  </p>
                )}

                {/*
                  A un menor no se le pide documento propio ni se le hace
                  aceptar términos. Lo que sí se pide es **quién responde por
                  él**: lo decidió el cliente el 02/10/2026, y sin eso un niño
                  cruzaba la puerta sin que nadie dijera quién lo trae.
                */}
                {esMenor && (
                  <>
                    <Select
                      label="Adulto responsable por el menor"
                      tone="soft"
                      placeholder="Elige a un adulto de esta reserva"
                      options={adultos.map((a) => ({
                        value: a.id,
                        label: `${a.nombre} ${a.apellidos ?? ''}`.trim() +
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
                    {/*
                      La autorización se elige aquí mismo (15/10/2026): antes
                      solo se podía subir desde su ficha, después de añadirlo,
                      y el cliente lo vio como que «no se puede subir directo».
                    */}
                    {necesitaPermiso(parentesco || null) && (
                      <FileUploader
                        key={`autorizacion-${altaN}`}
                        compact
                        title="Autorización firmada"
                        hint="Hace falta al no ser su padre ni su madre. Foto o PDF."
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onFileSelected={setAutorizacion}
                      />
                    )}
                  </>
                )}

                {/*
                  El documento se pide **a todos, también a un menor**.

                  Hasta el 09/10/2026 se le saltaba entero, y eso choca de
                  frente con para lo que existe este formulario: `loQueFalta`
                  del reporte a la TRA exige tipo y número **por cada
                  persona**, así que una estancia con un niño no se podía
                  declarar completa. En Colombia un menor sí tiene documento:
                  registro civil hasta los siete, tarjeta de identidad de
                  siete a diecisiete.

                  Lo decidió el cliente el 09/10/2026. Lo que **no** se hace
                  es comparar apellidos para adivinar parentescos: eso lo mira
                  el anfitrión, porque una madre casi nunca comparte el primer
                  apellido con su hijo y la regla marcaría sobre todo a
                  familias de verdad.
                */}
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
                {/*
                  La foto del documento, en el mismo formulario (15/10/2026):
                  se sube apenas la persona queda añadida. Opcional aquí; la
                  puede subir luego desde su ficha o desde su enlace.
                */}
                <FileUploader
                  key={`documento-${altaN}`}
                  compact
                  title="Foto de su documento (opcional)"
                  hint="El frente, donde se ve la foto"
                  accept="image/jpeg,image/png,image/webp"
                  onFileSelected={setFotoDocumento}
                />
                {!esMenor && pideFechaExpedicion(tipoDoc) ? (
                  <Input
                    label="Fecha de expedición del documento"
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

                {!esMenor && (
                  <>
                    {/*
                      El correo hace falta para mandarle **su propio enlace**,
                      que es lo unico que le deja aceptar sus terminos: nadie
                      puede aceptarlos por el. La RPC lo acepta desde el
                      principio y este formulario no lo pedia.
                    */}
                    <Input
                      label="Correo electrónico"
                      type="email"
                      tone="soft"
                      placeholder="Para mandarle su enlace"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
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
                {/*
                  Ya no es un requisito para añadirlo, así que no se dice como
                  si faltara algo: se dice **qué va a pasar**. Lo pide la
                  portería en la puerta y lo exige el cierre, pero lo puede
                  poner él desde su enlace, que es el caso normal.
                */}
                {!esMenor && documento.trim() === '' && (
                  <p className="px-1 text-xs text-ink/60">
                    Sin su documento también se puede añadir: se lo vas a pedir
                    con su enlace. Hace falta antes de terminar el registro.
                  </p>
                )}
                {esMenor && nombre.trim() !== '' && !puedeAnadir && (
                  <p className="px-1 text-xs text-ink/60">
                    Falta decir quién responde por él y qué es suyo. Tiene que
                    ser un adulto de esta misma reserva.
                  </p>
                )}
              </div>
            </div>
            ) : (
              /*
                Lleno. Se dice **a quien pedirle** mas sitio, que es distinto
                segun cual de los dos topes se alcanzo: lo que reservo el
                anfitrion lo cambia el en un momento; el aforo del piso es otra
                conversacion.
              */
              <div className="mt-8 rounded-2xl border border-line bg-surface-soft p-5 text-center">
                <p className="text-sm font-semibold text-ink">
                  Ya están todas las personas de la reserva
                </p>
                <p className="mt-1 text-xs text-ink/60">
                  {cupo.esDeLaReserva
                    ? 'Si viene alguien más, pediselo al anfitrión: es él quien amplía la reserva.'
                    : 'El alojamiento no admite más personas.'}
                </p>
              </div>
            )}

            {/*
              El enlace de un acompañante vuelve **una sola vez**: en la base
              vive solo su sha256. Se dice aqui y no en una nota al pie, porque
              cerrar esto sin copiarlo obliga a generar otro.
            */}
            {declarandoPor && (
              <Modal
                abierto
                titulo="Declarar por esta persona"
                onCerrar={() => setDeclarandoPor(null)}
              >
                <DeclararIncapacidad
                  token={token}
                  persona={declarandoPor}
                  nombreTitular={nombreDelTitular}
                  onCancelar={() => setDeclarandoPor(null)}
                  onHecho={() => {
                    setDeclarandoPor(null)
                    void refrescar().catch(() => {})
                  }}
                />
              </Modal>
            )}

            {enlace && (
              <Modal
                abierto
                titulo={`El enlace de ${enlace.nombre}`}
                onCerrar={() => setEnlace(null)}
              >
                <p className="text-sm text-ink/70">
                  Mandáselo. Con él sube la foto de su documento, llena sus
                  datos y acepta sus términos — eso último no lo podés hacer
                  vos por él.
                </p>
                <div className="mt-4 rounded-xl bg-ink/[0.04] p-3">
                  <p className="break-all font-mono text-xs text-ink/80">
                    {enlace.url}
                  </p>
                </div>
                <p className="mt-3 text-xs font-semibold text-amber-700">
                  Copialo ahora: no se vuelve a mostrar. Si lo perdés hay que
                  generar otro, y el de ahora deja de valer.
                </p>
                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    className="flex-1 py-2.5"
                    onClick={() => void navigator.clipboard?.writeText(enlace.url)}
                  >
                    Copiar el enlace
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1 py-2.5"
                    onClick={() => setEnlace(null)}
                  >
                    Listo
                  </Button>
                </div>
              </Modal>
            )}

            <VehiculosDeLaEstancia token={token} adultos={adultos} />

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
