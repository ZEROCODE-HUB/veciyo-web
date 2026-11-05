import { describe, expect, it } from 'vitest'
import {
  avisoDeLaFoto,
  brillo,
  distancia,
  huella,
  MISMA_FOTO,
  nitidez,
  type Grises,
} from './fotoDelDocumento'
import { cedulaColombianaDelCodigo, comoNombre, datosDelCodigo, numeroParaComparar } from './codigoDelDocumento'

/** Una imagen en grises hecha a mano: `valor(x, y)` da el gris de cada píxel. */
function imagen(ancho: number, alto: number, valor: (x: number, y: number) => number): Grises {
  const pixeles = new Uint8ClampedArray(ancho * alto)
  for (let y = 0; y < alto; y++) for (let x = 0; x < ancho; x++) pixeles[y * ancho + x] = valor(x, y)
  return { ancho, alto, pixeles }
}

/** Un documento nítido: fondo claro con líneas de texto finas y oscuras. */
const nitida = imagen(256, 160, (x, y) => (y % 8 < 2 && x % 6 < 4 ? 30 : 220))
/** El mismo documento movido: las líneas, en una rampa suave. */
const movida = imagen(256, 160, (_x, y) => 120 + 20 * Math.sin(y / 20))
const oscura = imagen(256, 160, (x, y) => (y % 8 < 2 && x % 6 < 4 ? 5 : 40))

describe('mirar si la foto del documento sirve', () => {
  it('una foto nítida y con luz no lleva aviso', () => {
    expect(avisoDeLaFoto(nitida)).toBeNull()
  })

  it('una foto oscura lo dice', () => {
    expect(brillo(oscura)).toBeLessThan(55)
    expect(avisoDeLaFoto(oscura)).toMatch(/oscura/)
  })

  it('una foto movida lo dice', () => {
    expect(nitidez(movida)).toBeLessThan(nitidez(nitida))
    expect(avisoDeLaFoto(movida)).toMatch(/movida o borrosa/)
  })
})

describe('la misma foto dos veces', () => {
  it('la misma imagen da la misma huella', () => {
    expect(distancia(huella(nitida), huella(nitida))).toBe(0)
  })

  it('un poco más clara sigue siendo la misma', () => {
    const masClara = imagen(256, 160, (x, y) => Math.min(255, (y % 8 < 2 && x % 6 < 4 ? 30 : 220) + 15))
    expect(distancia(huella(nitida), huella(masClara))).toBeLessThanOrEqual(MISMA_FOTO)
  })

  it('el otro lado no es la misma', () => {
    // El frente con la foto a la izquierda; el reverso con el código abajo.
    const frente = imagen(256, 160, (x) => (x < 90 ? 60 : 210))
    const reverso = imagen(256, 160, (_x, y) => (y > 110 ? 40 : 200))
    expect(distancia(huella(frente), huella(reverso))).toBeGreaterThan(MISMA_FOTO)
  })
})

describe('el código de barras del reverso', () => {
  const cedula = () => {
    const bytes = Array.from({ length: 531 }, () => '\0')
    const poner = (d: number, t: string) => [...t].forEach((c, i) => (bytes[d + i] = c))
    poner(48, '0051907053')
    poner(58, 'GONZALEZ')
    poner(81, 'MARIN')
    poner(104, 'MARIA')
    poner(127, 'GABRIELA')
    poner(151, 'F19670128')
    return bytes.join('')
  }

  it('la cédula colombiana trae número, apellidos, nombres y nacimiento', () => {
    expect(cedulaColombianaDelCodigo(cedula())).toEqual({
      numero: '51907053',
      apellidos: ['GONZALEZ', 'MARIN'],
      nombres: ['MARIA', 'GABRIELA'],
      nacimiento: '1967-01-28',
    })
  })

  it('el DNI peruano trae solo el número', () => {
    expect(datosDelCodigo('code39', '45678912')).toEqual({ numero: '45678912', apellidos: [], nombres: [] })
  })

  it('un PDF417 que no es de cédula no da nada', () => {
    expect(datosDelCodigo('pdf417', '\u0001huella-binaria')).toBeNull()
  })

  it('los nombres se escriben como nombres, no en mayúsculas', () => {
    expect(comoNombre(['MARIA', 'GABRIELA'])).toBe('Maria Gabriela')
  })

  it('el número se compara sin puntos ni ceros de relleno', () => {
    expect(numeroParaComparar('51.907.053')).toBe(numeroParaComparar('0051907053'))
  })
})
