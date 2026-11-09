import { describe, expect, it } from 'vitest'
import { MONEDAS_DEL_MUNDO, monedasDelMundo, nombreDeLaMoneda } from './monedasDelMundo'

describe('las monedas del mundo (Correcciones fila 15)', () => {
  it('trae más de 150, sin repetir y con códigos de tres letras', () => {
    expect(MONEDAS_DEL_MUNDO.length).toBeGreaterThan(150)
    expect(new Set(MONEDAS_DEL_MUNDO).size).toBe(MONEDAS_DEL_MUNDO.length)
    expect(MONEDAS_DEL_MUNDO.every((c) => /^[A-Z]{3}$/.test(c))).toBe(true)
  })

  it('las de aquí primero, y el euro y el yen también están', () => {
    const lista = monedasDelMundo()
    expect(lista.slice(0, 3).map((m) => m.codigo)).toEqual(['COP', 'PEN', 'USD'])
    expect(lista.map((m) => m.codigo)).toEqual(expect.arrayContaining(['EUR', 'JPY', 'BRL', 'MXN']))
  })

  it('con su nombre en español', () => {
    expect(nombreDeLaMoneda('EUR')).toBe('Euro')
    expect(nombreDeLaMoneda('COP')).toMatch(/peso colombiano/i)
  })

  it('se puede buscar por país si la base lo sabe', () => {
    const lista = monedasDelMundo(new Map([['COP', ['Colombia']]]))
    expect(lista.find((m) => m.codigo === 'COP')?.paises).toEqual(['Colombia'])
  })
})
