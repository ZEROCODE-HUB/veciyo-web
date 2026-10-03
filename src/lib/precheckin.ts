import { supabase } from './supabase'

/**
 * El cliente con el que hablar con la base.
 *
 * Por defecto el de la web, que es quien ejecuta este flujo de verdad: el
 * huésped lo recorre aquí, sin cuenta, con el enlace que le llegó.
 *
 * Se puede pasar otro, y eso es lo que hace la unificación posible. Hasta el
 * 02/10/2026 este archivo estaba **escrito dos veces** --aquí y en
 * `veci-yo/src/features/visitas/services/precheckin.repo.ts`-- y la copia de la
 * aplicación no la ejecutaba nadie en producción: solo la corrían las pruebas.
 * Dos implementaciones del mismo flujo, y la que se probaba no era la que se
 * usaba.
 *
 * Ahora hay una, y los recorridos de la aplicación llaman a **esta**, pasando
 * su propio cliente. Lo que se prueba es lo que el huésped ejecuta.
 */
/**
 * Lo único que este módulo necesita de un cliente: llamar a una función.
 *
 * Se declara así y no como `SupabaseClient` a propósito. Los recorridos viven
 * en el otro repositorio y traen **su propia copia** del SDK, con lo cual los
 * dos tipos son incompatibles para TypeScript aunque en ejecución sean lo
 * mismo. Pedir la forma que de verdad se usa quita ese problema de raíz, y
 * además dice la verdad: de todo el SDK, aquí solo se llama a `rpc`.
 */
