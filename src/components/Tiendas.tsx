/**
 * Los botones de App Store y Google Play.
 *
 * Los enlaces son **provisionales**: la aplicación todavía no está publicada
 * (REVISAR-A-OJO 200). Se enseñan cuando el huésped decidió crear su cuenta,
 * que es cuando le sirven (16/10/2026).
 */
const TIENDAS = [
  {
    nombre: 'App Store',
    href: 'https://apps.apple.com/app/veciyo/id0000000000',
    imagen: '/tiendas/app-store.png',
  },
  {
    nombre: 'Google Play',
    href: 'https://play.google.com/store/apps/details?id=com.veciyo.app',
    imagen: '/tiendas/google-play.webp',
  },
]

export default function Tiendas() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {TIENDAS.map((t) => (
        <a
          key={t.nombre}
          href={t.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Descargar en ${t.nombre}`}
        >
          <img src={t.imagen} alt={`Descargar en ${t.nombre}`} className="h-11 w-auto" />
        </a>
      ))}
    </div>
  )
}
