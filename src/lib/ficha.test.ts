import { describe, expect, it } from 'vitest'
import {
  costoComoNumero,
  errorDeCorreo,
  errorDeDocumento,
  errorDeFechaExpedicion,
  errorDeNacimientoImposible,
  errorDeTelefono,
  loQueFaltaEnLaFicha,
  pideFechaExpedicion,
  soloNombre,
  type DatosDeLaFicha,
  type LimitesDeLaFicha,
} from './ficha'

/*
  Los límites viven en la base (`telefono_largo_minimo`, `telefono_largo_maximo`,
  `anio_nacimiento_minimo`) y las funciones los reciben. Aquí van sus valores
  actuales, para que estas pruebas sigan diciendo lo mismo que decían.
*/
const LIMITES: LimitesDeLaFicha = {
  telefonoMinimo: 7,
  telefonoMaximo: 15,
  anioNacimientoMinimo: 1900,
}

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
    expect(errorDeTelefono('', LIMITES)).toBe('')
    expect(errorDeTelefono('12', LIMITES)).not.toBe('')
    expect(errorDeTelefono('300 123 4567', LIMITES)).toBe('')
    expect(errorDeNacimientoImposible('1890-01-01', LIMITES)).not.toBe('')
    expect(errorDeNacimientoImposible('1990-01-01', LIMITES)).toBe('')
  })

  it('los límites son los que se le pasan, no unos escritos', () => {
    // Con otros parámetros cambia la respuesta y el mensaje dice los nuevos.
    const otros = { telefonoMinimo: 10, telefonoMaximo: 10, anioNacimientoMinimo: 1950 }
    expect(errorDeTelefono('300 123 456', otros)).toMatch(/entre 10 y 10/)
    expect(errorDeTelefono('300 123 4567', otros)).toBe('')
    expect(errorDeNacimientoImposible('1940-01-01', otros)).not.toBe('')
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
    expect(loQueFaltaEnLaFicha(BUENA, { esTitular: true, limites: LIMITES })).toEqual([])
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
      { esTitular: true, limites: LIMITES },
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
    expect(loQueFaltaEnLaFicha(acompanante, { esTitular: false, limites: LIMITES })).toEqual([])
    expect(
      loQueFaltaEnLaFicha({ ...acompanante, nacionalidad: '' }, { esTitular: false, limites: LIMITES }),
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
      { esTitular: true, limites: LIMITES },
    )
    expect(faltan).toEqual([
      'el número de identificación',
      'un correo válido',
      'el teléfono',
      'la fecha de nacimiento',
    ])
  })
})

describe('fecha de expedición (14/10/2026)', () => {
  it('solo la piden la cédula de extranjería y el PPT', () => {
    expect(pideFechaExpedicion('cedula_extranjeria')).toBe(true)
    expect(pideFechaExpedicion('ppt')).toBe(true)
    expect(pideFechaExpedicion('cedula_ciudadania')).toBe(false)
    expect(pideFechaExpedicion('pasaporte')).toBe(false)
  })

  it('sin ella, una cédula de extranjería no se puede confirmar', () => {
    const ce = { ...BUENA, tipoDocumento: 'cedula_extranjeria' }
    expect(loQueFaltaEnLaFicha(ce, { esTitular: true, limites: LIMITES })).toEqual([
      'la fecha de expedición del documento',
    ])
    expect(
      loQueFaltaEnLaFicha({ ...ce, fechaExpedicion: '2020-05-01' }, { esTitular: true, limites: LIMITES }),
    ).toEqual([])
  })

  it('una cédula de ciudadanía no la necesita', () => {
    expect(loQueFaltaEnLaFicha(BUENA, { esTitular: true, limites: LIMITES })).toEqual([])
  })

  it('no puede ser futura ni anterior al nacimiento', () => {
    expect(errorDeFechaExpedicion('2030-01-01', '', '2026-10-14')).not.toBe('')
    expect(errorDeFechaExpedicion('1980-01-01', '1990-01-01', '2026-10-14')).not.toBe('')
    expect(errorDeFechaExpedicion('2015-01-01', '1990-01-01', '2026-10-14')).toBe('')
  })

  it('anterior al nacimiento cuenta como que falta', () => {
    const mala = {
      ...BUENA,
      tipoDocumento: 'ppt',
      fechaNacimiento: '1990-01-01',
      fechaExpedicion: '1980-01-01',
    }
    expect(loQueFaltaEnLaFicha(mala, { esTitular: true, limites: LIMITES })).toContain(
      'la fecha de expedición del documento',
    )
  })
})

describe('soloNombre', () => {
  it('quita números y símbolos, y deja letras con tilde, ñ, apóstrofo, guion y punto', () => {
    expect(soloNombre('Ana3 María')).toBe('Ana María')
    expect(soloNombre("O'Neill-Peña Jr.")).toBe("O'Neill-Peña Jr.")
    expect(soloNombre('José#1 @Núñez')).toBe('José Núñez')
  })
})
