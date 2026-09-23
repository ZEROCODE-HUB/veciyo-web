import { createClient } from '@supabase/supabase-js'

/**
 * Cliente de Supabase para la web pública.
 *
 * Solo la clave anónima, y solo para lo que una persona **sin cuenta** puede
 * consultar: hoy, la invitación que le llegó por correo. Todo lo demás pasa
 * por RLS, que de un anónimo no sabe nada y no le devuelve nada.
 *
 * `consultar_invitacion` responde únicamente a quien presenta el token, y de
 * la invitación solo se guarda su hash: ni con acceso a la tabla se podrían
 * reconstruir enlaces.
 */
const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Sin variables de entorno la web sigue funcionando como maqueta. */
export const hayBackend = Boolean(url && anon)

export const supabase = hayBackend
  ? createClient(url as string, anon as string)
  : null

export interface InvitacionConsultada {
  condominio: string
  unidad: string | null
  rol: string
  correo: string
  nombre: string
  expira_en: string
  vigente: boolean
  vigente_desde: string | null
  vigente_hasta: string | null
}

export async function consultarInvitacion(
  token: string,
): Promise<InvitacionConsultada | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('consultar_invitacion', {
    p_token: token,
  })
  if (error) throw error
  const fila = Array.isArray(data) ? data[0] : data
  return (fila as InvitacionConsultada) ?? null
}

/** Las etiquetas que ve la gente; el enum vive en la base. */
export const ETIQUETA_ROL: Record<string, string> = {
  propietario: 'Propietario',
  inquilino_lider: 'Inquilino líder',
  residente: 'Residente',
  corresidente: 'Corresidente',
  coadministrador: 'Coadministrador',
  huesped_temporal: 'Huésped temporal',
  administrador: 'Administrador',
  guardia: 'Portería',
}

/** `yyyy-MM-dd` → `dd/MM/yyyy`, sin construir un Date que corra el día. */
export function formatearFecha(iso: string | null): string {
  if (!iso) return ''
  const [anio, mes, dia] = iso.slice(0, 10).split('-')
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : ''
}
