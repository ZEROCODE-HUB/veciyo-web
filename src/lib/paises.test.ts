import { describe, expect, it } from 'vitest'
import { PAISES, buscarPaises, paisPorCodigo } from './paises'

/**
 * Los países del teléfono y de la nacionalidad (26/10/2026): todos, no una
 * lista corta, y con un buscador que encuentra lo que se teclea en un móvil.
 */
describe('la lista de países', () => {
  it('están todos, no los veintiocho que había a mano', () => {
    expect(PAISES.length).toBeGreaterThan(240)
    expect(paisPorCodigo('JP')).toEqual({ codigo: 'JP', nombre: 'Japón', prefijo: '81' })
  })

  it('Colombia y Perú van primero, y el resto por orden alfabético', () => {
    expect(PAISES.slice(0, 2).map((p) => p.codigo)).toEqual(['CO', 'PE'])
    const resto = PAISES.slice(2).map((p) => p.nombre)
    expect(resto).toEqual([...resto].sort((a, b) => a.localeCompare(b, 'es')))
  })

  it('no tiene códigos repetidos y todos son ISO de dos letras', () => {
    const codigos = PAISES.map((p) => p.codigo)
    expect(new Set(codigos).size).toBe(codigos.length)
    for (const c of codigos) expect(c).toMatch(/^[A-Z]{2}$/)
  })
})

describe('buscar un país', () => {
  it('por nombre, sin acentos y sin mayúsculas', () => {
    expect(buscarPaises('japon').map((p) => p.codigo)).toEqual(['JP'])
    expect(buscarPaises('PERU').map((p) => p.codigo)).toContain('PE')
  })

  it('por prefijo, con o sin el más', () => {
    expect(buscarPaises('+81').map((p) => p.codigo)).toContain('JP')
    expect(buscarPaises('51').map((p) => p.codigo)).toContain('PE')
  })

  it('el prefijo cuenta por su principio: «81» es Japón, no Serbia (+381)', () => {
    expect(buscarPaises('81').map((p) => p.codigo)).toEqual(['JP'])
  })

  it('por código', () => {
    expect(buscarPaises('kr').map((p) => p.codigo)).toContain('KR')
  })

  it('sin texto devuelve todos, y lo que no existe no devuelve nada', () => {
    expect(buscarPaises('  ')).toHaveLength(PAISES.length)
    expect(buscarPaises('zzzz')).toEqual([])
  })
})
