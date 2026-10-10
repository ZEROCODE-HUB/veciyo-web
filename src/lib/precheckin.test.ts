import { describe, expect, it } from 'vitest'
import {
  esNombreDeRelleno,
  NOMBRE_SIN_CONFIRMAR,
  normalizarPlaca,
  topeDePersonas,
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

describe('el nombre que pone el sistema', () => {
  it('se reconoce como relleno, no como el nombre de nadie', () => {
    // «en el nombre del huésped por defecto sale: Huésped por confirmar».
    expect(esNombreDeRelleno(NOMBRE_SIN_CONFIRMAR)).toBe(true)
  })

  it('también con el código de la reserva detrás', () => {
    /*
      Lo que escribe la lectura del calendario de Airbnb. Comparar por
      igualdad dejaría pasar justo las reservas que **nunca** traen nombre.
    */
    expect(esNombreDeRelleno('Huésped por confirmar (HMABC123)')).toBe(true)
  })

  it('y un nombre de verdad no se toca', () => {
    // El control positivo: sin él, devolver siempre `true` borraría el nombre
    // que el anfitrión sí escribió.
    expect(esNombreDeRelleno('Óscar Pérez')).toBe(false)
    expect(esNombreDeRelleno('')).toBe(false)
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
