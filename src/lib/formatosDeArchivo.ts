import { useListaDeLaBase } from './listas'

/**
 * Qué archivos acepta cada selector del preregistro (29/10/2026).
 *
 * Manda la lista `archivo_formatos` de la base, la misma que comprueban las
 * funciones que reciben el archivo: `documento_huesped` (la foto del
 * documento) y `autorizacion_menor` (la autorización o tutela de un menor y
 * los documentos adicionales). El administrador de la app la cambia en su
 * panel, dentro de lo que acepta el depósito.
 *
 * Lo de aquí es lo de siempre y solo cuenta hasta que llega la lista.
 */
export type SitioDeArchivo = 'documento_huesped' | 'autorizacion_menor'

const RESPALDO: Record<SitioDeArchivo, string[]> = {
  documento_huesped: ['image/jpeg', 'image/png', 'image/webp'],
  autorizacion_menor: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
}

export function tiposDeLaFila(sitio: SitioDeArchivo, extra: unknown): string[] {
  const tipos = (extra as { tipos_mime?: unknown } | null)?.tipos_mime
  return Array.isArray(tipos) && tipos.length > 0 && tipos.every((t) => typeof t === 'string')
    ? (tipos as string[])
    : RESPALDO[sitio]
}

/** El valor del atributo `accept` de un `<input type="file">`. */
export function useAceptaArchivos(sitio: SitioDeArchivo): string {
  const { opcion } = useListaDeLaBase('archivo_formatos')
  return tiposDeLaFila(sitio, opcion(sitio)?.extra).join(',')
}
