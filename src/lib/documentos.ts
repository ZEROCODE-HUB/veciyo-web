import { supabase } from './supabase'
import type { ClienteParametros } from './parametros'
import type { TipoDocumento } from './precheckin'

/**
 * Los documentos que se piden en el país del edificio, con sus reglas
 * (25/10/2026).
 *
 * Pedido del cliente: «acorde al país de dónde está el edificio debe
 * solicitarse los documentos, y que sea configurable desde el super admin, por
 * país». Viven en `documento_del_pais` y los edita el dueño de la plataforma
 * desde el panel de la app (Más → Países). Hasta hoy la lista y sus reglas
 * --qué documentos son solo cifras, su largo, si tienen reverso, si piden la
 * fecha de expedición-- estaban escritas aquí y en la app, iguales para todos
 * los países.
 *
 * Se leen con `documentos_del_enlace`, que puede llamar el huésped sin sesión:
 * con su enlace, la base sabe de qué edificio es. Una vez por enlace.
 */
export interface ReglaDeDocumento {
  tipo: TipoDocumento
  etiqueta: string
  paraAdultos: boolean
  paraMenores: boolean
  soloCifras: boolean
  largoMinimo: number
  largoMaximo: number
  dosCaras: boolean
  pideFechaExpedicion: boolean
}

export interface Documentos {
  reglas: ReglaDeDocumento[]
  /** La regla de ese tipo en este país, o `null` si no se pide aquí. */
  regla: (tipo: string | null | undefined) => ReglaDeDocumento | null
  /** Las opciones de un selector, para un adulto o para un menor. */
  ofrecidos: (para?: 'adultos' | 'menores') => { value: TipoDocumento; label: string }[]
}

export function documentosDe(reglas: ReglaDeDocumento[]): Documentos {
  return {
    reglas,
    regla: (tipo) => reglas.find((r) => r.tipo === tipo) ?? null,
    ofrecidos: (para = 'adultos') =>
      reglas
        .filter((r) => (para === 'menores' ? r.paraMenores : r.paraAdultos))
        .map((r) => ({ value: r.tipo, label: r.etiqueta })),
  }
}

interface Fila {
  tipo: TipoDocumento
  etiqueta: string
  para_adultos: boolean
  para_menores: boolean
  solo_cifras: boolean
  largo_minimo: number
  largo_maximo: number
  dos_caras: boolean
  pide_fecha_expedicion: boolean
}

async function cargar(cliente: ClienteParametros, token: string): Promise<Documentos> {
  const { data, error } = await cliente.rpc('documentos_del_enlace', { p_token: token })
  if (error) throw error
  const filas = (data ?? []) as Fila[]
  if (filas.length === 0) throw new Error('Este enlace ya no vale o no tiene documentos configurados')
  return documentosDe(
    filas.map((f) => ({
      tipo: f.tipo,
      etiqueta: f.etiqueta,
      paraAdultos: f.para_adultos,
      paraMenores: f.para_menores,
      soloCifras: f.solo_cifras,
      largoMinimo: f.largo_minimo,
      largoMaximo: f.largo_maximo,
      dosCaras: f.dos_caras,
      pideFechaExpedicion: f.pide_fecha_expedicion,
    })),
  )
}

const guardados = new Map<string, Promise<Documentos>>()

/** Los documentos del edificio de ese enlace. Por defecto, con el cliente de la web. */
export function documentosDelEnlace(
  token: string,
  cliente?: ClienteParametros | null,
): Promise<Documentos> {
  const elegido = cliente ?? (supabase as ClienteParametros | null)
  if (!elegido) return Promise.reject(new Error('Sin conexión con el servidor'))

  let promesa = guardados.get(token)
  if (!promesa) {
    promesa = cargar(elegido, token)
    guardados.set(token, promesa)
    // Si falla no se queda guardado el fallo: la siguiente pantalla reintenta.
    promesa.catch(() => guardados.delete(token))
  }
  return promesa
}
