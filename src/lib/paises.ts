import { PAISES_DEL_MUNDO } from './paises.generado'

/**
 * Los países, con su prefijo telefónico: los del teléfono y los de la
 * nacionalidad.
 *
 * Desde el 26/10/2026 son **todos**: los 245 países y territorios con
 * numeración propia, en `paises.generado.ts`, que escribe
 * `veci-yo/scripts/generar-paises.mjs` a la vez para la app y para esta web
 * (base pública de teléfonos de Google, nombres en español de Unicode). Antes
 * había veintiocho a mano para el teléfono y otra lista de ciento noventa y
 * siete para la nacionalidad, y faltaban países.
 *
 * Lo que se guarda es el código ISO de dos letras, y la base lo exige con un
 * `check`.
 */
export interface Pais {
  codigo: string
  nombre: string
  /** Prefijo telefónico internacional, sin el `+`. */
  prefijo: string
}

const PRIMEROS = ['CO', 'PE']

/** Colombia y Perú primero, que es donde opera Veciyo; después, por orden alfabético. */
export const PAISES: Pais[] = [
  ...PRIMEROS.map((codigo) => PAISES_DEL_MUNDO.find((p) => p.codigo === codigo)!),
  ...PAISES_DEL_MUNDO.filter((p) => !PRIMEROS.includes(p.codigo)),
]

/**
 * El país por defecto del preregistro.
 *
 * Colombia porque es donde está el edificio, no porque lo sea el huésped: lo
 * normal es que el número sea de otro sitio, y por eso el selector está a la
 * vista y no escondido.
 */
export const PAIS_POR_DEFECTO = 'CO'

export function paisPorCodigo(codigo: string | null | undefined): Pais | null {
  if (!codigo) return null
  return PAISES.find((p) => p.codigo === codigo.toUpperCase()) ?? null
}

const sinAcentos = (texto: string) =>
  texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/**
 * Busca por nombre (con o sin acentos), por código o por prefijo: quien sabe
 * que su número empieza por 81 y no cómo se escribe su país lo encuentra igual.
 */
export function buscarPaises(texto: string): Pais[] {
  const q = sinAcentos(texto.trim())
  if (!q) return PAISES
  const cifras = q.replace(/^\+/, '')
  return PAISES.filter(
    (p) =>
      sinAcentos(p.nombre).includes(q) ||
      p.codigo.toLowerCase() === q ||
      (/^\d+$/.test(cifras) && p.prefijo.startsWith(cifras)),
  )
}