export interface ClientePrecheckin {
  rpc: (
    nombre: string,
    argumentos?: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>
}

function conexion(cliente?: ClientePrecheckin | null): ClientePrecheckin {
  const elegido = cliente ?? (supabase as ClientePrecheckin | null)
  if (!elegido) throw new Error('Sin conexión con el servidor')
  return elegido
}

/**
 * El precheckin del huésped, contra la base de verdad.
 *
 * Todo lo de aquí se llama **sin sesión**: quien abre el enlace todavía no
 * tiene cuenta, y ese es justamente el punto. Las funciones son
 * `security definer` y lo único que las abre es el token, así que la
 * comprobación de si el enlace vale vive en la base y no en esta pantalla.
 *
 * Las pantallas ya estaban dibujadas y encadenadas; lo que no había era dónde
 * guardar. Los datos que pedían --teléfono, dirección, motivo-- se perdían al
 * pulsar «Confirmar y continuar».
 */

/**
 * El token vive en `sessionStorage`, no en `location.state`.
 *
 * El flujo son seis pantallas y quien lo recorre está en un móvil, en la
 * calle, posiblemente esperando en la puerta del edificio. Con el token en el
 * estado de navegación, recargar o volver atrás lo pierde y hay que empezar de
 * cero. `sessionStorage` dura lo que la pestaña, que es exactamente lo que
 * dura el precheckin.
 */
const CLAVE = 'veciyo_precheckin_token'

export function guardarToken(token: string): void {
  try {
    sessionStorage.setItem(CLAVE, token)
  } catch {
    // Navegación privada o almacenamiento bloqueado. No es motivo para
    // romper: el flujo sigue mientras no se recargue.
  }
}

export function tokenActual(): string | null {
  try {
    return sessionStorage.getItem(CLAVE)
  } catch {
    return null
  }
}

export function olvidarToken(): void {
  try {
    sessionStorage.removeItem(CLAVE)
  } catch {
    /* ver arriba */
  }
}

export interface EstanciaPrecheckin {
  visita_id: string
  condominio: string
  unidad: string
  anfitrion: string
  fecha_desde: string | null
  fecha_hasta: string | null
  max_huespedes: number | null
  vigente: boolean
  completado: boolean
}

/** Lo que se puede saber de la estancia **antes** de identificarse. */
export async function consultarPrecheckin(
  token: string,
  cliente?: ClientePrecheckin | null,
): Promise<EstanciaPrecheckin | null> {
  const { data, error } = await conexion(cliente).rpc('consultar_precheckin', {
    p_token: token,
  })
  if (error) throw error
  const fila = Array.isArray(data) ? data[0] : data
  return (fila as EstanciaPrecheckin) ?? null
}

/** Lo que el titular ya habia escrito, para no pedirselo dos veces. */
export interface FichaGuardada {
  invitadoId: string
  nombre: string
  apellidos: string
  tipoDocumento: TipoDocumento | null
  documento: string
  correo: string
  telefono: string
  direccion: string
  motivo: Motivo | null
  fechaNacimiento: string
  ciudadResidencia: string
  ciudadProcedencia: string
  nacionalidad: string
  terminosAceptados: boolean
  costo: number | null
  moneda: string
  /** Si ya subio la foto de su documento. La ruta no viaja, a proposito. */
  tieneDocumento: boolean
}

/**
 * Lo que el huesped ya habia rellenado.
 *
 * Existe porque hasta el 03/10/2026 **el formulario salia vacio al volver**:
 * todo estaba guardado y no habia forma de leerlo. `consultarPrecheckin`
 * devuelve la reserva --el edificio, la vivienda, las fechas-- y no toca la
 * tabla del invitado en ninguna linea.
 *
 * Para alguien que viaja, abandonar el preregistro a medias y volver mas tarde
 * es el caso normal. Tecleaba once campos y subia dos fotos otra vez.
 *
 * Devuelve `null` si todavia no hay nada escrito, que es lo que pasa la primera
 * vez: no es un error.
 */
export async function fichaDelPrecheckin(
  token: string,
  cliente?: ClientePrecheckin | null,
): Promise<FichaGuardada | null> {
  const { data, error } = await conexion(cliente).rpc('mi_ficha_precheckin', {
    p_token: token,
  })
  if (error) throw error

  const fila = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined
  if (!fila) return null

  const texto = (valor: unknown) => (typeof valor === 'string' ? valor : '')

  return {
    invitadoId: texto(fila.invitado_id),
    nombre: texto(fila.nombre),
    apellidos: texto(fila.apellidos),
    tipoDocumento: (fila.tipo_documento as TipoDocumento) ?? null,
    documento: texto(fila.documento),
    correo: texto(fila.correo),
    telefono: texto(fila.telefono),
    direccion: texto(fila.direccion),
    motivo: (fila.motivo as Motivo) ?? null,
    fechaNacimiento: texto(fila.fecha_nacimiento),
    ciudadResidencia: texto(fila.ciudad_residencia),
    ciudadProcedencia: texto(fila.ciudad_procedencia),
    nacionalidad: texto(fila.nacionalidad),
    terminosAceptados: fila.terminos_aceptados === true,
    costo: typeof fila.costo === 'number' ? fila.costo : null,
    moneda: texto(fila.moneda),
    tieneDocumento: fila.tiene_documento === true,
  }
}

/**
 * Los tipos de documento que la base acepta.
 *
 * La pantalla ofrecía `dni | pasaporte | extranjero | otro` con la etiqueta
 * «Cédula» sobre `dni`, y eso no es lo que guarda la base: en Colombia la
 * cédula es `cedula_ciudadania`, y `dni` es otra cosa. Se hace explícito aquí
 * para que el desajuste no viva escondido en un `value` de un `<option>`.
 */
export const TIPOS_DOCUMENTO = [
  { value: 'cedula_ciudadania', label: 'Cédula de ciudadanía' },
  { value: 'cedula_extranjeria', label: 'Cédula de extranjería' },
  { value: 'pasaporte', label: 'Pasaporte' },
  { value: 'dni', label: 'DNI' },
  { value: 'carne_extranjeria', label: 'Carné de extranjería' },
  { value: 'pep', label: 'Permiso especial de permanencia' },
] as const

export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number]['value']

/** Un pasaporte es una sola hoja; una cédula tiene dos caras. */
export function tieneDosCaras(tipo: TipoDocumento | null): boolean {
  return tipo !== null && tipo !== 'pasaporte'
}

export const MOTIVOS = [
  { value: 'turismo', label: 'Turismo' },
  { value: 'negocios', label: 'Negocios' },
  { value: 'trabajo', label: 'Trabajo' },
  { value: 'estudios', label: 'Estudios' },
  { value: 'transito', label: 'Tránsito' },
] as const

export type Motivo = (typeof MOTIVOS)[number]['value']

