import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Card from '../components/Card'
import Input from '../components/Input'
import Select from '../components/Select'
import Button from '../components/Button'
import Checkbox from '../components/Checkbox'
import Accordion from '../components/Accordion'
import CampoTelefono from '../components/CampoTelefono'
import MenoresQueTraigo from '../components/MenoresQueTraigo'
import ReglasDelEdificio from '../components/ReglasDelEdificio'
import FileUploader from '../components/FileUploader'
import ComoEntrar from '../components/ComoEntrar'
import { PAIS_POR_DEFECTO } from '../lib/paises'
import { porQueFallo } from '../lib/motivo'
import {
  soloNombre,
  errorDeDocumento,
  errorDeFechaExpedicion,
  errorDeNacimientoImposible,
  limitesDeLaFicha,
  loQueFaltaEnLaFicha,
  pideFechaExpedicion,
} from '../lib/ficha'
import { useParametros } from '../lib/useParametros'
import { useDocumentos } from '../lib/useDocumentos'
import { NACIONALIDADES } from '../lib/nacionalidades'
import { esMayorDeEdadAlLlegar, hoyEnIso } from '../lib/edad'
import {
  MOTIVOS,
  entradaElegida,
  fotosDeMiDocumento,
  guardarDireccionYMotivoAcompanante,
  misDatosParaPrecheckin,
  tieneDosCaras,
  type ModoDeEntrada,
  type Motivo,
  aceptarMisTerminosAcompanante,
  aceptarReglamento,
  consultarMiPrecheckin,
  estadoDelPrecheckin,
  fechasDeExpedicion,
  guardarFechaExpedicion,
  guardarMiFichaAcompanante,
  legalesDeLaEstancia,
  type DocumentoLegal,
  type TipoDocumento,
  subirDocumentoPrecheckin,
} from '../lib/precheckin'

/**
 * El acompañante llena **sus** datos y acepta **sus** términos.
 *
 * Esta pantalla era una maqueta completa: ignoraba el identificador de la URL,
 * esperaba un segundo con un `setTimeout` y navegaba a otra pantalla con datos
 * inventados a mano —«Acompañante», «N/A», `companionId: 0`—. Cero llamadas a
 * la base. Quien llegaba por su enlace no podía hacer absolutamente nada.
 *
 * Y la ruta era `/access/acompanante/:id`, con el uuid del invitado. **Un uuid
 * no es una credencial**: quien lo viera o lo adivinara podría editar la ficha
 * de otra persona. Ahora es `/access/acompanante/:token`, con el mismo esquema
 * que el enlace del titular —en la base vive solo su sha256—.
 *
 * Lo que de verdad justifica que esta pantalla exista: **aceptar unas
 * condiciones en nombre de otro adulto no vale**. El titular puede teclearle
 * los datos a quien viene con él —lo pidió el cliente— pero los términos los
 * acepta cada uno, y sin esta pantalla no había dónde.
 */
type Estado = 'cargando' | 'invalido' | 'cerrado' | 'listo' | 'hecho'

interface Ficha {
  nombre: string
  apellidos: string
  tipoDocumento: TipoDocumento | ''
  documento: string
  correo: string
  telefono: string
  codigoPais: string
  fechaNacimiento: string
  nacionalidad: string
  ciudadResidencia: string
  ciudadProcedencia: string
  fechaExpedicion: string
  direccion: string
  motivo: Motivo | ''
}

const VACIA: Ficha = {
  nombre: '',
  apellidos: '',
  tipoDocumento: '',
  documento: '',
  correo: '',
  telefono: '',
  codigoPais: PAIS_POR_DEFECTO,
  fechaNacimiento: '',
  nacionalidad: '',
  ciudadResidencia: '',
  ciudadProcedencia: '',
  fechaExpedicion: '',
  direccion: '',
  motivo: '',
}

