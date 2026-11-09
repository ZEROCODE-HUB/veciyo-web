import { parse as leerMrz } from 'mrz'
import { numeroParaComparar, type DatosDelCodigo } from './codigoDelDocumento'

/**
 * La franja «<<<» del documento (MRZ), leída de la foto (09/11/2026).
 *
 * El código de barras solo lo traen la cédula amarilla colombiana y el DNI
 * peruano. Los pasaportes, la cédula digital nueva, el carné de extranjería y
 * los DNI electrónicos traen en su lugar dos o tres líneas con «<<<» y un
 * formato internacional fijo: número, apellidos, nombres y nacimiento, con
 * **dígitos de control**. Gracias a ellos se sabe si se leyó bien: si el del
 * número no cuadra, no se rellena nada (mejor escribirlo a mano que rellenar
 * un número equivocado).
 *
 * El texto lo saca Tesseract en el navegador (la foto no sale por aquí) y la
 * franja la interpreta la librería `mrz`, igual que la portería en la app
 * (`veci-yo/src/features/visitas/helpers/leerCodigoDelDocumento.ts`,
 * `mrzDelTexto`): los dos repositorios van aparte, así que está copiado. Si
 * cambia una, cambia la otra.
 */

/** Largo de cada línea y cuántas líneas lleva cada formato. */
const FORMATOS: Array<{ largo: number; lineas: number }> = [
  { largo: 30, lineas: 3 }, // TD1: tarjetas (cédula digital, DNI electrónico)
  { largo: 36, lineas: 2 }, // TD2
  { largo: 44, lineas: 2 }, // TD3: pasaportes
]

const LARGO_MINIMO = 5

/** Las líneas de la franja que haya en el texto, normalizadas. */
function lineasDeFranja(texto: string): string[] {
  return texto
    .split(/\r?\n/)
    .map((l) => l.toUpperCase().replace(/[«‹]/g, '<<').replace(/\s+/g, ''))
    .filter((l) => l.includes('<') && /^[A-Z0-9<]+$/.test(l))
}

/** Si el texto parece traer una franja, aunque no se haya podido leer entera. */
export function pareceFranja(texto: string): boolean {
  return lineasDeFranja(texto).some((l) => l.length >= 25 && l.includes('<<'))
}

/** aaaa-mm-dd desde el aammdd de la franja; el siglo, el que no la deje en el futuro. */
export function nacimientoDeLaFranja(aammdd: string | null | undefined, hoy = new Date()): string | undefined {
  if (!aammdd || !/^\d{6}$/.test(aammdd)) return undefined
  const aa = Number(aammdd.slice(0, 2))
  const mm = Number(aammdd.slice(2, 4))
  const dd = Number(aammdd.slice(4, 6))
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return undefined
  const siglo = 2000 + aa > hoy.getFullYear() ? 1900 : 2000
  return `${siglo + aa}-${aammdd.slice(2, 4)}-${aammdd.slice(4, 6)}`
}

const palabras = (t: string | null | undefined) => (t ?? '').split(/\s+/).filter((p) => p.length > 0)

function valido(detalles: Array<{ field: string | null; valid: boolean }>, campo: string): boolean {
  return detalles.find((d) => d.field === campo)?.valid === true
}

function interpretar(lineas: string[]): DatosDelCodigo | null {
  try {
    const r = leerMrz(lineas, { autocorrect: true })
    const f = r.fields
    // Sin el dígito de control del número no se rellena nada.
    if (!valido(r.details, 'documentNumberCheckDigit')) return null
    const documento = numeroParaComparar(f.documentNumber ?? '')
    /*
      En algunas tarjetas el número de la persona no es el de la tarjeta: va
      en el campo opcional. Si el de la tarjeta lleva letras y el opcional son
      solo cifras, el de la persona es el opcional.
    */
    const opcional = numeroParaComparar(f.optional1 ?? f.personalNumber ?? '')
    const numero =
      !/^\d+$/.test(documento) && /^\d{6,12}$/.test(opcional) ? opcional : documento
    if (numero.length < LARGO_MINIMO) return null
    const nacimiento = valido(r.details, 'birthDateCheckDigit')
      ? nacimientoDeLaFranja(f.birthDate)
      : undefined
    return {
      numero,
      apellidos: palabras(f.lastName),
      nombres: palabras(f.firstName),
      ...(nacimiento ? { nacimiento } : {}),
    }
  } catch {
    return null
  }
}

/**
 * Los datos de la franja que haya en el texto leído, o null.
 *
 * El lector no la devuelve limpia: mete espacios, confunde «<» con «« » o
 * «‹», y a veces corta o alarga una línea en uno o dos caracteres. Se
 * normaliza cada línea, se rellenan o recortan las que están a dos de su
 * largo, y se prueba cada grupo de líneas seguidas.
 */
export function datosDeLaFranja(texto: string): DatosDelCodigo | null {
  const lineas = lineasDeFranja(texto)
  for (const { largo, lineas: cuantas } of FORMATOS) {
    const ajustadas = lineas
      .filter((l) => Math.abs(l.length - largo) <= 2)
      .map((l) => (l.length >= largo ? l.slice(0, largo) : l.padEnd(largo, '<')))
    for (let i = 0; i + cuantas <= ajustadas.length; i++) {
      const datos = interpretar(ajustadas.slice(i, i + cuantas))
      if (datos) return datos
    }
  }
  return null
}
