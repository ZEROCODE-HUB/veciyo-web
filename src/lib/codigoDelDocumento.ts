/**
 * Lo que trae el código de barras del reverso del documento (05/11/2026).
 *
 * El huésped subía la foto del documento y después tecleaba su nombre y su
 * número a mano: nadie comparaba lo uno con lo otro, y una cifra mal escrita
 * solo salía en portería o en el reporte al ministerio. El reverso de la
 * cédula colombiana trae un PDF417 con número, apellidos, nombres y
 * nacimiento, y el del DNI peruano un Code39 con el número. Se leen de la foto
 * del reverso, en el navegador (la foto no sale por aquí), y con eso se
 * rellena el paso siguiente.
 *
 * Es la misma lectura que hace la portería en la app
 * (`veci-yo/src/features/visitas/helpers/leerCodigoDelDocumento.ts`): los dos
 * repositorios van aparte, así que la parte de la cédula está copiada. Si
 * cambia una, cambia la otra.
 */

export interface DatosDelCodigo {
  numero: string
  apellidos: string[]
  nombres: string[]
  /** aaaa-mm-dd */
  nacimiento?: string
}

/** Letras y cifras en mayúsculas, sin separadores ni ceros de relleno delante. */
export function numeroParaComparar(t: string): string {
  const limpio = t.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return /^\d+$/.test(limpio) ? limpio.replace(/^0+/, '') : limpio
}

const SOLO_LETRAS = /^[A-ZÑ]+( [A-ZÑ]+)*$/

/**
 * El PDF417 de la cédula colombiana, por posiciones (el mapa de
 * github.com/Eitol/colombian-cedula-reader, MIT) y, si el lector se comió los
 * nulos de relleno, por la forma.
 */
export function cedulaColombianaDelCodigo(data: string): DatosDelCodigo | null {
  return porPosiciones(data) ?? porForma(data)
}

function porPosiciones(data: string): DatosDelCodigo | null {
  if (data.length < 160) return null
  const campo = (desde: number, hasta: number) =>
    data.slice(desde, hasta).replace(/[^A-ZÑ ]+/g, ' ').replace(/\s+/g, ' ').trim()
  const numero = data.slice(48, 58)
  const apellido = campo(58, 81)
  if (!/^\d{10}$/.test(numero) || !SOLO_LETRAS.test(apellido)) return null
  return {
    numero: numero.replace(/^0+/, ''),
    apellidos: [apellido, campo(81, 104)].filter(Boolean),
    nombres: [campo(104, 127), campo(127, 151)].filter(Boolean),
    ...nacimientoDe(/[MF](\d{4})(\d{2})(\d{2})/.exec(data.slice(150, 162))),
  }
}

function porForma(data: string): DatosDelCodigo | null {
  const pegado = /(\d{10,})([A-ZÑ])/.exec(data)
  if (!pegado) return null
  const numero = pegado[1].slice(-10).replace(/^0+/, '')
  if (numero.length < 5) return null
  const resto = data.slice(pegado.index + pegado[1].length)
  const fecha = /[MF](\d{4})(\d{2})(\d{2})/.exec(resto)
  const palabras = (fecha ? resto.slice(0, fecha.index) : resto)
    .split(/[^A-ZÑ ]+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
  // Con cuatro trozos el orden es seguro; con menos, falta alguno y no se sabe
  // cuál, así que solo el primero va como apellido.
  return {
    numero,
    apellidos: palabras.length >= 4 ? palabras.slice(0, 2) : palabras.slice(0, 1),
    nombres: palabras.length >= 4 ? palabras.slice(2, 4) : palabras.slice(1),
    ...nacimientoDe(fecha),
  }
}

function nacimientoDe(m: RegExpExecArray | null): { nacimiento?: string } {
  if (!m) return {}
  const [, anio, mes, dia] = m
  const valida = Number(mes) >= 1 && Number(mes) <= 12 && Number(dia) >= 1 && Number(dia) <= 31
  return valida ? { nacimiento: `${anio}-${mes}-${dia}` } : {}
}

/**
 * Lo que se puede sacar de un código leído: de la cédula colombiana, todo; de
 * un Code39 (DNI peruano), el número. Lo demás no se entiende y no se usa.
 */
export function datosDelCodigo(formato: 'pdf417' | 'code39', data: string): DatosDelCodigo | null {
  if (formato === 'pdf417') return cedulaColombianaDelCodigo(data)
  const numero = numeroParaComparar(data)
  return numero.length >= 5 ? { numero, apellidos: [], nombres: [] } : null
}

/** «GONZALEZ MARIN» → «Gonzalez Marin»: el código va en mayúsculas y sin tildes. */
export function comoNombre(palabras: string[]): string {
  return palabras
    .join(' ')
    .toLowerCase()
    .replace(/(^|\s)(\p{L})/gu, (_, espacio: string, letra: string) => espacio + letra.toUpperCase())
}