export default function CompanionAccess() {
  const { token } = useParams<{ token: string }>()
  const [estado, setEstado] = useState<Estado>('cargando')
  const [ficha, setFicha] = useState<Ficha>(VACIA)
  const [esMenor, setEsMenor] = useState(false)
  const [estancia, setEstancia] = useState({
    condominio: '',
    unidad: '',
    titular: '',
    // El día de llegada: es contra él contra el que se mide si alguien es
    // menor, igual que hace la base.
    desde: null as string | null,
  })
  const [legales, setLegales] = useState<DocumentoLegal[]>([])
  const [aceptados, setAceptados] = useState(false)
  // Las reglas del edificio: igual que los términos, cada adulto las suyas.
  const [hayReglas, setHayReglas] = useState<boolean | null>(null)
  const [reglasAceptadas, setReglasAceptadas] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /*
    La foto del documento, que al titular se le reclamaba --«Le falta la foto
    de su documento»-- y este enlace no tenía dónde subir (12/10/2026). Sigue
    siendo opcional, como la del titular: la portería compara el número.
  */
  const [miId, setMiId] = useState<string | null>(null)
  /*
    Desde el 16/10/2026 las fotos son obligatorias, las dos caras, igual que
    el paso 1 del titular (responsable de producto). Se suben al confirmar.
  */
  const [fotos, setFotos] = useState({ frente: false, reverso: false })
  const [frente, setFrente] = useState<File | null>(null)
  const [reverso, setReverso] = useState<File | null>(null)
  // Las tres formas de entrar, también para quien llega invitado por otro.
  const [entrada, setEntrada] = useState<ModoDeEntrada | null>(entradaElegida())

  useEffect(() => {
    if (!token) {
      setEstado('invalido')
      return
    }
    let vigente = true

    consultarMiPrecheckin(token)
      .then((fila) => {
        if (!vigente) return
        if (!fila) {
          setEstado('invalido')
          return
        }
        if (fila.cerrado === true) {
          setEstado('cerrado')
          return
        }
        const texto = (v: unknown) => (typeof v === 'string' ? v : '')
        // Lo que ya hubiera, venga de quien venga: el titular pudo teclearlo.
        setFicha((previa) => ({
          // La fecha de expedicion, la direccion y el motivo llegan por otra
          // consulta y pueden ganar la carrera.
          fechaExpedicion: previa.fechaExpedicion,
          direccion: previa.direccion,
          motivo: previa.motivo,
          nombre: texto(fila.nombre),
          apellidos: texto(fila.apellidos),
          tipoDocumento: (fila.tipo_documento as TipoDocumento) ?? '',
          documento: texto(fila.documento),
          correo: texto(fila.correo),
          telefono: texto(fila.telefono),
          codigoPais: texto(fila.codigo_pais) || PAIS_POR_DEFECTO,
          fechaNacimiento: texto(fila.fecha_nacimiento),
          nacionalidad: texto(fila.nacionalidad),
          ciudadResidencia: texto(fila.ciudad_residencia),
          ciudadProcedencia: texto(fila.ciudad_procedencia),
        }))
        setEsMenor(fila.es_menor === true)
        setMiId(typeof fila.invitado_id === 'string' ? fila.invitado_id : null)
        setAceptados(fila.terminos_aceptados === true)
        setEstancia({
          condominio: texto(fila.condominio),
          unidad: texto(fila.unidad),
          titular: texto(fila.titular),
          desde: texto(fila.fecha_desde) || null,
        })
        setEstado('listo')
      })
      .catch(() => vigente && setEstado('invalido'))

    // Con el enlace de un acompañante solo vuelve la suya.
    fechasDeExpedicion(token)
      .then((fechas) => {
        const suya = Object.values(fechas)[0]
        if (vigente && suya) {
          setFicha((previa) => ({ ...previa, fechaExpedicion: suya }))
        }
      })
      .catch(() => {})

    fotosDeMiDocumento(token)
      .then((f) => {
        if (!vigente || !f) return
        setFotos({ frente: f.frente, reverso: f.reverso })
        setFicha((previa) => ({
          ...previa,
          direccion: previa.direccion || f.direccion,
          motivo: previa.motivo || f.motivo,
        }))
      })
      .catch(() => {})

    legalesDeLaEstancia(token)
      .then((docs) => vigente && setLegales(docs))
      .catch(() => vigente && setLegales([]))

    estadoDelPrecheckin(token)
      .then((e) => vigente && setReglasAceptadas(e.reglamentoAceptado))
      .catch(() => {})

    return () => {
      vigente = false
    }
  }, [token])

  const campo = (clave: keyof Ficha) => (valor: string) =>
    setFicha((previa) => ({ ...previa, [clave]: valor }))

  /*
    Los límites del teléfono y del año de nacimiento viven en la base. Sin
    ellos el formulario no se enseña (ver más abajo), así que mientras faltan
    no hay nada que validar.
  */
  const { parametros, error: errorParametros } = useParametros()
  const limites = parametros ? limitesDeLaFicha(parametros) : null
  // Los documentos del país del edificio y sus reglas (25/10/2026).
  const { documentos, error: errorDocumentos } = useDocumentos(token)
  const regla = documentos?.regla(ficha.tipoDocumento) ?? null

  /*
    A un menor no se le pide documento propio ni se le hace aceptar nada: por él
    responde quien le acompaña. Es la misma regla que aplica la base al cerrar.
  */
  /*
    Lo que falta, con nombre, igual que al titular. Y un adulto es un adulto:
    este enlace se podía completar con una fecha de 2012 y el acompañante
    quedaba registrado como mayor. A un menor lo apunta quien responde por él.
  */
  const faltan = esMenor
    ? ficha.nombre.trim() === ''
      ? ['el nombre']
      : []
    : limites && documentos
      ? loQueFaltaEnLaFicha({ ...ficha, costo: '' }, { esTitular: false, limites, documentos })
      : []
  const errorDeFecha = esMenor || !limites
    ? ''
    : errorDeNacimientoImposible(ficha.fechaNacimiento, limites) ||
      (ficha.fechaNacimiento &&
      !esMayorDeEdadAlLlegar(ficha.fechaNacimiento, estancia.desde)
        ? 'Este enlace es para un adulto. A un menor lo añade quien responde por él, desde su propio registro.'
        : '')
  if (errorDeFecha !== '' && !faltan.includes('la fecha de nacimiento')) {
    faltan.push('la fecha de nacimiento')
  }
  if (!esMenor) {
    if (ficha.direccion.trim() === '') faltan.push('la dirección de residencia')
    if (!ficha.motivo) faltan.push('el motivo de alojamiento')
    if (!frente && !fotos.frente) faltan.push('la foto del frente de tu documento')
    if (tieneDosCaras(regla) && !reverso && !fotos.reverso) {
      faltan.push('la foto del reverso de tu documento')
    }
  }
  if (!esMenor && !aceptados) faltan.push('aceptar los términos y condiciones')
  if (!esMenor && hayReglas && !reglasAceptadas) {
    faltan.push('aceptar las reglas del edificio')
  }

  const completo =
    limites !== null && faltan.length === 0 && (esMenor || hayReglas !== null)

  /*
    Eligió «Iniciar sesión»: lo que tenga guardado en su cuenta, sin pisar lo
    que el titular ya le hubiera escrito.
  */
  useEffect(() => {
    if (entrada !== 'sesion' || estado !== 'listo') return
    let vigente = true
    misDatosParaPrecheckin()
      .then((d) => {
        if (!vigente || !d) return
        setFicha((previa) => ({
          ...previa,
          nombre: previa.nombre || d.nombre,
          apellidos: previa.apellidos || d.apellidos,
          tipoDocumento: previa.tipoDocumento || d.tipoDocumento || '',
          documento: previa.documento || d.documento,
          correo: previa.correo || d.correo,
          telefono: previa.telefono || d.telefono,
          codigoPais: previa.telefono ? previa.codigoPais : d.codigoPais || previa.codigoPais,
          fechaNacimiento: previa.fechaNacimiento || d.fechaNacimiento,
          ciudadResidencia: previa.ciudadResidencia || d.ciudadResidencia,
          ciudadProcedencia: previa.ciudadProcedencia || d.ciudadProcedencia,
          direccion: previa.direccion || d.direccion,
        }))
      })
      .catch(() => {})
    return () => {
      vigente = false
    }
  }, [entrada, estado])

  const enviar = async () => {
    if (!token || !completo || guardando) return
    setGuardando(true)
    setError(null)
    try {
      // Con el uuid propio: sin él la función entiende «el titular», y las
      // fotos de este acompañante acabarían en la ficha de quien reservó.
      if (!esMenor && miId) {
        if (frente) await subirDocumentoPrecheckin(token, frente, 'frente', miId)
        if (reverso) await subirDocumentoPrecheckin(token, reverso, 'reverso', miId)
      }
      await guardarMiFichaAcompanante(token, {
        nombre: ficha.nombre.trim(),
        apellidos: ficha.apellidos.trim() || undefined,
        tipoDocumento: ficha.tipoDocumento || null,
        documento: ficha.documento.trim() || undefined,
        correo: ficha.correo.trim() || undefined,
        telefono: ficha.telefono.trim() || undefined,
        codigoPais: ficha.telefono.trim() ? ficha.codigoPais : undefined,
        fechaNacimiento: ficha.fechaNacimiento || undefined,
        nacionalidad: ficha.nacionalidad || undefined,
        ciudadResidencia: ficha.ciudadResidencia.trim() || undefined,
        ciudadProcedencia: ficha.ciudadProcedencia.trim() || undefined,
      })
      if (!esMenor) {
        await guardarDireccionYMotivoAcompanante(token, ficha.direccion, ficha.motivo)
      }
      if (!esMenor && pideFechaExpedicion(regla)) {
        await guardarFechaExpedicion(token, ficha.fechaExpedicion)
      }
      /*
        Dos llamadas y no una: aceptar los términos es un hecho con fecha y con
        consecuencias legales, no un campo más de la ficha. La base le pone el
        sello temporal y la versión del reglamento que se aceptó.
      */
      if (!esMenor) await aceptarMisTerminosAcompanante(token)
      if (!esMenor && hayReglas) await aceptarReglamento(token)
      setEstado('hecho')
    } catch (e) {
      setError(porQueFallo(e, 'No pudimos guardar tus datos'))
      setGuardando(false)
    }
  }

  if (estado === 'cargando' || (estado === 'listo' && (!parametros || !documentos))) {
    return (
      <MainLayout header="default" bg="soft">
        <div className="mx-auto max-w-[640px] px-4 py-16">
          <p className="text-center text-sm text-ink/60">
            {estado === 'listo' && (errorParametros || errorDocumentos)
              ? (errorParametros ?? errorDocumentos)
              : 'Buscando tu registro...'}
          </p>
        </div>
      </MainLayout>
    )
  }

  if (estado === 'invalido' || estado === 'cerrado') {
    return (
      <MainLayout header="default" bg="soft">
        <div className="mx-auto max-w-[560px] px-4 py-16">
          <Card className="px-6 py-10 text-center">
            <h1 className="text-2xl font-bold text-ink">
              {estado === 'cerrado'
                ? 'Este registro ya se cerró'
                : 'Este enlace no vale'}
            </h1>
            <p className="mt-4 text-sm text-ink/70">
              {estado === 'cerrado'
                ? 'Quien hizo la reserva ya lo terminó. Si falta algo tuyo, díselo a esa persona.'
                : 'Puede que haya vencido o que esté mal copiado. Pídele a quien reservó que te lo mande otra vez.'}
            </p>
          </Card>
        </div>
      </MainLayout>
    )
  }

  if (estado === 'hecho') {
    return (
      <MainLayout header="default" bg="soft">
        <div className="mx-auto max-w-[560px] px-4 py-16">
          <Card className="px-6 py-10 text-center">
            <h1 className="text-2xl font-bold text-ink">Listo, {ficha.nombre}</h1>
            {/* Textos de la responsable de producto (16/10/2026). */}
            <p className="mt-4 text-sm text-ink/70">
              Tus datos quedaron registrados para la estadía en{' '}
              {estancia.condominio}. El equipo de seguridad te espera para
              completar tu registro presencial con tus documentos físicos.
            </p>
            <p className="mt-3 text-sm text-ink/70">
              Cuando el proceso de registro de todo tu grupo esté completo,
              recibirás confirmación de aprobación de ingreso a tu correo
              electrónico con un QR para agilizar tu registro físico a tu
              llegada.
            </p>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout header="default" bg="soft">
      <div className="mx-auto max-w-[640px] px-4 py-10 sm:px-6">
        <h1 className="text-center font-display text-3xl font-bold text-ink">
          Tus datos para la estadía
        </h1>
        <p className="mx-auto mt-3 max-w-md text-center text-base text-ink/60">
          {estancia.titular
            ? `${estancia.titular} te incluyó en su reserva`
            : 'Te incluyeron en una reserva'}{' '}
          en {estancia.condominio}, vivienda {estancia.unidad}. El personal
          de seguridad necesita tus datos para dejarte entrar.
        </p>

        {!esMenor && entrada === null && (
          <Card className="mt-8 px-5 py-6 sm:px-8">
            <ComoEntrar onListo={() => setEntrada(entradaElegida() ?? 'invitado')} />
          </Card>
        )}

        {(esMenor || entrada !== null) && (
        <Card className="mt-8 px-5 py-6 sm:px-8">
          <div className="space-y-3">
            <Input
              label="Nombres"
              tone="soft"
              value={ficha.nombre}
              onChange={(e) => campo('nombre')(soloNombre(e.target.value))}
            />
            <Input
              label="Apellidos"
              tone="soft"
              value={ficha.apellidos}
              onChange={(e) => campo('apellidos')(soloNombre(e.target.value))}
            />

            {/*
              A un menor no se le pide documento propio. Enseñar los campos y no
              exigirlos sería la casilla decorativa de siempre; se esconden.
            */}
            {!esMenor && (
              <>
                <Select
                  label="Tipo de documento"
                  tone="soft"
                  placeholder="Seleccione"
                  options={documentos?.ofrecidos() ?? []}
                  value={ficha.tipoDocumento}
                  onChange={(e) =>
                    campo('tipoDocumento')(e.target.value)
                  }
                />
                <Input
                  label="Número de documento"
                  tone="soft"
                  placeholder="Tal como aparece en el documento"
                  value={ficha.documento}
                  error={errorDeDocumento(regla, ficha.documento)}
                  onChange={(e) => campo('documento')(e.target.value)}
                />
                {pideFechaExpedicion(regla) ? (
                  <Input
                    label="Fecha de expedición del documento"
                    type="date"
                    tone="soft"
                    max={hoyEnIso()}
                    value={ficha.fechaExpedicion}
                    error={errorDeFechaExpedicion(
                      ficha.fechaExpedicion,
                      ficha.fechaNacimiento,
                      hoyEnIso(),
                    )}
                    onChange={(e) => campo('fechaExpedicion')(e.target.value)}
                  />
                ) : null}
              </>
            )}

            {!esMenor && miId && ficha.tipoDocumento && (
              <div className="space-y-3">
                {/* Las mismas cajas que el paso 1 del titular. */}
                <FileUploader
                  tone="soft"
                  title={
                    tieneDosCaras(regla)
                      ? 'Foto del frente del documento'
                      : 'Foto del documento'
                  }
                  hint={fotos.frente ? 'Ya está guardada. Puedes cambiarla.' : undefined}
                  onFileSelected={setFrente}
                />
                {tieneDosCaras(regla) && (
                  <FileUploader
                    tone="soft"
                    title="Foto del reverso del documento"
                    hint={fotos.reverso ? 'Ya está guardada. Puedes cambiarla.' : undefined}
                    onFileSelected={setReverso}
                  />
                )}
              </div>
            )}

            {!esMenor && (
              <>
                <Input
                  label="Dirección de residencia"
                  tone="soft"
                  value={ficha.direccion}
                  onChange={(e) => campo('direccion')(e.target.value)}
                />
                <Select
                  label="Motivo de alojamiento"
                  tone="soft"
                  placeholder="Seleccione un motivo"
                  options={MOTIVOS as unknown as { value: string; label: string }[]}
                  value={ficha.motivo}
                  onChange={(e) => campo('motivo')(e.target.value)}
                />
              </>
            )}

            <Input
              label="Correo electrónico"
              type="email"
              tone="soft"
              placeholder="correo@ejemplo.com"
              value={ficha.correo}
              onChange={(e) => campo('correo')(e.target.value)}
            />
            <CampoTelefono
              label="Número de teléfono"
              tone="soft"
              codigoPais={ficha.codigoPais}
              onCodigoPaisChange={campo('codigoPais')}
              telefono={ficha.telefono}
              onTelefonoChange={campo('telefono')}
            />
            {/* Nadie nace mañana: el calendario no ofrece el futuro. */}
            <Input
              label="Fecha de nacimiento"
              type="date"
              tone="soft"
              max={hoyEnIso()}
              value={ficha.fechaNacimiento}
              error={errorDeFecha}
              onChange={(e) => campo('fechaNacimiento')(e.target.value)}
            />
            {!esMenor && (
              <Select
                label="Nacionalidad"
                tone="soft"
                placeholder="Seleccione"
                options={NACIONALIDADES}
                value={ficha.nacionalidad}
                onChange={(e) => campo('nacionalidad')(e.target.value)}
              />
            )}
            <Input
              label="Ciudad donde vives"
              tone="soft"
              placeholder="Medellín"
              value={ficha.ciudadResidencia}
              onChange={(e) => campo('ciudadResidencia')(e.target.value)}
            />
            <Input
              label="Ciudad desde la que viajas"
              tone="soft"
              placeholder="Lima"
              value={ficha.ciudadProcedencia}
              onChange={(e) => campo('ciudadProcedencia')(e.target.value)}
            />
          </div>

          {!esMenor && (
            <div className="mt-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/50">
                Lo que aceptas
              </p>
              <Accordion
                sections={legales.map((doc) => ({
                  id: doc.id,
                  title: doc.titulo,
                  content: (
                    <p className="whitespace-pre-line">{doc.contenido}</p>
                  ),
                }))}
              />
              <div className="mt-4">
                <Checkbox
                  label="Acepto los términos y condiciones"
                  checked={aceptados}
                  onChange={(e) => setAceptados(e.target.checked)}
                />
              </div>
              {/*
                Se dice en voz alta porque es el motivo de que esta pantalla
                exista: nadie más puede marcar esta casilla por ti.
              */}
              <p className="mt-2 text-xs text-ink/50">
                Esta aceptación es tuya. Quien hizo la reserva no puede hacerla
                por ti.
              </p>
            </div>
          )}

          {!esMenor && token && (
            <ReglasDelEdificio
              token={token}
              aceptadas={reglasAceptadas}
              onCambiar={setReglasAceptadas}
              onSaberSiHay={setHayReglas}
            />
          )}

          {/*
            Los menores que trae esta persona. Va **después** de sus propios
            datos y antes del botón: primero lo suyo, que es lo que esta
            pantalla existe para hacer, y luego lo opcional.

            Solo si es adulto: un menor no trae menores, y tampoco llega aquí
            por su cuenta.
          */}
          {!esMenor && token && (
            <MenoresQueTraigo token={token} llegada={estancia.desde} />
          )}

          {error && <p className="mt-4 text-sm text-danger">{error}</p>}

          {faltan.length > 0 && (
            <p
              role="status"
              className="mt-4 rounded-xl bg-gold/10 px-4 py-3 text-center text-sm text-ink"
            >
              Para continuar falta: {faltan.join(', ')}.
            </p>
          )}

          <Button
            type="button"
            className="mt-6 w-full py-3.5"
            onClick={() => void enviar()}
            disabled={!completo || guardando}
          >
            {guardando ? 'Guardando...' : 'Confirmar mis datos'}
          </Button>
        </Card>
        )}
      </div>
    </MainLayout>
  )
}
