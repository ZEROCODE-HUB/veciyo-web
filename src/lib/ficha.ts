import type { Documentos, ReglaDeDocumento } from './documentos'
import type { Parametros } from './parametros'

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

/** El número tal como se compara: sin espacios, puntos ni guiones. */
/**
 * Un nombre o un apellido solo lleva letras (con tildes y ñ), espacios,
 * apóstrofos, guiones y puntos. Se quita lo demás al escribir: se podían poner
 * números en el nombre (QA 23/10/2026).
 */
export function soloNombre(texto: string): string {
  return texto.replace(/[^\p{L}\p{M}\s'’.\-]/gu, '')
}

export function limpiarDocumento(numero: string): string {
  return numero.replace(/[\s.-]/g, '').toUpperCase()
}

/** Lo que hace falta de la regla de un documento para juzgar su número. */
export type ReglaDelNumero = Pick<ReglaDeDocumento, 'soloCifras' | 'largoMinimo' | 'largoMaximo'>

/**
 * Por qué ese número no sirve para ese documento, o cadena vacía.
 *
 * Con la regla del país del edificio (`documento_del_pais`, que se edita desde
 * el panel de la plataforma): solo cifras o no, y su largo. La misma que
 * `error_de_documento` en la base y que la app. Sin regla --todavía no se
 * eligió el tipo-- se pide lo mínimo: letras y números, de 4 a 20.
 */
export function errorDeDocumento(
  regla: ReglaDelNumero | null | undefined,
  numero: string,
): string {
  const limpio = limpiarDocumento(numero)
  if (limpio === '') return ''
  const { soloCifras, largoMinimo, largoMaximo } = regla ?? {
    soloCifras: false,
    largoMinimo: 4,
    largoMaximo: 20,
  }
  if (soloCifras) {
    if (!/^[0-9]+$/.test(limpio)) return 'Ese documento lleva solo números.'
    if (limpio.length < largoMinimo || limpio.length > largoMaximo) {
      return `Revisa el número: tiene que tener entre ${largoMinimo} y ${largoMaximo} cifras.`
    }
    return ''
  }
  if (!/^[A-Z0-9]+$/.test(limpio)) return 'Solo letras y números, sin símbolos.'
  if (limpio.length < largoMinimo || limpio.length > largoMaximo) {
    return `Revisa el número: tiene que tener entre ${largoMinimo} y ${largoMaximo} caracteres.`
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

/**
 * Los límites de la ficha que son de negocio y viven en la base desde el
 * 18/10/2026 (`telefono_largo_minimo`, `telefono_largo_maximo`,
 * `anio_nacimiento_minimo`). Las funciones de aquí son puras: los reciben, no
 * los leen.
 */
export interface LimitesDeLaFicha {
  telefonoMinimo: number
  telefonoMaximo: number
  anioNacimientoMinimo: number
}

export function limitesDeLaFicha(p: Parametros): LimitesDeLaFicha {
  return {
    telefonoMinimo: p.numero('telefono_largo_minimo'),
    telefonoMaximo: p.numero('telefono_largo_maximo'),
    anioNacimientoMinimo: p.numero('anio_nacimiento_minimo'),
  }
}

/** El teléfono es opcional; si se escribe, tiene que poderse marcar. */
export function errorDeTelefono(
  telefono: string,
  limites: Pick<LimitesDeLaFicha, 'telefonoMinimo' | 'telefonoMaximo'>,
): string {
  if (telefono.trim() === '') return ''
  const cifras = telefono.replace(/[^0-9]/g, '')
  const { telefonoMinimo: min, telefonoMaximo: max } = limites
  return cifras.length >= min && cifras.length <= max
    ? ''
    : `Revisa el teléfono: tiene que tener entre ${min} y ${max} cifras.`
}

/** Un año anterior al mínimo es un año mal tecleado: nadie vivo nació entonces. */
export function errorDeNacimientoImposible(
  fecha: string,
  limites: Pick<LimitesDeLaFicha, 'anioNacimientoMinimo'>,
): string {
  if (!fecha) return ''
  return Number(fecha.slice(0, 4)) < limites.anioNacimientoMinimo
    ? 'Revisa el año de nacimiento.'
    : ''
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
 * no se los podía consultar nunca. Desde el 25/10/2026 lo dice la regla del
 * país (`pide_fecha_expedicion`), no una lista escrita aquí.
 */
export function pideFechaExpedicion(regla: ReglaDeDocumento | null | undefined): boolean {
  return regla?.pideFechaExpedicion ?? false
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
  opciones: { esTitular: boolean; limites: LimitesDeLaFicha; documentos: Documentos },
): string[] {
  const faltan: string[] = []
  const vacio = (v: string) => v.trim() === ''

  if (vacio(d.nombre)) faltan.push('tus nombres')
  if (vacio(d.apellidos)) faltan.push('tus apellidos')
  if (vacio(d.tipoDocumento)) faltan.push('el tipo de documento')
  const regla = opciones.documentos.regla(d.tipoDocumento)
  if (vacio(d.documento) || errorDeDocumento(regla, d.documento)) {
    faltan.push('el número de identificación')
  }
  if (
    errorDeCorreo(d.correo) !== '' ||
    (opciones.esTitular && vacio(d.correo))
  ) {
    faltan.push('un correo válido')
  }
  if (errorDeTelefono(d.telefono, opciones.limites)) faltan.push('el teléfono')
  if (
    vacio(d.fechaNacimiento) ||
    errorDeNacimientoImposible(d.fechaNacimiento, opciones.limites)
  ) {
    faltan.push('la fecha de nacimiento')
  }
  if (
    pideFechaExpedicion(regla) &&
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
