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
  CAMPOS_OBLIGATORIOS_DE_RESPALDO,
  camposObligatoriosDe,
  type DatosDeLaFicha,
  type FilaDeCampoObligatorio,
  type LimitesDeLaFicha,
} from './ficha'
import { documentosDe, type ReglaDeDocumento } from './documentos'

/*
  Los documentos y sus reglas viven en la base, por país (`documento_del_pais`,
  25/10/2026). Aquí, los de Colombia tal como se sembraron.
*/
const regla = (r: Partial<ReglaDeDocumento> & Pick<ReglaDeDocumento, 'tipo' | 'etiqueta'>): ReglaDeDocumento => ({
  paraAdultos: true,
  paraMenores: false,
  soloCifras: false,
  largoMinimo: 4,
  largoMaximo: 20,
  dosCaras: true,
  pideFechaExpedicion: false,
  ...r,
})
const COLOMBIA = documentosDe([
  regla({ tipo: 'cedula_ciudadania', etiqueta: 'Cédula de ciudadanía', soloCifras: true, largoMinimo: 5, largoMaximo: 12 }),
  regla({ tipo: 'cedula_extranjeria', etiqueta: 'Cédula de extranjería', soloCifras: true, largoMinimo: 5, largoMaximo: 12, pideFechaExpedicion: true }),
  regla({ tipo: 'ppt', etiqueta: 'PPT', pideFechaExpedicion: true, paraMenores: true }),
  regla({ tipo: 'pasaporte', etiqueta: 'Pasaporte', dosCaras: false, paraMenores: true }),
])

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
    expect(errorDeDocumento(COLOMBIA.regla('cedula_ciudadania'), 'ABC-12')).not.toBe('')
    expect(errorDeDocumento(COLOMBIA.regla('cedula_ciudadania'), '1.020.304.050')).toBe('')
    expect(errorDeDocumento(COLOMBIA.regla('cedula_ciudadania'), '12')).not.toBe('')
  })

  it('un pasaporte admite letras, y no símbolos', () => {
    expect(errorDeDocumento(COLOMBIA.regla('pasaporte'), 'AB123456')).toBe('')
    expect(errorDeDocumento(COLOMBIA.regla('pasaporte'), 'AB#1234')).not.toBe('')
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
    expect(loQueFaltaEnLaFicha(BUENA, { esTitular: true, limites: LIMITES, documentos: COLOMBIA })).toEqual([])
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
      { esTitular: true, limites: LIMITES, documentos: COLOMBIA },
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
    expect(loQueFaltaEnLaFicha(acompanante, { esTitular: false, limites: LIMITES, documentos: COLOMBIA })).toEqual([])
    expect(
      loQueFaltaEnLaFicha({ ...acompanante, nacionalidad: '' }, { esTitular: false, limites: LIMITES, documentos: COLOMBIA }),
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
      { esTitular: true, limites: LIMITES, documentos: COLOMBIA },
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
    expect(pideFechaExpedicion(COLOMBIA.regla('cedula_extranjeria'))).toBe(true)
    expect(pideFechaExpedicion(COLOMBIA.regla('ppt'))).toBe(true)
    expect(pideFechaExpedicion(COLOMBIA.regla('cedula_ciudadania'))).toBe(false)
    expect(pideFechaExpedicion(COLOMBIA.regla('pasaporte'))).toBe(false)
  })

  it('sin ella, una cédula de extranjería no se puede confirmar', () => {
    const ce = { ...BUENA, tipoDocumento: 'cedula_extranjeria' }
    expect(loQueFaltaEnLaFicha(ce, { esTitular: true, limites: LIMITES, documentos: COLOMBIA })).toEqual([
      'la fecha de expedición del documento',
    ])
    expect(
      loQueFaltaEnLaFicha({ ...ce, fechaExpedicion: '2020-05-01' }, { esTitular: true, limites: LIMITES, documentos: COLOMBIA }),
    ).toEqual([])
  })

  it('quién la pide lo dice el país, no una lista escrita aquí', () => {
    // En un país donde la cédula de extranjería no la pide, no hace falta.
    const otroPais = documentosDe([regla({ tipo: 'cedula_extranjeria', etiqueta: 'Cédula de extranjería' })])
    const ce = { ...BUENA, tipoDocumento: 'cedula_extranjeria' }
    expect(loQueFaltaEnLaFicha(ce, { esTitular: true, limites: LIMITES, documentos: otroPais })).toEqual([])
    // Y un número que vale en Colombia no vale con la regla de otro largo.
    const dniDeOcho = regla({ tipo: 'dni', etiqueta: 'DNI', soloCifras: true, largoMinimo: 8, largoMaximo: 8 })
    expect(errorDeDocumento(dniDeOcho, '1234567')).toMatch(/entre 8 y 8/)
    expect(errorDeDocumento(dniDeOcho, '12345678')).toBe('')
  })

  it('una cédula de ciudadanía no la necesita', () => {
    expect(loQueFaltaEnLaFicha(BUENA, { esTitular: true, limites: LIMITES, documentos: COLOMBIA })).toEqual([])
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
    expect(loQueFaltaEnLaFicha(mala, { esTitular: true, limites: LIMITES, documentos: COLOMBIA })).toContain(
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

/*
  Los campos obligatorios viven en la base desde el 29/10/2026
  (`catalogo_opcion`, lista `campos_obligatorios_preregistro`). Aquí, la lista
  tal como se sembró: la misma regla que había escrita.
*/
const SEMBRADA: FilaDeCampoObligatorio[] = Object.entries(CAMPOS_OBLIGATORIOS_DE_RESPALDO).map(
  ([codigo, r]) => ({
    codigo,
    etiqueta: r.etiqueta,
    activo: true,
    extra: { titular: r.titular, acompanante: r.acompanante },
  }),
)
const cambiar = (codigo: string, cambio: Partial<FilaDeCampoObligatorio>) =>
  SEMBRADA.map((f) => (f.codigo === codigo ? { ...f, ...cambio } : f))

/** Una ficha en blanco. */
const EN_BLANCO: DatosDeLaFicha = {
  nombre: '',
  apellidos: '',
  tipoDocumento: '',
  documento: '',
  correo: '',
  telefono: '',
  fechaNacimiento: '',
  nacionalidad: '',
  ciudadResidencia: '',
  ciudadProcedencia: '',
  costo: '',
}

describe('los campos obligatorios salen de la base (29/10/2026)', () => {
  const base = { limites: LIMITES, documentos: COLOMBIA }

  it('con la lista sembrada se pide exactamente lo de antes', () => {
    const obligatorios = camposObligatoriosDe(SEMBRADA)
    for (const esTitular of [true, false]) {
      for (const ficha of [EN_BLANCO, BUENA, { ...BUENA, correo: 'malo', costo: '1,234' }]) {
        expect(loQueFaltaEnLaFicha(ficha, { ...base, esTitular, obligatorios })).toEqual(
          loQueFaltaEnLaFicha(ficha, { ...base, esTitular }),
        )
      }
    }
    expect(loQueFaltaEnLaFicha(EN_BLANCO, { ...base, esTitular: true, obligatorios })).toEqual([
      'tus nombres',
      'tus apellidos',
      'el tipo de documento',
      'el número de identificación',
      'un correo válido',
      'la fecha de nacimiento',
      'la nacionalidad',
      'la ciudad donde vives',
      'la ciudad desde la que viajas',
      'lo que pagaste por la estancia',
    ])
    expect(loQueFaltaEnLaFicha(EN_BLANCO, { ...base, esTitular: false, obligatorios })).toEqual([
      'tus nombres',
      'tus apellidos',
      'el tipo de documento',
      'el número de identificación',
      'la fecha de nacimiento',
      'la nacionalidad',
    ])
  })

  it('apagar la ciudad donde vive para quien reserva deja de exigirla', () => {
    const obligatorios = camposObligatoriosDe(
      cambiar('ciudad_residencia', { extra: { titular: false, acompanante: false } }),
    )
    const sinCiudad = { ...BUENA, ciudadResidencia: '' }
    expect(loQueFaltaEnLaFicha(sinCiudad, { ...base, esTitular: true, obligatorios })).toEqual([])
    // Y sin la lista, se sigue pidiendo.
    expect(loQueFaltaEnLaFicha(sinCiudad, { ...base, esTitular: true })).toEqual([
      'la ciudad donde vives',
    ])
  })

  it('una fila apagada no obliga a nadie', () => {
    const obligatorios = camposObligatoriosDe(cambiar('nacionalidad', { activo: false }))
    expect(
      loQueFaltaEnLaFicha({ ...BUENA, nacionalidad: '' }, { ...base, esTitular: true, obligatorios }),
    ).toEqual([])
  })

  it('lo mal escrito sigue faltando aunque el campo no sea obligatorio', () => {
    const nadaObligatorio = camposObligatoriosDe(
      SEMBRADA.map((f) => ({ ...f, extra: { titular: false, acompanante: false } })),
    )
    const opciones = { ...base, esTitular: true, obligatorios: nadaObligatorio }
    // En blanco ya no falta nada...
    expect(loQueFaltaEnLaFicha(EN_BLANCO, opciones)).toEqual([])
    // ...pero lo escrito mal sí.
    expect(
      loQueFaltaEnLaFicha(
        {
          ...BUENA,
          documento: 'ABC-12',
          correo: 'no-es-correo',
          telefono: '12',
          fechaNacimiento: '1890-01-01',
          costo: '10.555',
        },
        opciones,
      ),
    ).toEqual([
      'el número de identificación',
      'un correo válido',
      'el teléfono',
      'la fecha de nacimiento',
      'lo que pagaste por la estancia',
    ])
    // A un acompañante el correo no se le exige, pero tampoco se le acepta uno malo.
    expect(
      loQueFaltaEnLaFicha(
        { ...BUENA, correo: 'malo' },
        { ...base, esTitular: false, obligatorios: camposObligatoriosDe(SEMBRADA) },
      ),
    ).toEqual(['un correo válido'])
  })

  it('la fecha de expedición mal puesta falta aunque no sea obligatoria', () => {
    const obligatorios = camposObligatoriosDe(cambiar('fecha_expedicion', { activo: false }))
    const ppt = { ...BUENA, tipoDocumento: 'ppt' }
    expect(loQueFaltaEnLaFicha(ppt, { ...base, esTitular: true, obligatorios })).toEqual([])
    expect(
      loQueFaltaEnLaFicha({ ...ppt, fechaExpedicion: '1980-01-01' }, { ...base, esTitular: true, obligatorios }),
    ).toEqual(['la fecha de expedición del documento'])
  })

  it('el aviso usa la etiqueta de la base', () => {
    const obligatorios = camposObligatoriosDe(cambiar('nacionalidad', { etiqueta: 'tu país' }))
    expect(
      loQueFaltaEnLaFicha({ ...BUENA, nacionalidad: '' }, { ...base, esTitular: true, obligatorios }),
    ).toEqual(['tu país'])
  })

  it('con la lista vacía, o sin una fila, se usa el respaldo: nunca se relaja', () => {
    const antes = loQueFaltaEnLaFicha(EN_BLANCO, { ...base, esTitular: true })
    expect(antes).toHaveLength(10)
    expect(
      loQueFaltaEnLaFicha(EN_BLANCO, { ...base, esTitular: true, obligatorios: camposObligatoriosDe([]) }),
    ).toEqual(antes)
    expect(loQueFaltaEnLaFicha(EN_BLANCO, { ...base, esTitular: true, obligatorios: null })).toEqual(antes)
    const sinCosto = camposObligatoriosDe(SEMBRADA.filter((f) => f.codigo !== 'costo'))
    expect(
      loQueFaltaEnLaFicha({ ...BUENA, costo: '' }, { ...base, esTitular: true, obligatorios: sinCosto }),
    ).toEqual(['lo que pagaste por la estancia'])
  })

  it('un extra que no se entiende toma el respaldo, y un código ajeno se ignora', () => {
    const raro = camposObligatoriosDe([
      ...cambiar('correo', { extra: { titular: 'sí' }, etiqueta: '  ' }),
      { codigo: 'telefono', etiqueta: 'el teléfono', activo: true, extra: { titular: true } },
    ])
    expect(raro.get('correo')).toEqual(CAMPOS_OBLIGATORIOS_DE_RESPALDO.correo)
    expect(raro.has('telefono')).toBe(false)
  })
})
