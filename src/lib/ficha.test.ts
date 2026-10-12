import { describe, expect, it } from 'vitest'
import {
  costoComoNumero,
  errorDeCorreo,
  errorDeDocumento,
  errorDeNacimientoImposible,
  errorDeTelefono,
  loQueFaltaEnLaFicha,
  type DatosDeLaFicha,
} from './ficha'

/**
 * Lo que el recorrido del 12/10/2026 dejó pasar: una cédula «ABC-12», un
 * teléfono «12», alguien nacido en 1890, y una ficha sin ciudad, sin costo y
 * sin nacionalidad --que es justo lo que el reporte al ministerio exige--.
 */
const BUENA: DatosDeLaFicha = {
  nombre: 'Ana',
  apellidos: 'Pérez',
  tipoDocumento: 'cedula_ciudadania',
  documento: '1020304050',
  correo: 'ana@ejemplo.com',
  telefono: '3001234567',
  fechaNacimiento: '1990-05-05',
  nacionalidad: 'CO',
  ciudadResidencia: 'Bogotá',
  ciudadProcedencia: 'Cali',
  costo: '850000',
}

describe('el número de documento', () => {
  it('una cédula lleva solo números', () => {
    expect(errorDeDocumento('cedula_ciudadania', 'ABC-12')).not.toBe('')
    expect(errorDeDocumento('cedula_ciudadania', '1.020.304.050')).toBe('')
    expect(errorDeDocumento('cedula_ciudadania', '12')).not.toBe('')
  })

  it('un pasaporte admite letras, y no símbolos', () => {
    expect(errorDeDocumento('pasaporte', 'AB123456')).toBe('')
    expect(errorDeDocumento('pasaporte', 'AB#1234')).not.toBe('')
  })
})

describe('los demás campos', () => {
  it('el correo, el teléfono y el año se revisan solo si se escriben', () => {
    expect(errorDeCorreo('')).toBe('')
    expect(errorDeCorreo('no-es-correo')).not.toBe('')
    expect(errorDeCorreo('ana@ejemplo.com')).toBe('')
    expect(errorDeTelefono('')).toBe('')
    expect(errorDeTelefono('12')).not.toBe('')
    expect(errorDeTelefono('300 123 4567')).toBe('')
    expect(errorDeNacimientoImposible('1890-01-01')).not.toBe('')
    expect(errorDeNacimientoImposible('1990-01-01')).toBe('')
  })

  it('el costo es un número, y cero vale', () => {
    expect(costoComoNumero('850000')).toBe(850000)
    expect(costoComoNumero('0')).toBe(0)
    expect(costoComoNumero('abc')).toBeUndefined()
    expect(costoComoNumero('-5')).toBeUndefined()
  })
})

describe('lo que falta para confirmar', () => {
  it('a una ficha completa no le falta nada', () => {
    expect(loQueFaltaEnLaFicha(BUENA, { esTitular: true })).toEqual([])
  })

  it('a quien reserva se le pide lo que exige el ministerio', () => {
    const faltan = loQueFaltaEnLaFicha(
      {
        ...BUENA,
        nacionalidad: '',
        ciudadResidencia: '',
        ciudadProcedencia: ' ',
        costo: '',
      },
      { esTitular: true },
    )
    expect(faltan).toEqual([
      'la nacionalidad',
      'la ciudad donde vives',
      'la ciudad desde la que viajas',
      'lo que pagaste por la estancia',
    ])
  })

  it('a un acompañante no se le pide el costo ni el correo, pero sí la nacionalidad', () => {
    const acompanante = {
      ...BUENA,
      correo: '',
      costo: '',
      ciudadResidencia: '',
      ciudadProcedencia: '',
    }
    expect(loQueFaltaEnLaFicha(acompanante, { esTitular: false })).toEqual([])
    expect(
      loQueFaltaEnLaFicha({ ...acompanante, nacionalidad: '' }, { esTitular: false }),
    ).toEqual(['la nacionalidad'])
  })

  it('un dato mal escrito cuenta como que falta', () => {
    const faltan = loQueFaltaEnLaFicha(
      {
        ...BUENA,
        documento: 'ABC-12',
        correo: 'malo',
        telefono: '12',
        fechaNacimiento: '1890-01-01',
      },
      { esTitular: true },
    )
    expect(faltan).toEqual([
      'el número de identificación',
      'un correo válido',
      'el teléfono',
      'la fecha de nacimiento',
    ])
  })
})
