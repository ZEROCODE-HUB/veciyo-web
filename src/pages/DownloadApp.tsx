import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Card from '../components/Card'
import Button from '../components/Button'
import { olvidarToken } from '../lib/precheckin'

/**
 * El final del preregistro: aquí nace el acceso del huésped a la aplicación.
 *
 * La pantalla decía «pendiente de aceptación por parte del anfitrión», con un
 * girador al lado, y eso no es lo que pasa: el preregistro queda **cerrado**,
 * y lo que el anfitrión aprueba después --si hace falta-- son los términos de
 * un menor o una verificación con hallazgos. Dejar a alguien mirando un
 * girador que no espera nada es peor que no decir nada.
 *
 * Mientras el envío de correo esté apagado, el acceso se muestra aquí para
 * poder copiarlo. Cuando se encienda, llegará al buzón del huésped y esta
 * pantalla solo lo dirá.
 */
export default function DownloadApp() {
  const location = useLocation()
  const acceso = (location.state as { acceso?: string } | null)?.acceso ?? null
  const [copiado, setCopiado] = useState(false)

  const copiar = async () => {
    if (!acceso) return
    try {
      await navigator.clipboard.writeText(acceso)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Sin permiso de portapapeles el enlace sigue estando a la vista y se
      // puede seleccionar a mano.
    }
  }

  // El token de preregistro ya no sirve para nada: se suelta para que no se
  // quede vivo en la pestaña.
  if (acceso) olvidarToken()

  return (
    <MainLayout header="default" bg="page" center>
      <div className="w-full px-4 py-10 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-[640px] px-6 py-10 text-center sm:px-12 sm:py-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
            ✓
          </div>

          <h1 className="mt-6 font-display text-3xl font-extrabold text-ink sm:text-[34px]">
            Tu preregistro está completo
          </h1>

          <p className="mx-auto mt-4 max-w-md text-base text-ink/70">
            La portería ya te espera con tus datos cargados. El día de tu
            entrada vas a ver aquí la clave del wifi y el código de la puerta.
          </p>

          {acceso && (
            <div className="mt-8 rounded-2xl border border-line bg-surface-soft px-5 py-5 text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/60">
                Tu acceso a la aplicación
              </p>
              <p className="mt-2 break-all font-mono text-xs text-ink">
                {acceso}
              </p>
              <Button
                type="button"
                variant="ghost"
                className="mt-4 w-full py-3"
                onClick={copiar}
              >
                {copiado ? '✓ Copiado' : 'Copiar enlace'}
              </Button>
              <p className="mt-3 text-xs text-ink/60">
                Guárdalo: por seguridad no se puede volver a mostrar. Con él
                creas tu cuenta, y caduca cuando termina tu estadía.
              </p>
            </div>
          )}

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block transition-transform hover:scale-105"
            >
              <img
                src="/assets/appstore.png"
                alt="Descargar en App Store"
                className="h-12 w-auto"
              />
            </a>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block transition-transform hover:scale-105"
            >
              <img
                src="/assets/Google_Play_Store_badge_EN.svg.webp"
                alt="Descargar en Google Play"
                className="h-12 w-auto"
              />
            </a>
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}