export interface FichaPrecheckin {
  nombre: string
  apellidos: string
  tipoDocumento: TipoDocumento
  documento: string
  correo: string
  telefono?: string
  direccion?: string
  motivo?: Motivo
  /**
   * Necesaria para el reporte a la autoridad y para saber si alguien es menor.
   *
   * Faltaba: la RPC la acepta desde el principio y esta pantalla no la pedia ni
   * la mandaba, asi que en la base habia **cero** invitados con fecha de
   * nacimiento y el anfitrion la veia siempre como «N/A». Lo encontro
   * `npm run precheckin` en el otro proyecto, comparando los argumentos de las
   * dos copias de este modulo (29/09/2026).
   */
  fechaNacimiento?: string
  /**
   * Lo que pide la Tarjeta de Registro de Alojamiento (Resolución 409 de 2022)
   * y que no se preguntaba en ningún sitio.
   *
   * Opcionales aquí a propósito: un preregistro a medias es peor que un dato en
   * blanco, así que se puede terminar sin ellos. Lo que falte lo dice el
   * reporte cuando el anfitrión vaya a mandarlo, de una vez y no de uno en uno.
   */
  ciudadResidencia?: string
  ciudadProcedencia?: string
  /** ISO 3166-1 alfa-2. No la pide la TRA; la pide el SIRE. */
  nacionalidad?: string
  /** Lo que costó la estancia. Es de la reserva, no de la persona. */
  costo?: number
  /** ISO 4217. Si no viene, la base asume la del condominio. */
  moneda?: string
}

/**
 * Guarda la ficha del titular.
 *
 * Rellena la fila que el anfitrión dejó al reservar en vez de crear otra, así
 * que volver atrás y corregir un dato no duplica a la persona.
 */
export async function guardarFicha(
  token: string,
  ficha: FichaPrecheckin,
  cliente?: ClientePrecheckin | null,
): Promise<string> {
  const { data, error } = await conexion(cliente).rpc('guardar_precheckin', {
    p_token: token,
    p_nombre: ficha.nombre,
    p_apellidos: ficha.apellidos,
    p_tipo_documento: ficha.tipoDocumento,
    p_documento: ficha.documento,
    p_correo: ficha.correo,
    p_telefono: ficha.telefono,
    p_direccion: ficha.direccion,
    p_motivo: ficha.motivo,
    p_fecha_nacimiento: ficha.fechaNacimiento,
    p_ciudad_residencia: ficha.ciudadResidencia,
    p_ciudad_procedencia: ficha.ciudadProcedencia,
    p_nacionalidad: ficha.nacionalidad,
    p_costo: ficha.costo,
    p_moneda: ficha.moneda,
  })
  if (error) throw error
  return data as string
}

/** Los acepta el propio huésped; que los apruebe el anfitrión es otra cosa. */
export async function aceptarTerminos(
  token: string,
  cliente?: ClientePrecheckin | null,
): Promise<void> {
  const { error } = await conexion(cliente).rpc('aceptar_terminos_precheckin', {
    p_token: token,
  })
  if (error) throw error
}

export interface Acompanante {
  id: string
  nombre: string
  apellidos: string | null
  tipo_documento: TipoDocumento | null
  documento_numero: string | null
  correo: string | null
  telefono: string | null
  es_menor: boolean
}

/** Quién se aloja con el titular. No lo incluye a él. */
export async function listarAcompanantes(
  token: string,
): Promise<Acompanante[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('acompanantes_del_precheckin', {
    p_token: token,
  })
  if (error) throw error
  return (data as Acompanante[]) ?? []
}

export interface NuevoAcompanante {
  id?: string
  nombre: string
  apellidos?: string
  tipoDocumento?: TipoDocumento
  documento?: string
  telefono?: string
  esMenor?: boolean
}

/**
 * Añade o corrige a un acompañante.
 *
 * Un adulto sin documento lo rechaza la base: es justo lo que separa esta vía
 * de la que había antes --las membresías de la vivienda no guardaban
 * documento-- y lo que la autoridad pide. Un menor no lo necesita.
 */
export async function guardarAcompanante(
  token: string,
  persona: NuevoAcompanante,
): Promise<string> {
  if (!supabase) throw new Error('Sin conexión con el servidor')
  const { data, error } = await supabase.rpc('guardar_acompanante', {
    p_token: token,
    p_acompanante_id: persona.id,
    p_nombre: persona.nombre,
    p_apellidos: persona.apellidos,
    p_tipo_documento: persona.tipoDocumento,
    p_documento: persona.documento,
    p_telefono: persona.telefono,
    p_es_menor: persona.esMenor ?? false,
  })
  if (error) throw error
  return data as string
}

