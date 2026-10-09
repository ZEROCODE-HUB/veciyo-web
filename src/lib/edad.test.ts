import { describe, expect, it } from 'vitest'
import { edadAlLlegar, esMayorDeEdadAlLlegar, naceDespuesDeLlegar } from './edad'

/**
 * La edad del titular, que hasta el 09/10/2026 solo se comprobaba al final.
 *
 * El cliente recorrió el preregistro entero —fecha de nacimiento, documento,
 * acompañantes, términos— y recibió «Quien reserva tiene que ser mayor de
 * edad» al pulsar el último botón. Su pregunta fue la correcta: «¿pero eso no
 * debería validarse al poner mi fecha de nacimiento?».
 *
 * Esta cuenta tiene que dar **lo mismo** que `edad_al_llegar` en la base. Si
 * difieren, o la pantalla deja pasar algo que luego se rechaza —que es lo que
 * pasaba— o bloquea algo que la base admitiría, que es peor.
 *
 * Todas las fechas van escritas a mano **y la de llegada también**, así que
 * nada depende del calendario de hoy: es la bomba de tiempo que ya rompió dos
 * pruebas de este proyecto en octubre.
 */

const LLEGADA = '2026-10-20'

describe('la edad el día de llegada', () => {
  it('cuenta contra la llegada, no contra hoy', () => {
    /*
      El caso que justifica toda la función: cumple 18 el 15 de octubre y la
      estancia empieza el 20. Llega siendo adulto aunque hoy no lo sea.
    */
    expect(edadAlLlegar('2008-10-15', LLEGADA)).toBe(18)
    expect(esMayorDeEdadAlLlegar('2008-10-15', LLEGADA)).toBe(true)
  })

  it('el que los cumple justo el día de llegada ya es mayor', () => {
    // El borde. Un `>` en vez de `>=` lo dejaría fuera por un día.
    expect(esMayorDeEdadAlLlegar('2008-10-20', LLEGADA)).toBe(true)
  })

  it('y el de un día después, todavía no', () => {
    // El control negativo del borde: sin él, devolver siempre `true` pasaría
    // el caso de arriba igual de verde.
    expect(esMayorDeEdadAlLlegar('2008-10-21', LLEGADA)).toBe(false)
    expect(edadAlLlegar('2008-10-21', LLEGADA)).toBe(17)
  })

  it('un menor claro es menor', () => {
    expect(esMayorDeEdadAlLlegar('2015-03-04', LLEGADA)).toBe(false)
  })

  it('una fecha posterior a la llegada se reconoce como tal', () => {
    /*
      No es «menor de edad»: es un error de tecleo, y decir lo segundo manda a
      la persona a buscar un adulto en vez de a mirar lo que escribió.
    */
    expect(naceDespuesDeLlegar('2027-01-01', LLEGADA)).toBe(true)
    expect(naceDespuesDeLlegar('1990-01-01', LLEGADA)).toBe(false)
  })

  it('sin fecha de nacimiento no se afirma nada', () => {
    // `null`, no `false`: no haberla dado no es ser menor, y tratarlo igual
    // bloquearía a quien todavía no ha escrito nada.
    expect(esMayorDeEdadAlLlegar('', LLEGADA)).toBeNull()
    expect(edadAlLlegar('', LLEGADA)).toBeNull()
  })

  it('sin fecha de llegada cuenta contra hoy en vez de romperse', () => {
    // Pasa si `consultar_precheckin` falla. Es la respuesta prudente: la base
    // lo vuelve a mirar con la fecha de verdad.
    expect(esMayorDeEdadAlLlegar('1990-01-01', null)).toBe(true)
    expect(esMayorDeEdadAlLlegar('2024-01-01', null)).toBe(false)
  })
})
