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
 *
 * El 02/10/2026 el cliente pidió tres cosas más para esta pantalla, y las tres
 * son lo último que lee el huésped antes de aparecer en la puerta:
 *
 *   · que lleve sus documentos **en físico**;
 *   · que quien se presente sea **la misma persona** que hizo el preregistro
 *     --y eso no es un consejo: desde el 02/10 la base lo impone, y si el
 *     número no coincide la portería no le deja entrar. Avisarlo aquí es lo
 *     mínimo, porque quien lo va a sufrir todavía puede corregirlo--;
 *   · y qué gana creando su cuenta, que hasta ahora no decía en ninguna parte.
 */

/** Lo que de verdad hay al otro lado de la cuenta. Nada de esto es promesa. */
const LO_QUE_GANA = [
  {
    icono: '🔑',
    texto: 'La clave del wifi y el código de la puerta, el día que llegas.',
  },
  {
    icono: '💬',
    texto: 'Hablar con portería sin bajar ni llamar por teléfono.',
  },
  {
    icono: '🏊',
    texto: 'Reservar las zonas comunes que el edificio deje usar a huéspedes.',
  },
  {
    icono: '👋',
    texto: 'Anunciar tus propias visitas para que las dejen pasar.',
  },
  {
    icono: '📦',
    texto: 'Enterarte si llega un paquete a tu nombre.',
  },
]

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
        <Card className="mx-auto max-w-[640px] px-6 py-10 sm:px-12 sm:py-12">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
              ✓
            </div>

            <h1 className="mt-6 font-display text-3xl font-extrabold text-ink sm:text-[34px]">
              Tu preregistro está completo
            </h1>

            <p className="mx-auto mt-4 max-w-md text-base text-ink/70">
              La portería ya te espera con tus datos cargados.
            </p>
          </div>

          {/*
            Lo primero después del «listo», y no al final: es lo único de esta
            pantalla que puede impedirle entrar al edificio.
          */}
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-5">
            <p className="text-sm font-bold text-amber-900">
              Antes de venir, dos cosas
            </p>
            <ul className="mt-3 space-y-3 text-sm text-amber-900/90">
              <li className="flex gap-3">
                <span aria-hidden="true">📄</span>
                <span>
                  <strong>Trae tus documentos físicos.</strong> La portería los
                  compara con lo que acabas de registrar, uno por uno, incluidos
                  los de quienes vienen contigo.
                </span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden="true">🙋</span>
                <span>
                  <strong>
                    Quien se presente tiene que ser quien se registró.
                  </strong>{' '}
                  Si el número del documento no coincide con el que pusiste, la
                  portería no puede dejar pasar a esa persona. Si algo quedó mal
                  escrito, dilo ahora a tu anfitrión.
                </span>
              </li>
            </ul>
          </div>

          {acceso && (
            <div className="mt-6 rounded-2xl border border-line bg-surface-soft px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/60">
                Tu acceso a la aplicación
              </p>
              <p className="mt-2 break-all font-mono text-xs text-ink">
                {acceso}
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 py-3"
                  onClick={copiar}
                >
                  {copiado ? '✓ Copiado' : 'Copiar enlace'}
                </Button>
                {/*
                  Un enlace de verdad y no un botón que navega: así se puede
                  abrir en otra pestaña y el enlace sigue aquí para copiarlo. La
                  advertencia de abajo dice que no se vuelve a mostrar, y un
                  botón que se lleva la página por delante la contradiría.
                */}
                <a
                  href={acceso}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-xl bg-brand px-4 py-3 text-center text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  Crear mi cuenta
                </a>
              </div>
              <p className="mt-3 text-xs text-ink/60">
                Guárdalo: por seguridad no se puede volver a mostrar. Con él
                creas tu cuenta, y caduca cuando termina tu estadía.
              </p>
            </div>
          )}

          <div className="mt-8">
            <p className="text-sm font-bold text-ink">
              Qué puedes hacer con tu cuenta
            </p>
            <ul className="mt-3 space-y-2.5">
              {LO_QUE_GANA.map((cosa) => (
                <li key={cosa.texto} className="flex gap-3 text-sm text-ink/70">
                  <span aria-hidden="true">{cosa.icono}</span>
                  <span>{cosa.texto}</span>
                </li>
              ))}
            </ul>
          </div>

          {/*
            Aquí había dos insignias de App Store y Google Play con `href="#"`:
            dos botones que no llevan a ninguna parte, porque la aplicación
            todavía no está publicada en ninguna tienda.

            Se dice lo que hay. Un enlace muerto en la última pantalla del
            registro es peor que una frase honesta, y además hace creer que la
            app existe donde no existe. Queda en REVISAR-A-OJO (122) para
            ponerlas el día que haya algo al otro lado.
          */}
          <p className="mt-8 border-t border-line pt-6 text-center text-xs text-ink/50">
            La aplicación funciona desde el navegador, sin instalar nada. Las
            versiones de App Store y Google Play llegan más adelante.
          </p>
        </Card>
      </div>
    </MainLayout>
  )
}
