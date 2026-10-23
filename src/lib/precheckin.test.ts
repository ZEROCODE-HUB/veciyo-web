import { describe, expect, it } from 'vitest'
import {
  esNombreDeRelleno,
  normalizarPlaca,
  subirLoElegido,
  avisoDeLoQueNoSubio,
  textoDeLaCuentaAtras,
  avisoDeLlegada,
  topeDePersonas,
  maximoDeHuespedes,
  type EstanciaPrecheckin,
} from './precheckin'

/**
 * Las dos reglas que el cliente encontró rotas el 09/10/2026 abriendo su
 * propio enlace de reserva.
 */

const estancia = (
  previstos: number | null,
  aforo: number | null,
): EstanciaPrecheckin => ({
  visita_id: 'v1',
  condominio: 'Las Barranqueras 246',
  unidad: '102',
  anfitrion: 'Sofía',
  fecha_desde: '2026-10-20',
  fecha_hasta: '2026-10-24',
  max_huespedes: aforo,
  huespedes_previstos: previstos,
  menores_previstos: null,
  personas_ya: 1,
  vigente: true,
  completado: false,
})

/*
  El nombre provisional es el parámetro `titular_provisional_nombre` de la base;
  la función lo recibe. Aquí va su valor actual, que es lo que escribe la
  aplicación hoy.
*/
const NOMBRE_SIN_CONFIRMAR = 'Huésped por confirmar'

describe('el nombre que pone el sistema', () => {
  it('se reconoce como relleno, no como el nombre de nadie', () => {
    // «en el nombre del huésped por defecto sale: Huésped por confirmar».
    expect(esNombreDeRelleno(NOMBRE_SIN_CONFIRMAR, NOMBRE_SIN_CONFIRMAR)).toBe(true)
  })

  it('también con el código de la reserva detrás', () => {
    /*
      Lo que escribe la lectura del calendario de Airbnb. Comparar por
      igualdad dejaría pasar justo las reservas que **nunca** traen nombre.
    */
    expect(
      esNombreDeRelleno('Huésped por confirmar (HMABC123)', NOMBRE_SIN_CONFIRMAR),
    ).toBe(true)
  })

  it('y un nombre de verdad no se toca', () => {
    // El control positivo: sin él, devolver siempre `true` borraría el nombre
    // que el anfitrión sí escribió.
    expect(esNombreDeRelleno('Óscar Pérez', NOMBRE_SIN_CONFIRMAR)).toBe(false)
    expect(esNombreDeRelleno('', NOMBRE_SIN_CONFIRMAR)).toBe(false)
  })

  it('si el parámetro cambia, se reconoce el nuevo y no el viejo', () => {
    // Lo que justifica leerlo de la base: el viejo ya no es relleno.
    expect(esNombreDeRelleno('Por confirmar (HM1)', 'Por confirmar')).toBe(true)
    expect(esNombreDeRelleno(NOMBRE_SIN_CONFIRMAR, 'Por confirmar')).toBe(false)
  })
})

describe('cuántas personas caben', () => {
  it('manda lo que reservó el anfitrión cuando es más estricto', () => {
    // El caso del cliente: reserva para 1, alojamiento para 4. Hasta hoy solo
    // se miraba el 4, así que entraban tres personas de más.
    expect(topeDePersonas(estancia(1, 4))).toEqual({
      tope: 1,
      esDeLaReserva: true,
    })
  })

  it('y el aforo cuando el aforo es más estricto', () => {
    expect(topeDePersonas(estancia(8, 4))).toEqual({
      tope: 4,
      esDeLaReserva: false,
    })
  })

  it('con empate se dice que es el de la reserva', () => {
    // Es el que el anfitrión puede ampliar en un momento; el aforo del piso
    // es otra conversación. A quién pedirle sitio depende de esto.
    expect(topeDePersonas(estancia(4, 4))).toEqual({
      tope: 4,
      esDeLaReserva: true,
    })
  })

  it('sin lo previsto manda el aforo, como hasta hoy', () => {
    // Las reservas anteriores al 09/10/2026 y las que entran por el
    // calendario de Airbnb no traen el dato.
    expect(topeDePersonas(estancia(null, 4))).toEqual({
      tope: 4,
      esDeLaReserva: false,
    })
  })

  it('sin aforo manda lo previsto', () => {
    expect(topeDePersonas(estancia(3, null))).toEqual({
      tope: 3,
      esDeLaReserva: true,
    })
  })

  it('sin ninguno de los dos no hay tope, y se dice', () => {
    // `null` y no cero: no saber el límite no es que no quepa nadie.
    expect(topeDePersonas(estancia(null, null))).toEqual({
      tope: null,
      esDeLaReserva: false,
    })
    expect(topeDePersonas(null)).toEqual({ tope: null, esDeLaReserva: false })
  })
})

