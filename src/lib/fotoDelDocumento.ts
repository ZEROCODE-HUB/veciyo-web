import type { DecodeHintType } from '@zxing/library'
import { datosDelCodigo, type DatosDelCodigo } from './codigoDelDocumento'

/**
 * Lo que se hace con la foto del documento antes de subirla (05/11/2026).
 *
 *   · **Reducirla.** Iba entera, en base64 dentro de un JSON: la foto de un
 *     celular de hoy pesa 4-8 MB, un tercio más en base64, y pasaba del tope.
 *     Con 2000 px por el lado largo el número se lee de sobra.
 *   · **Mirar si sirve.** Cualquier imagen pasaba: una foto oscura o movida se
 *     descubría en portería. Ahora se avisa al elegirla (no se bloquea: el
 *     aviso puede equivocarse, y quien está delante ve la foto).
 *   · **Ver si es la misma dos veces.** El frente subido también como reverso.
 *   · **Leer el código del reverso** para rellenar los datos.
 *
 * Todo pasa en el navegador. Las medidas son funciones puras sobre una imagen
 * en grises, para poder probarlas sin navegador.
 */

/** El lado largo con el que se sube. */
export const LADO_PARA_SUBIR = 2000
/** Por encima de esto se vuelve a comprimir aunque no sea grande. */
const PESO_PARA_COMPRIMIR = 1.5 * 1024 * 1024

/** Una imagen en grises: un byte por píxel, de 0 a 255. */
export interface Grises {
  ancho: number
  alto: number
  pixeles: Uint8ClampedArray | number[]
}

/** El brillo medio, de 0 (negro) a 255 (blanco). */
export function brillo(g: Grises): number {
  let suma = 0
  for (let i = 0; i < g.pixeles.length; i++) suma += g.pixeles[i]
  return g.pixeles.length ? suma / g.pixeles.length : 0
}

/**
 * Cuánto detalle tiene: la varianza del laplaciano, que es la medida de
 * siempre para saber si una foto está enfocada. Una foto movida tiene los
 * bordes blandos y da un número bajo.
 */
export function nitidez(g: Grises): number {
  const { ancho, alto, pixeles } = g
  let suma = 0
  let sumaCuadrados = 0
  let n = 0
  for (let y = 1; y < alto - 1; y++) {
    for (let x = 1; x < ancho - 1; x++) {
      const i = y * ancho + x
      const l =
        pixeles[i - ancho] + pixeles[i + ancho] + pixeles[i - 1] + pixeles[i + 1] - 4 * pixeles[i]
      suma += l
      sumaCuadrados += l * l
      n++
    }
  }
  if (n === 0) return 0
  const media = suma / n
  return sumaCuadrados / n - media * media
}

/**
 * Una huella de 64 bits: la imagen en 8x8 y cada casilla, más clara u oscura
 * que la media. Dos fotos de la misma cara dan huellas casi iguales aunque
 * se hayan tomado dos veces.
 */
export function huella(g: Grises): string {
  const casillas: number[] = []
  for (let cy = 0; cy < 8; cy++) {
    for (let cx = 0; cx < 8; cx++) {
      let suma = 0
      let n = 0
      const x0 = Math.floor((cx * g.ancho) / 8)
      const x1 = Math.max(x0 + 1, Math.floor(((cx + 1) * g.ancho) / 8))
      const y0 = Math.floor((cy * g.alto) / 8)
      const y1 = Math.max(y0 + 1, Math.floor(((cy + 1) * g.alto) / 8))
      for (let y = y0; y < y1 && y < g.alto; y++) {
        for (let x = x0; x < x1 && x < g.ancho; x++) {
          suma += g.pixeles[y * g.ancho + x]
          n++
        }
      }
      casillas.push(n ? suma / n : 0)
    }
  }
  const media = casillas.reduce((a, b) => a + b, 0) / casillas.length
  return casillas.map((c) => (c > media ? '1' : '0')).join('')
}

/** En cuántos bits se diferencian dos huellas. */
export function distancia(a: string, b: string): number {
  let d = 0
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) d++
  return d + Math.abs(a.length - b.length)
}

/** Debajo de esto la foto está oscura (de 0 a 255). */
export const BRILLO_MINIMO = 55
/** Debajo de esto la foto está movida o desenfocada (con la imagen a 512 px). */
export const NITIDEZ_MINIMA = 40
/** Hasta aquí, dos huellas son la misma foto. */
export const MISMA_FOTO = 6

/** Qué decirle a la persona de su foto, o null si se ve bien. */
export function avisoDeLaFoto(g: Grises): string | null {
  if (brillo(g) < BRILLO_MINIMO) {
    return 'La foto se ve oscura: tómala otra vez con más luz para que se lean los datos.'
  }
  if (nitidez(g) < NITIDEZ_MINIMA) {
    return 'La foto se ve movida o borrosa: tómala otra vez, quieta y de cerca, para que se lean los datos.'
  }
  return null
}

