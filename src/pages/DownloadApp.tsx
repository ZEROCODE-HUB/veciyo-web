import { useLocation } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Card from '../components/Card'
import { CheckIcon } from '../components/icons'
import { entradaElegida, olvidarToken } from '../lib/precheckin'

/**
 * El final del preregistro: aquí nace el acceso del huésped a la aplicación.
 *
 * La pantalla decía «pendiente de aceptación por parte del anfitrión», con un
 * girador al lado, y eso no es lo que pasa: el preregistro queda **cerrado**,
 * y lo que el anfitrión aprueba después --si hace falta-- son los términos de
 * un menor o una verificación con hallazgos.
 *
 * El 02/10/2026 el cliente pidió que dijera que lleve sus documentos **en
 * físico** y que quien se presente sea **la misma persona** que se registró
 * --la base lo impone desde ese día--.
 *
 * El 16/10/2026 la responsable de producto cambió los textos, la lista de por
 * qué crear la cuenta, y pidió quitar el enlace escrito («Tu acceso a la
 * aplicación») y poner los logos de App Store y Google Play. Los enlaces de las
 * tiendas son **provisionales**: la aplicación todavía no está publicada
 * (REVISAR-A-OJO). El acceso para crear la cuenta sigue en el botón.
 */

/** Lo que pidió la responsable de producto, en su orden (16/10/2026). */
const POR_QUE_CREARLA = [
  'Puedes volver a esta reserva para editar datos.',
  'Guardaremos tus datos para acelerar tu registro en cualquier edificio Veciyo.',
  'Abrir el libro del alojamiento —wifi, puerta e instrucciones de tu anfitrión— mientras dure tu estadía.',
  'Hablar con portería y reservar zonas comunes desde la aplicación.',
  'Conocer las notificaciones del edificio.',
  'Registrar tus propias visitas (si está permitido por tu anfitrión).',
]

/** Provisionales hasta que la aplicación esté en las tiendas. */
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

export default function DownloadApp() {
  const location = useLocation()
  const acceso = (location.state as { acceso?: string } | null)?.acceso ?? null
  // Eligió «Crear una cuenta» al empezar: el botón va primero y destacado.
  const quiereCuenta = entradaElegida() === 'crear_cuenta'

  // El token de preregistro ya no sirve para nada: se suelta para que no se
  // quede vivo en la pestaña.
  if (acceso) olvidarToken()

  return (
    <MainLayout header="default" bg="page" center>
      <div className="w-full px-4 py-10 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-[640px] px-6 py-10 sm:px-12 sm:py-12">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckIcon className="h-8 w-8 text-success" />
            </div>

            <h1 className="mt-6 font-display text-3xl font-extrabold text-ink sm:text-[34px]">
              Registro completado exitosamente
            </h1>

            <p className="mx-auto mt-4 max-w-md text-base text-ink/70">
              Tu registro como huésped temporal ha sido completado. El equipo de
              seguridad te espera para completar tu registro presencial con tus
              documentos físicos.
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm text-ink/70">
              Cuando el proceso de registro de todo tu grupo esté completo,
              recibirás confirmación de aprobación de ingreso a tu correo
              electrónico con un QR para agilizar tu registro físico a tu
              llegada.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3 rounded-lg bg-success/5 px-4 py-3">
              <CheckIcon className="h-4 w-4 text-success" />
              <span className="text-sm font-semibold text-success">Preregistro enviado</span>
            </div>
          </div>

          {/*
            Lo primero después del «listo», y no al final: es lo único de esta
            pantalla que puede impedirle entrar al edificio.
          */}
          <div className="mt-8 rounded-2xl border border-gold/40 bg-gold/10 px-5 py-5">
            <p className="text-sm font-bold text-ink">Antes de venir, dos cosas</p>
            <ul className="mt-3 space-y-3 text-sm text-ink">
              <li className="flex gap-3">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <span>
                  <strong>Trae tus documentos físicos.</strong> El personal de
                  seguridad los compara con lo que acabas de registrar, uno por
                  uno, incluidos los de quienes vienen contigo.
                </span>
              </li>
              <li className="flex gap-3">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <span>
                  <strong>Quien se presente tiene que ser quien se registró.</strong>{' '}
                  Si el número del documento no coincide con el que pusiste, no
                  se puede dejar pasar a esa persona. Si algo quedó mal escrito,
                  dilo ahora a tu anfitrión.
                </span>
              </li>
            </ul>
          </div>

          <div
            className={`mt-6 rounded-2xl border px-5 py-5 ${
              quiereCuenta ? 'border-brand bg-brand/5' : 'border-line bg-surface-soft'
            }`}
          >
            <p className="text-sm font-bold text-ink">
              Por qué crear tu cuenta y descargar la aplicación Veciyo
            </p>
            <ul className="mt-3 space-y-2.5">
              {POR_QUE_CREARLA.map((texto) => (
                <li key={texto} className="flex gap-3 text-sm text-ink/80">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span>{texto}</span>
                </li>
              ))}
            </ul>

            {/*
              Un enlace de verdad y no un botón que navega: así se abre en otra
              pestaña y esta pantalla no se pierde. El acceso no se puede volver
              a mostrar.
            */}
            {acceso && (
              <a
                href={acceso}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 block rounded-xl bg-brand px-4 py-3 text-center text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                Crear mi cuenta
              </a>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
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
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}
