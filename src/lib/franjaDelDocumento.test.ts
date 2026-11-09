import { describe, expect, it } from 'vitest'
import { datosDeLaFranja, nacimientoDeLaFranja, pareceFranja } from './franjaDelDocumento'

// Los ejemplos del documento 9303 de la OACI (Utopía, Anna María Eriksson).
const PASAPORTE = [
  'P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<',
  'L898902C36UTO7408122F1204159ZE184226B<<<<<10',
]
const TARJETA = [
  'I<UTOD231458907<<<<<<<<<<<<<<<',
  '7408122F1204159UTO<<<<<<<<<<<6',
  'ERIKSSON<<ANNA<MARIA<<<<<<<<<<',
]

describe('datosDeLaFranja', () => {
  it('lee el pasaporte: número, apellidos, nombres y nacimiento', () => {
    const texto = ['REPUBLICA DE UTOPIA', 'PASAPORTE', ...PASAPORTE].join('\n')
    expect(datosDeLaFranja(texto)).toEqual({
      numero: 'L898902C3',
      apellidos: ['ERIKSSON'],
      nombres: ['ANNA', 'MARIA'],
      nacimiento: '1974-08-12',
    })
  })

  it('lee la tarjeta de tres líneas (cédula digital, DNI electrónico)', () => {
    const datos = datosDeLaFranja(TARJETA.join('\n'))
    expect(datos?.numero).toBe('D23145890')
    expect(datos?.apellidos).toEqual(['ERIKSSON'])
    expect(datos?.nacimiento).toBe('1974-08-12')
  })

  it('aguanta lo que mete el lector: espacios y «« » por «<<»', () => {
    const sucio = [
      PASAPORTE[0].replace('<<ANNA', '«ANNA').replace('MARIA<<', 'MARIA «'),
      PASAPORTE[1].replace('UTO74', 'UTO 74'),
    ].join('\n')
    expect(datosDeLaFranja(sucio)?.numero).toBe('L898902C3')
  })

  it('si el dígito de control del número no cuadra, no rellena nada', () => {
    const mal = [PASAPORTE[0], PASAPORTE[1].replace('L898902C3', 'L898902C8')].join('\n')
    expect(datosDeLaFranja(mal)).toBeNull()
  })

  it('sin franja, null', () => {
    expect(datosDeLaFranja('REPUBLICA DE COLOMBIA\nCEDULA DE CIUDADANIA\n79123456')).toBeNull()
  })
})

describe('nacimientoDeLaFranja', () => {
  const hoy = new Date(2026, 10, 9)
  it('el siglo es el que no lo deja en el futuro', () => {
    expect(nacimientoDeLaFranja('740812', hoy)).toBe('1974-08-12')
    expect(nacimientoDeLaFranja('100305', hoy)).toBe('2010-03-05')
    expect(nacimientoDeLaFranja('300101', hoy)).toBe('1930-01-01')
  })
  it('una fecha imposible, nada', () => {
    expect(nacimientoDeLaFranja('741312', hoy)).toBeUndefined()
    expect(nacimientoDeLaFranja('', hoy)).toBeUndefined()
  })
})

describe('pareceFranja', () => {
  it('distingue una franja de texto normal', () => {
    expect(pareceFranja(PASAPORTE.join('\n'))).toBe(true)
    expect(pareceFranja('CEDULA DE CIUDADANIA')).toBe(false)
  })
})
