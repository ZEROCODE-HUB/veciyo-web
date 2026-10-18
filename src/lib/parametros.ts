import { supabase } from './supabase'

/**
 * Los valores de negocio que viven en la base, leídos desde la web.
 *
 * Decisión del cliente (18/10/2026): ningún valor de negocio escrito en el
 * código. El largo mínimo de la contraseña, el del teléfono, el año de
 * nacimiento más antiguo, el tope de un archivo o el nombre provisional del
 * titular están en `configuracion_plataforma` y se cambian desde el panel de
 * Supabase sin desplegar la web.
 *
 * Se leen con `parametros_publicos`, que la puede llamar cualquiera --también
 * el huésped, que no tiene sesión-- y solo devuelve los marcados como
 * públicos. **Una vez** por cliente: se guarda la promesa y la comparten todas
 * las pantallas.
 *
 * **No hay valor de respaldo.** Si la clave no está, `numero` y `texto`
 * lanzan: un número escrito aquí «por si acaso» es justo lo que se quiere
 * quitar, y si un día difiere del de la base nadie se entera.
 */
export interface Parametros {
  numero: (clave: string) => number
  texto: (clave: string) => string
}

/**
 * Lo único que hace falta de un cliente: llamar a una función. Igual que en
 * `precheckin.ts`, para que los recorridos de la aplicación puedan pasar el
 * suyo aunque traigan otra copia del SDK.
 */
export interface ClienteParametros {
  rpc: (
    nombre: string,
    argumentos?: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>
}

async function cargar(cliente: ClienteParametros): Promise<Parametros> {
  const { data, error } = await cliente.rpc('parametros_publicos')
  if (error) throw error
  const valores = new Map<string, string>()
  for (const fila of (data ?? []) as Array<{ clave: string; valor: string | null }>) {
    if (fila.valor !== null) valores.set(fila.clave, fila.valor)
  }

  const texto = (clave: string): string => {
    const valor = valores.get(clave)
    if (valor === undefined) {
      throw new Error(`Falta el parámetro "${clave}" (o no es público)`)
    }
    return valor
  }
  const numero = (clave: string): number => {
    const crudo = texto(clave)
    const n = Number(crudo.trim())
    if (crudo.trim() === '' || !Number.isFinite(n)) {
      throw new Error(`El parámetro "${clave}" no es un número: "${crudo}"`)
    }
    return n
  }
  return { numero, texto }
}

const guardados = new WeakMap<object, Promise<Parametros>>()

/** Los parámetros públicos. Por defecto, con el cliente de la web. */
export function parametrosPublicos(
  cliente?: ClienteParametros | null,
): Promise<Parametros> {
  const elegido = cliente ?? (supabase as ClienteParametros | null)
  if (!elegido) return Promise.reject(new Error('Sin conexión con el servidor'))

  let promesa = guardados.get(elegido)
  if (!promesa) {
    promesa = cargar(elegido)
    guardados.set(elegido, promesa)
    // Si falla no se queda guardado el fallo: la siguiente pantalla reintenta.
    promesa.catch(() => guardados.delete(elegido))
  }
  return promesa
}

/** Megabytes a bytes, para el tope de un archivo. */
export const megabytesABytes = (mb: number) => mb * 1024 * 1024
