import { supabase } from './supabase'

/**
 * A quién escribe alguien que necesita ayuda.
 *
 * El correo y el WhatsApp de soporte viven **en la base**
 * (`configuracion_plataforma`, claves `soporte_correo` y `soporte_whatsapp`):
 * se cambian sin desplegar nada. Decidido con el cliente el 11/10/2026.
 *
 * Mientras los dos estén vacíos no hay contacto, y la web no enseña el enlace:
 * un «Soporte» que no lleva a ningún sitio es lo que había antes.
 */
export interface ContactoDeSoporte {
  correo: string | null
  /** Solo dígitos, con indicativo de país: lo que pide un enlace de WhatsApp. */
  whatsapp: string | null
}

type ClienteSoporte = {
  rpc: (fn: string) => PromiseLike<{ data: unknown; error: unknown }>
}

export async function contactoDeSoporte(
  cliente?: ClienteSoporte | null,
): Promise<ContactoDeSoporte | null> {
  const elegido = cliente ?? (supabase as ClienteSoporte | null)
  if (!elegido) return null
  const { data, error } = await elegido.rpc('contacto_de_soporte')
  if (error) throw error
  const fila = (Array.isArray(data) ? data[0] : data) as
    | Partial<ContactoDeSoporte>
    | undefined
  const correo = fila?.correo || null
  const whatsapp = fila?.whatsapp || null
  return correo || whatsapp ? { correo, whatsapp } : null
}

/**
 * A dónde lleva «Soporte». WhatsApp primero: es por donde escribe un huésped
 * desde el teléfono, que es donde llena su preregistro.
 */
export function enlaceDeSoporte(contacto: ContactoDeSoporte | null): string | null {
  if (contacto?.whatsapp) return `https://wa.me/${contacto.whatsapp}`
  if (contacto?.correo) return `mailto:${contacto.correo}`
  return null
}