describe('normalizarPlaca', () => {
  it('deja la placa como la busca la porteria', () => {
    expect(normalizarPlaca('abc-123')).toBe('ABC123')
    expect(normalizarPlaca(' ABC 123 ')).toBe('ABC123')
    expect(normalizarPlaca('kxz·98f')).toBe('KXZ98F')
  })

  it('lo que no tiene ni una letra ni un numero queda vacio', () => {
    // Es lo que deja apagado el boton de guardar: «- -» no es una placa.
    expect(normalizarPlaca(' - - ')).toBe('')
  })
})

describe('la cuenta atrás (14/10/2026)', () => {
  it('dice cuántos días faltan, y mañana y hoy con palabras', () => {
    expect(textoDeLaCuentaAtras(3)).toBe('Tu ingreso es en 3 días')
    expect(textoDeLaCuentaAtras(1)).toBe('Tu ingreso es mañana')
    expect(textoDeLaCuentaAtras(0)).toBe('Tu ingreso es hoy')
  })
})

describe('lo elegido en el formulario de alta', () => {
  const archivo = (n: string) => new File(['x'], n)

  it('sube la foto y la autorización a la persona recién creada', async () => {
    const hechos: string[] = []
    const fallos = await subirLoElegido(
      't',
      'p1',
      { documento: archivo('doc.jpg'), autorizacion: archivo('aut.pdf') },
      {
        documento: async (_t, f, _c, id) => void hechos.push(`${f.name}>${id}`),
        autorizacion: async (_t, id, f) => void hechos.push(`${f.name}>${id}`),
      },
    )
    expect(hechos).toEqual(['doc.jpg>p1', 'aut.pdf>p1'])
    expect(fallos).toEqual([])
    expect(avisoDeLoQueNoSubio(fallos)).toBeNull()
  })

  it('si una no sube, la otra sí, y se dice cuál faltó', async () => {
    const fallos = await subirLoElegido(
      't',
      'p1',
      { documento: archivo('doc.jpg'), autorizacion: archivo('aut.pdf') },
      {
        documento: async () => {
          throw new Error('caído')
        },
        autorizacion: async () => {},
      },
    )
    expect(fallos).toEqual(['la foto de su documento'])
    expect(avisoDeLoQueNoSubio(fallos)).toMatch(/añadimos.*foto de su documento.*ficha/)
  })

  it('sin nada elegido no sube nada', async () => {
    let llamadas = 0
    const contar = async () => void llamadas++
    await subirLoElegido('t', 'p1', {}, { documento: contar, autorizacion: contar })
    expect(llamadas).toBe(0)
  })
})

describe('la etiqueta de llegada', () => {
  it('cuenta los días mientras falta', () => {
    expect(avisoDeLlegada('proxima', 3)).toBe('Tu ingreso es en 3 días')
  })
  it('con la llegada hoy, la reserva está en curso y lo dice', () => {
    expect(avisoDeLlegada('en_curso', 0)).toBe('Tu ingreso es hoy')
  })
  it('terminada o cancelada no lleva etiqueta: eso lo dice la página', () => {
    expect(avisoDeLlegada('terminada', 0)).toBeNull()
    expect(avisoDeLlegada('cancelada', 0)).toBeNull()
  })
})

describe('el máximo entre paréntesis junto a «Cantidad de huéspedes»', () => {
  const base = { max_huespedes: null, max_huespedes_edificio: null } as unknown as EstanciaPrecheckin
  it('manda el del anfitrión', () => {
    expect(maximoDeHuespedes({ ...base, max_huespedes: 4, max_huespedes_edificio: 6 })).toBe(4)
  })
  it('sin el del anfitrión, el del edificio', () => {
    expect(maximoDeHuespedes({ ...base, max_huespedes_edificio: 6 })).toBe(6)
  })
  it('sin ninguno, nada', () => {
    expect(maximoDeHuespedes(base)).toBeNull()
  })
})