// --- Lo que necesita navegador ---------------------------------------------

export interface FotoRevisada {
  /** La que se sube: reducida si hacía falta. */
  archivo: File
  /** Qué decirle de su foto, o null. */
  aviso: string | null
  huella: string
}

async function cargar(archivo: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(archivo)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return img
  } finally {
    // La imagen ya está decodificada; la dirección no hace falta.
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}

function lienzo(img: HTMLImageElement, ladoMaximo: number, girar = false): HTMLCanvasElement {
  const escala = Math.min(1, ladoMaximo / Math.max(img.naturalWidth, img.naturalHeight))
  const ancho = Math.max(1, Math.round(img.naturalWidth * escala))
  const alto = Math.max(1, Math.round(img.naturalHeight * escala))
  const c = document.createElement('canvas')
  c.width = girar ? alto : ancho
  c.height = girar ? ancho : alto
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('Este navegador no puede leer la foto')
  if (girar) {
    ctx.translate(alto, 0)
    ctx.rotate(Math.PI / 2)
  }
  ctx.drawImage(img, 0, 0, ancho, alto)
  return c
}

function enGrises(c: HTMLCanvasElement): Grises {
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('Este navegador no puede leer la foto')
  const { data } = ctx.getImageData(0, 0, c.width, c.height)
  const pixeles = new Uint8ClampedArray(c.width * c.height)
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    pixeles[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
  }
  return { ancho: c.width, alto: c.height, pixeles }
}

/**
 * Revisa la foto elegida: la reduce si es grande y dice si se ve mal. Si el
 * navegador no puede abrirla (un formato raro), se sube tal cual y sin aviso:
 * el servidor decide si la acepta.
 */
export async function revisarFoto(archivo: File): Promise<FotoRevisada> {
  if (!archivo.type.startsWith('image/')) return { archivo, aviso: null, huella: '' }
  let img: HTMLImageElement
  try {
    img = await cargar(archivo)
  } catch {
    return { archivo, aviso: null, huella: '' }
  }
  const pequena = enGrises(lienzo(img, 512))
  const aviso = avisoDeLaFoto(pequena)
  const marca = huella(pequena)

  const lado = Math.max(img.naturalWidth, img.naturalHeight)
  if (lado <= LADO_PARA_SUBIR && archivo.size <= PESO_PARA_COMPRIMIR) {
    return { archivo, aviso, huella: marca }
  }
  const c = lienzo(img, LADO_PARA_SUBIR)
  const blob = await new Promise<Blob | null>((listo) => c.toBlob(listo, 'image/jpeg', 0.85))
  if (!blob) return { archivo, aviso, huella: marca }
  const nombre = archivo.name.replace(/\.[^.]+$/, '') + '.jpg'
  return { archivo: new File([blob], nombre, { type: 'image/jpeg' }), aviso, huella: marca }
}

/**
 * El código de barras de la foto, o null. Se prueba derecha y girada, porque
 * en una foto del reverso tomada en vertical el código queda de lado.
 *
 * ZXing se carga solo aquí, la primera vez: pesa, y quien no tiene código en
 * su documento no tiene por qué bajarlo.
 */
export async function leerCodigoDeLaFoto(
  archivo: File,
): Promise<{ formato: 'pdf417' | 'code39'; datos: DatosDelCodigo } | null> {
  if (!archivo.type.startsWith('image/')) return null
  const zxing = await import('@zxing/library')
  const lector = new zxing.MultiFormatReader()
  const pistas = new Map<DecodeHintType, unknown>([
    [zxing.DecodeHintType.POSSIBLE_FORMATS, [zxing.BarcodeFormat.PDF_417, zxing.BarcodeFormat.CODE_39]],
    [zxing.DecodeHintType.TRY_HARDER, true],
  ])
  lector.setHints(pistas)

  let img: HTMLImageElement
  try {
    img = await cargar(archivo)
  } catch {
    return null
  }
  for (const girar of [false, true]) {
    try {
      const fuente = new zxing.HTMLCanvasElementLuminanceSource(lienzo(img, LADO_PARA_SUBIR, girar))
      // `decodeWithState` y no `decode`: `decode` sin pistas borra las de
      // `setHints` y prueba todos los formatos (comprobado el 05/11/2026).
      const resultado = lector.decodeWithState(new zxing.BinaryBitmap(new zxing.HybridBinarizer(fuente)))
      const formato = resultado.getBarcodeFormat() === zxing.BarcodeFormat.PDF_417 ? 'pdf417' : 'code39'
      const datos = datosDelCodigo(formato, resultado.getText())
      if (datos) return { formato, datos }
    } catch {
      // Sin código en esa posición: se prueba la otra.
    } finally {
      lector.reset()
    }
  }
  return null
}
