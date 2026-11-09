/**
 * Todas las monedas del mundo en uso (ISO 4217), para lo que pagó el huésped
 * (09/11/2026, Correcciones fila 15: «en monedas debería salir cualquier
 * moneda del mundo»).
 *
 * Hasta hoy el selector ofrecía solo las de los países activos de la base, y
 * desde el 28/10/2026 eso eran tres (COP, PEN, USD): las que el edificio puede
 * usar para cobrar. Lo que pagó un huésped extranjero por su reserva puede
 * estar en cualquier moneda. La base ya guarda cualquier código de tres
 * letras (`visita.moneda_costo`).
 *
 * Los nombres los da el propio navegador en español (`Intl.DisplayNames`).
 * Las monedas retiradas (la peseta, el marco) no están: solo las vigentes.
 */
export const MONEDAS_DEL_MUNDO: readonly string[] = [
  'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN',
  'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BRL',
  'BSD', 'BTN', 'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHF', 'CLP', 'CNY',
  'COP', 'CRC', 'CUP', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EGP',
  'ERN', 'ETB', 'EUR', 'FJD', 'FKP', 'GBP', 'GEL', 'GHS', 'GIP', 'GMD',
  'GNF', 'GTQ', 'GYD', 'HKD', 'HNL', 'HTG', 'HUF', 'IDR', 'ILS', 'INR',
  'IQD', 'IRR', 'ISK', 'JMD', 'JOD', 'JPY', 'KES', 'KGS', 'KHR', 'KMF',
  'KPW', 'KRW', 'KWD', 'KYD', 'KZT', 'LAK', 'LBP', 'LKR', 'LRD', 'LSL',
  'LYD', 'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MNT', 'MOP', 'MRU', 'MUR',
  'MVR', 'MWK', 'MXN', 'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NPR',
  'NZD', 'OMR', 'PAB', 'PEN', 'PGK', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR',
  'RON', 'RSD', 'RUB', 'RWF', 'SAR', 'SBD', 'SCR', 'SDG', 'SEK', 'SGD',
  'SHP', 'SLE', 'SOS', 'SRD', 'SSP', 'STN', 'SYP', 'SZL', 'THB', 'TJS',
  'TMT', 'TND', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS', 'UAH', 'UGX', 'USD',
  'UYU', 'UZS', 'VES', 'VND', 'VUV', 'WST', 'XAF', 'XCD', 'XOF', 'XPF',
  'YER', 'ZAR', 'ZMW', 'ZWL',
]

/** Las que más se usan aquí, arriba de la lista. */
export const MONEDAS_PRIMERO: readonly string[] = ['COP', 'PEN', 'USD']

let nombres: Intl.DisplayNames | null | undefined

/** «Peso colombiano» para «COP»; si el navegador no sabe, el código. */
export function nombreDeLaMoneda(codigo: string): string {
  if (nombres === undefined) {
    try {
      nombres = new Intl.DisplayNames(['es'], { type: 'currency' })
    } catch {
      nombres = null
    }
  }
  const nombre = nombres?.of(codigo)
  if (!nombre || nombre === codigo) return codigo
  return nombre.charAt(0).toUpperCase() + nombre.slice(1)
}

export interface MonedaDelMundo {
  codigo: string
  nombre: string
  /** Los países de la base que la usan, para poder buscarla por país. */
  paises: string[]
}

/** La lista entera, con las de aquí primero y el resto por nombre. */
export function monedasDelMundo(paisesPorMoneda: Map<string, string[]> = new Map()): MonedaDelMundo[] {
  const todas = MONEDAS_DEL_MUNDO.map((codigo) => ({
    codigo,
    nombre: nombreDeLaMoneda(codigo),
    paises: paisesPorMoneda.get(codigo) ?? [],
  }))
  const primero = MONEDAS_PRIMERO.map((c) => todas.find((m) => m.codigo === c)).filter(
    (m): m is MonedaDelMundo => Boolean(m),
  )
  const resto = todas
    .filter((m) => !MONEDAS_PRIMERO.includes(m.codigo))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  return [...primero, ...resto]
}
