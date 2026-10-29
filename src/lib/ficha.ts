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
 * Qué campos de la ficha son obligatorios, y cómo se llaman en el aviso
 * «Para continuar falta…». Desde el 29/10/2026 lo dice la base
 * (`catalogo_opcion`, lista `campos_obligatorios_preregistro`): el
 * administrador de la app enciende o apaga, para quien reserva y para un
 * acompañante, cada campo, y cambia su etiqueta. No puede agregar campos: los
 * códigos son estos once.
 *
 * Solo se puede relajar el «vacío»: lo **mal escrito** --un documento que no
 * cumple la regla, un correo sin arroba, un año imposible, un costo con
 * letras-- sigue faltando aunque el campo no sea obligatorio, si se escribió
 * algo. El teléfono no está en la lista: es opcional y se revisa si se escribe.
 */
export type CampoDeLaFicha =
  | 'nombre'
  | 'apellidos'
  | 'tipo_documento'
  | 'documento'
  | 'correo'
  | 'fecha_nacimiento'
  | 'fecha_expedicion'
  | 'nacionalidad'
  | 'ciudad_residencia'
  | 'ciudad_procedencia'
  | 'costo'

export interface ReglaDelCampo {
  etiqueta: string
  titular: boolean
  acompanante: boolean
}

export type CamposObligatorios = ReadonlyMap<string, ReglaDelCampo>

/**
 * El respaldo: lo que se exigía antes del 29/10/2026, con sus mismos textos.
 * Se usa mientras la lista no ha llegado, si la lectura falla o si a la lista
 * le falta una fila. Así un fallo de red nunca deja pasar una ficha incompleta
 * --lo contrario, pedir de más un momento, no hace daño--. Es el único lugar
 * donde está escrito.
 */
export const CAMPOS_OBLIGATORIOS_DE_RESPALDO: Readonly<Record<CampoDeLaFicha, ReglaDelCampo>> = {
  nombre: { etiqueta: 'tus nombres', titular: true, acompanante: true },
  apellidos: { etiqueta: 'tus apellidos', titular: true, acompanante: true },
  tipo_documento: { etiqueta: 'el tipo de documento', titular: true, acompanante: true },
  documento: { etiqueta: 'el número de identificación', titular: true, acompanante: true },
  correo: { etiqueta: 'un correo válido', titular: true, acompanante: false },
  fecha_nacimiento: { etiqueta: 'la fecha de nacimiento', titular: true, acompanante: true },
  fecha_expedicion: { etiqueta: 'la fecha de expedición del documento', titular: true, acompanante: true },
  nacionalidad: { etiqueta: 'la nacionalidad', titular: true, acompanante: true },
  ciudad_residencia: { etiqueta: 'la ciudad donde vives', titular: true, acompanante: false },
  ciudad_procedencia: { etiqueta: 'la ciudad desde la que viajas', titular: true, acompanante: false },
  costo: { etiqueta: 'lo que pagaste por la estancia', titular: true, acompanante: false },
}

/** Una fila de `catalogo_opcion` tal como llega. */
export interface FilaDeCampoObligatorio {
  codigo: string
  etiqueta: string
  activo: boolean
  extra?: unknown
}

/**
 * Las filas de la base, convertidas en la regla. Una fila apagada
 * (`activo=false`) no obliga a nadie. Un dato que no se entiende --un booleano
 * que no es booleano, una etiqueta vacía-- toma el del respaldo, y un código
 * que no es de la ficha se ignora.
 */
export function camposObligatoriosDe(filas: readonly FilaDeCampoObligatorio[]): CamposObligatorios {
  const regla = new Map<string, ReglaDelCampo>()
  for (const f of filas) {
    if (!Object.prototype.hasOwnProperty.call(CAMPOS_OBLIGATORIOS_DE_RESPALDO, f.codigo)) continue
    const respaldo = CAMPOS_OBLIGATORIOS_DE_RESPALDO[f.codigo as CampoDeLaFicha]
    const extra = (f.extra ?? {}) as { titular?: unknown; acompanante?: unknown }
    const booleano = (v: unknown, siNo: boolean) => (typeof v === 'boolean' ? v : siNo)
    regla.set(f.codigo, {
      etiqueta: f.etiqueta?.trim() || respaldo.etiqueta,
      titular: f.activo !== false && booleano(extra.titular, respaldo.titular),
      acompanante: f.activo !== false && booleano(extra.acompanante, respaldo.acompanante),
    })
  }
  return regla
}

/** La regla de un campo: la de la base, o la de respaldo si no la trae. */
export function reglaDelCampo(
  obligatorios: CamposObligatorios | null | undefined,
  campo: CampoDeLaFicha,
): ReglaDelCampo {
  return obligatorios?.get(campo) ?? CAMPOS_OBLIGATORIOS_DE_RESPALDO[campo]
}

/** Si ese campo es obligatorio para quien llena la ficha. */
export function esObligatorio(
  obligatorios: CamposObligatorios | null | undefined,
  campo: CampoDeLaFicha,
  esTitular: boolean,
): boolean {
  const r = reglaDelCampo(obligatorios, campo)
  return esTitular ? r.titular : r.acompanante
}

/**
 * Los nombres de lo que falta o está mal, en el orden del formulario.
 *
 * Qué se exige a quien reserva y qué a un acompañante lo dice `obligatorios`
 * (la lista de la base); sin ella, el respaldo de arriba, que es lo de antes:
 * a quien reserva, además, lo que exige el ministerio de la estancia, y a un
 * acompañante ni el costo ni el correo. Lo mal escrito falta siempre.
 */
export function loQueFaltaEnLaFicha(
  d: DatosDeLaFicha,
  opciones: {
    esTitular: boolean
    limites: LimitesDeLaFicha
    documentos: Documentos
    obligatorios?: CamposObligatorios | null
  },
): string[] {
  const faltan: string[] = []
  const vacio = (v: string | undefined) => (v ?? '').trim() === ''
  const { esTitular, obligatorios } = opciones
  /** Obligatorio y en blanco, o escrito y mal. */
  const revisar = (campo: CampoDeLaFicha, valor: string | undefined, malEscrito: boolean) => {
    const enBlanco = vacio(valor)
    if (enBlanco ? esObligatorio(obligatorios, campo, esTitular) : malEscrito) {
      faltan.push(reglaDelCampo(obligatorios, campo).etiqueta)
    }
  }

  revisar('nombre', d.nombre, false)
  revisar('apellidos', d.apellidos, false)
  revisar('tipo_documento', d.tipoDocumento, false)
  const regla = opciones.documentos.regla(d.tipoDocumento)
  revisar('documento', d.documento, errorDeDocumento(regla, d.documento) !== '')
  revisar('correo', d.correo, errorDeCorreo(d.correo) !== '')
  if (errorDeTelefono(d.telefono, opciones.limites)) faltan.push('el teléfono')
  revisar(
    'fecha_nacimiento',
    d.fechaNacimiento,
    errorDeNacimientoImposible(d.fechaNacimiento, opciones.limites) !== '',
  )
  if (pideFechaExpedicion(regla)) {
    revisar(
      'fecha_expedicion',
      d.fechaExpedicion,
      errorDeFechaExpedicion(d.fechaExpedicion ?? '', d.fechaNacimiento, '9999-12-31') !== '',
    )
  }
  revisar('nacionalidad', d.nacionalidad, false)
  revisar('ciudad_residencia', d.ciudadResidencia, false)
  revisar('ciudad_procedencia', d.ciudadProcedencia, false)
  revisar('costo', d.costo, errorDeCosto(d.costo) !== '')
  return faltan
}
