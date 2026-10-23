import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Card from '../components/Card'
import Button from '../components/Button'
import { CheckIcon } from '../components/icons'
import { POR_QUE_CREAR_LA_CUENTA, entradaElegida, olvidarToken } from '../lib/precheckin'

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
 * (REVISAR-A-OJO). Las tiendas se enseñan después de decir que sí a la cuenta,
 * en la página de crearla (16/10/2026, segunda vuelta).
 */

const POR_QUE_CREARLA = POR_QUE_CREAR_LA_CUENTA

export default function DownloadApp() {
  const location = useLocation()
  const navigate = useNavigate()
  const acceso = (location.state as { acceso?: string } | null)?.acceso ?? null
  // Eligió «Crear una cuenta» al empezar: el «Sí» ya viene destacado.
  const quiereCuenta = entradaElegida() === 'crear_cuenta'
  /*
    Al terminar se le pregunta si quiere su cuenta (16/10/2026). Si dice que sí,
    pasa a la página de crearla, que es donde están las tiendas; si no, se
    queda aquí con su preregistro hecho.
  */
  const [noPorAhora, setNoPorAhora] = useState(false)

  const crearCuenta = () => {
    if (!acceso) return
    // El acceso es `/invitacion?token=…` de esta misma web.
    const url = new URL(acceso, window.location.origin)
    navigate(`${url.pathname}${url.search}`)
  }

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

            {/*
              QA 23/10/2026 (responsable de producto): que quede claro que hay
              que esperar la aprobación, que esto todavía no autoriza a entrar
              y que los documentos se piden en físico.
            */}
            <h1 className="mt-6 font-display text-3xl font-extrabold text-ink sm:text-[34px]">
              Registro completado
            </h1>

            <p className="mx-auto mt-4 max-w-md text-base text-ink/70">
              El equipo de seguridad y tu anfitrión revisarán la información.
              Espera su confirmación: <strong>esto todavía no es una
              autorización de ingreso.</strong>
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm text-ink/70">
              Cuando se apruebe el ingreso de todo tu grupo, te llegará un correo
              con la confirmación, el resumen de tu reserva y tu QR de ingreso
              para agilizar tu registro al llegar.
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm text-ink/70">
              Recuerda que todos los documentos que registraste se te pedirán
              en físico al llegar.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3 rounded-lg bg-gold/10 px-4 py-3">
              <CheckIcon className="h-4 w-4 text-ink" />
              <span className="text-sm font-semibold text-ink">
                Preregistro enviado · pendiente de aprobación
              </span>
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

          {acceso && !noPorAhora && (
            <div
              className={`mt-6 rounded-2xl border px-5 py-5 ${
                quiereCuenta ? 'border-brand bg-brand/5' : 'border-line bg-surface-soft'
              }`}
            >
              <p className="text-base font-bold text-ink">¿Quieres crear tu cuenta en Veciyo?</p>
              <ul className="mt-3 space-y-2.5">
                {POR_QUE_CREARLA.map((texto) => (
                  <li key={texto} className="flex gap-3 text-sm text-ink/80">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span>{texto}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button type="button" className="flex-1 py-3" onClick={crearCuenta}>
                  Sí, crear mi cuenta
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 py-3"
                  onClick={() => setNoPorAhora(true)}
                >
                  Ahora no
                </Button>
              </div>
            </div>
          )}

          {noPorAhora && (
            <p className="mt-6 rounded-2xl bg-surface-soft px-5 py-4 text-center text-sm text-ink/80">
              Listo, tu preregistro queda hecho. Cuando se apruebe el ingreso
              de tu grupo, te avisaremos a tu correo y te enviaremos el QR de
              acceso.
            </p>
          )}
        </Card>
      </div>
    </MainLayout>
  )
}
