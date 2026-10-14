import type { TipoDocumento } from './precheckin'

/**
 * Lo que le falta a una ficha para poderse confirmar, dicho con palabras.
 *
 * Sale del recorrido del 12/10/2026. El botón «Confirmar» se quedaba gris sin
 * decir por qué --un correo mal escrito no enseñaba nada-- y, al revés, dejaba
 * pasar una cédula «ABC-12», un teléfono de dos cifras y a alguien nacido en
 * 1890. Y lo más caro: la ciudad, el costo y la nacionalidad eran opcionales
 * (la nacionalidad ni se preguntaba), el reporte al ministerio los exige, y el
 * anfitrión no tiene dónde escribirlos. Se enteraba al pulsar «Reportar», con
 * el registro del huésped ya cerrado.
 *
 * Aquí se dice a tiempo. El límite sigue siendo la base.
 */

/** Documentos que en Colombia y Perú son solo cifras. */
const SOLO_CIFRAS: ReadonlySet<string> = new Set([
  'cedula_ciudadania',
  'cedula_extranjeria',
  'tarjeta_identidad',
  'dni',
])

/** El número tal como se compara: sin espacios, puntos ni guiones. */
export function limpiarDocumento(numero: string): string {
  return numero.replace(/[\s.-]/g, '').toUpperCase()
}

/** Por qué ese número no sirve para ese documento, o cadena vacía. */
export function errorDeDocumento(
  tipo: TipoDocumento | string | null | undefined,
  numero: string,
): string {
  const limpio = limpiarDocumento(numero)
  if (limpio === '') return ''
  if (tipo && SOLO_CIFRAS.has(tipo)) {
    if (!/^[0-9]+$/.test(limpio)) return 'Ese documento lleva solo números.'
    if (limpio.length < 5 || limpio.length > 12) {
      return 'Revisa el número: tiene que tener entre 5 y 12 cifras.'
    }
    return ''
  }
  if (!/^[A-Z0-9]+$/.test(limpio)) return 'Solo letras y números, sin símbolos.'
  if (limpio.length < 4 || limpio.length > 20) {
    return 'Revisa el número: tiene que tener entre 4 y 20 caracteres.'
  }
  return ''
}

export function errorDeCorreo(correo: string): string {
  const limpio = correo.trim()
  if (limpio === '') return ''
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(limpio)
    ? ''
    : 'Ese correo no parece válido.'
}

/** El teléfono es opcional; si se escribe, tiene que poderse marcar. */
export function errorDeTelefono(telefono: string): string {
  if (telefono.trim() === '') return ''
  const cifras = telefono.replace(/[^0-9]/g, '')
  return cifras.length >= 7 && cifras.length <= 15
    ? ''
    : 'Revisa el teléfono: tiene que tener entre 7 y 15 cifras.'
}

/** Nadie vivo nació antes de 1900: es un año mal tecleado. */
export function errorDeNacimientoImposible(fecha: string): string {
  if (!fecha) return ''
  return Number(fecha.slice(0, 4)) < 1900 ? 'Revisa el año de nacimiento.' : ''
}

const sinAdornos = (costo: string) => costo.replace(/[\s$]/g, '')

export function errorDeCosto(costo: string): string {
  if (costo.trim() === '') return ''
  return /^[0-9]+([.,][0-9]{1,2})?$/.test(sinAdornos(costo))
    ? ''
    : 'Escribe solo el número, sin letras.'
}

/** El costo como número, o `undefined` si no hay o no se entiende. */
export function costoComoNumero(costo: string): number | undefined {
  if (costo.trim() === '' || errorDeCosto(costo) !== '') return undefined
  return Number(sinAdornos(costo).replace(',', '.'))
}

/**
 * Si ese documento necesita la fecha de expedición.
 *
 * Tus Datos no consulta una cédula de extranjería ni un PPT sin ella (lo dice
 * su documentación). Hasta el 14/10/2026 no se pedía, así que a esos huéspedes
 * no se los podía consultar nunca.
 */
export function pideFechaExpedicion(
  tipo: TipoDocumento | string | null | undefined,
): boolean {
  return tipo === 'cedula_extranjeria' || tipo === 'ppt'
}

/** Por qué esa fecha de expedición no sirve, o cadena vacía. */
export function errorDeFechaExpedicion(
  fecha: string,
  fechaNacimiento: string,
  hoy: string,
): string {
  if (!fecha) return ''
  if (fecha > hoy) return 'La fecha de expedición no puede ser futura.'
  if (fechaNacimiento && fecha < fechaNacimiento) {
    return 'Esa fecha es anterior a tu nacimiento. Revísala.'
  }
  return ''
}

export interface DatosDeLaFicha {
  nombre: string
  apellidos: string
  tipoDocumento: string
  documento: string
  correo: string
  telefono: string
  fechaNacimiento: string
  nacionalidad: string
  ciudadResidencia: string
  ciudadProcedencia: string
  costo: string
  /** Solo cuenta para cédula de extranjería y PPT. */
  fechaExpedicion?: string
}

/**
 * Los nombres de lo que falta o está mal, en el orden del formulario.
 *
 * A quien reserva se le pide además lo que exige el ministerio de la estancia;
 * a un acompañante no se le pregunta el costo.
 */
export function loQueFaltaEnLaFicha(
  d: DatosDeLaFicha,
  opciones: { esTitular: boolean },
): string[] {
  const faltan: string[] = []
  const vacio = (v: string) => v.trim() === ''

  if (vacio(d.nombre)) faltan.push('tus nombres')
  if (vacio(d.apellidos)) faltan.push('tus apellidos')
  if (vacio(d.tipoDocumento)) faltan.push('el tipo de documento')
  if (vacio(d.documento) || errorDeDocumento(d.tipoDocumento, d.documento)) {
    faltan.push('el número de identificación')
  }
  if (
    errorDeCorreo(d.correo) !== '' ||
    (opciones.esTitular && vacio(d.correo))
  ) {
    faltan.push('un correo válido')
  }
  if (errorDeTelefono(d.telefono)) faltan.push('el teléfono')
  if (vacio(d.fechaNacimiento) || errorDeNacimientoImposible(d.fechaNacimiento)) {
    faltan.push('la fecha de nacimiento')
  }
  if (
    pideFechaExpedicion(d.tipoDocumento) &&
    (!d.fechaExpedicion ||
      errorDeFechaExpedicion(
        d.fechaExpedicion,
        d.fechaNacimiento,
        '9999-12-31',
      ) !== '')
  ) {
    faltan.push('la fecha de expedición del documento')
  }
  if (vacio(d.nacionalidad)) faltan.push('la nacionalidad')
  if (opciones.esTitular) {
    if (vacio(d.ciudadResidencia)) faltan.push('la ciudad donde vives')
    if (vacio(d.ciudadProcedencia)) faltan.push('la ciudad desde la que viajas')
    if (vacio(d.costo) || errorDeCosto(d.costo)) {
      faltan.push('lo que pagaste por la estancia')
    }
  }
  return faltan
}
