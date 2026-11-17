import { parametrosPublicos } from './parametros'

/**
 * Abrir la app instalada, o la tienda si no está (13/11/2026 y 16/11/2026).
 *
 * La app web (`veciyo-app.vercel.app`) **no es un destino**: es una demo que
 * se va a eliminar (cliente, 16/11/2026: «no habrá versión web»). Quien no
 * tiene la app instalada va a la tienda de su celular; en una computadora no
 * se redirige a ningún sitio y la página enseña los botones de las tiendas.
 */
export function sistema(): 'ios' | 'android' | 'otro' {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'otro'
}

/**
 * La tienda de este celular, de los parámetros de la base
 * (`tienda_app_store_url`, `tienda_google_play_url`). Nulo en una
 * computadora o si el enlace no está puesto.
 */
export async function tiendaDeEsteCelular(): Promise<string | null> {
  const cual = sistema()
  if (cual === 'otro') return null
  try {
    const p = await parametrosPublicos()
    const url = p
      .texto(cual === 'ios' ? 'tienda_app_store_url' : 'tienda_google_play_url')
      .trim()
    return /^https:\/\//.test(url) ? url : null
  } catch {
    return null
  }
}

/**
 * Intenta abrir `enlaceDeLaApp` (`veciyo://…`). Si en un momento la página
 * sigue a la vista --no la tiene, o el navegador no dejó abrirla--, va a
 * `siNoAbre`, si hay.
 */
export function abrirLaApp(enlaceDeLaApp: string, siNoAbre: string | null) {
  window.location.href = enlaceDeLaApp
  if (!siNoAbre) return
  window.setTimeout(() => {
    if (document.visibilityState !== 'hidden') window.location.href = siNoAbre
  }, 1500)
}