export async function quitarAcompanante(
  token: string,
  id: string,
): Promise<void> {
  if (!supabase) throw new Error('Sin conexión con el servidor')
  const { error } = await supabase.rpc('quitar_acompanante', {
    p_token: token,
    p_acompanante_id: id,
  })
  if (error) throw error
}

/**
 * Cierra el preregistro y devuelve **el acceso del huésped a la aplicación**.
 *
 * Aquí es donde la estancia y la cuenta dejan de ser dos cosas distintas. El
 * enlace vuelve una sola vez: en la base solo vive su sha256.
 */
export async function cerrarPrecheckin(
  token: string,
  cliente?: ClientePrecheckin | null,
  base?: string,
): Promise<string> {
  const { data, error } = await conexion(cliente).rpc('cerrar_precheckin', {
    p_token: token,
  })
  if (error) throw error

  /*
    De dónde sale el dominio del enlace.

    Las dos copias de este módulo lo armaban distinto: la web con
    `window.location.origin` y la de la aplicación con la URL configurada. Nadie
    lo vio porque la de la aplicación no la ejecutaba nadie, pero eran dos
    enlaces distintos para la misma cosa.

    Ahora hay uno: el que se pase, o el del navegador cuando lo haya. Fuera del
    navegador --los recorridos corren en Node-- hay que pasarlo, y eso obliga a
    decir cuál es en vez de suponerlo.
  */
  const origen =
    base ??
    (typeof window !== 'undefined' ? window.location.origin : undefined)
  if (!origen) {
    throw new Error('Hace falta saber el dominio para armar el acceso')
  }

  return `${origen}/invitacion?token=${data as string}`
}

export interface DocumentoLegal {
  id: string
  titulo: string
  contenido: string
}

/**
 * Los términos que de verdad se están aceptando.
 *
 * Aquí había cuatro párrafos escritos a mano en este repositorio, uno de ellos
 * titulado «Términos y Condiciones del Condominio». En la base hay un
 * documento con ese mismo nombre, del condominio y marcado vigente, que no leía
 * nadie: alguien aceptaba unos términos que no son los del edificio donde va a
 * dormir, y ese «acepto» se guarda con valor legal.
 */
export async function legalesDeLaEstancia(
  token: string,
): Promise<DocumentoLegal[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('legales_de_la_estancia', {
    p_token: token,
  })
  if (error) throw error
  return (data as DocumentoLegal[]) ?? []
}

/**
 * La foto del documento, que hasta el 02/10/2026 no iba a ninguna parte.
 *
 * La pantalla la pedía --y avisaba de que era opcional-- y el archivo se
 * quedaba en la memoria de la pestaña: el bucket es privado, sus políticas
 * derivan de quién puede ver la visita, y quien hace el preregistro **no tiene
 * sesión**. No había a quién darle el permiso.
 *
 * Lo resuelve una función de servidor que comprueba el enlace antes de dejar
 * escribir nada --`subir-documento-precheckin`--, porque un enlace no es una
 * sesión y eso solo se puede comprobar con permisos de servidor.
 *
 * Se llama sin cabecera de autorización a propósito: quien llega aquí no tiene
 * ninguna. La credencial es el token, y la función lo comprueba contra el hash
 * guardado en la base.
 */
export async function subirDocumentoPrecheckin(
  token: string,
  archivo: File,
  cara: 'frente' | 'reverso',
): Promise<void> {
  const url = import.meta.env.VITE_SUPABASE_URL
  if (!url) throw new Error('Sin conexión con el servidor')

  // `FileReader` da `data:image/png;base64,AAA...`; la función quiere solo lo
  // de después de la coma.
  const base64 = await new Promise<string>((listo, falla) => {
    const lector = new FileReader()
    lector.onload = () => listo(String(lector.result).split(',')[1] ?? '')
    lector.onerror = () => falla(new Error('No se pudo leer la imagen'))
    lector.readAsDataURL(archivo)
  })

  const respuesta = await fetch(
    `${url}/functions/v1/subir-documento-precheckin`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        imagenBase64: base64,
        contentType: archivo.type || 'image/jpeg',
        cara,
      }),
    },
  )

  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => ({}))
    throw new Error(
      (cuerpo as { error?: string }).error ?? 'No se pudo guardar el documento',
    )
  }
}
