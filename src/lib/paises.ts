/**
 * Los países, con su prefijo telefónico.
 *
 * Gemela de `veci-yo/src/shared/constants/paises.ts`. Es la única duplicación
 * que este flujo tiene, y es deliberada: los dos proyectos no comparten módulos
 * —la aplicación es React Native y esto es React web— y traer el otro aquí
 * arrastraría media librería de componentes.
 *
 * Lo que **sí** está compartido es lo que importa: el formato en que se guarda.
 * Las dos escriben el código ISO de dos letras en la misma columna, y la base
 * lo exige con un `check`. Si una lista añade un país y la otra no, lo único
 * que pasa es que ese país no se ofrece en una de las dos pantallas; no hay
 * forma de que escriban cosas distintas.
 */
export interface Pais {
  codigo: string
  nombre: string
  /** Prefijo telefónico internacional, sin el `+`. */
  prefijo: string
}

export const PAISES: Pais[] = [
  { codigo: 'CO', nombre: 'Colombia', prefijo: '57' },
  { codigo: 'PE', nombre: 'Perú', prefijo: '51' },
  { codigo: 'AR', nombre: 'Argentina', prefijo: '54' },
  { codigo: 'BO', nombre: 'Bolivia', prefijo: '591' },
  { codigo: 'BR', nombre: 'Brasil', prefijo: '55' },
  { codigo: 'CA', nombre: 'Canadá', prefijo: '1' },
  { codigo: 'CL', nombre: 'Chile', prefijo: '56' },
  { codigo: 'CR', nombre: 'Costa Rica', prefijo: '506' },
  { codigo: 'CU', nombre: 'Cuba', prefijo: '53' },
  { codigo: 'EC', nombre: 'Ecuador', prefijo: '593' },
  { codigo: 'SV', nombre: 'El Salvador', prefijo: '503' },
  { codigo: 'ES', nombre: 'España', prefijo: '34' },
  { codigo: 'US', nombre: 'Estados Unidos', prefijo: '1' },
  { codigo: 'FR', nombre: 'Francia', prefijo: '33' },
  { codigo: 'GT', nombre: 'Guatemala', prefijo: '502' },
  { codigo: 'HN', nombre: 'Honduras', prefijo: '504' },
  { codigo: 'IT', nombre: 'Italia', prefijo: '39' },
  { codigo: 'MX', nombre: 'México', prefijo: '52' },
  { codigo: 'NI', nombre: 'Nicaragua', prefijo: '505' },
  { codigo: 'PA', nombre: 'Panamá', prefijo: '507' },
  { codigo: 'PY', nombre: 'Paraguay', prefijo: '595' },
  { codigo: 'PT', nombre: 'Portugal', prefijo: '351' },
  { codigo: 'PR', nombre: 'Puerto Rico', prefijo: '1' },
  { codigo: 'DO', nombre: 'República Dominicana', prefijo: '1' },
  { codigo: 'GB', nombre: 'Reino Unido', prefijo: '44' },
  { codigo: 'DE', nombre: 'Alemania', prefijo: '49' },
  { codigo: 'UY', nombre: 'Uruguay', prefijo: '598' },
  { codigo: 'VE', nombre: 'Venezuela', prefijo: '58' },
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
