import { supabase } from './supabase'

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
): Promise<EstanciaPrecheckin | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('consultar_precheckin', {
    p_token: token,
  })
  if (error) throw error
  const fila = Array.isArray(data) ? data[0] : data
  return (fila as EstanciaPrecheckin) ?? null
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
): Promise<string> {
  if (!supabase) throw new Error('Sin conexión con el servidor')
  const { data, error } = await supabase.rpc('guardar_precheckin', {
    p_token: token,
    p_nombre: ficha.nombre,
    p_apellidos: ficha.apellidos,
    p_tipo_documento: ficha.tipoDocumento,
    p_documento: ficha.documento,
    p_correo: ficha.correo,
    p_telefono: ficha.telefono,
    p_direccion: ficha.direccion,
    p_motivo: ficha.motivo,
  })
  if (error) throw error
  return data as string
}

/** Los acepta el propio huésped; que los apruebe el anfitrión es otra cosa. */
export async function aceptarTerminos(token: string): Promise<void> {
  if (!supabase) throw new Error('Sin conexión con el servidor')
  const { error } = await supabase.rpc('aceptar_terminos_precheckin', {
    p_token: token,
  })
  if (error) throw error
}
