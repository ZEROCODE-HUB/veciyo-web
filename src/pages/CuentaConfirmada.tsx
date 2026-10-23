import MainLayout from '../layouts/MainLayout'
import Card from '../components/Card'
import { CheckIcon } from '../components/icons'

/**
 * A donde vuelve el correo de verificación de una cuenta creada desde la app
 * (QA 23/10/2026).
 *
 * Antes volvía a la dirección por defecto --la invitación-- y decía que el
 * enlace estaba incompleto. La confirmación ya la hizo Supabase al abrir el
 * enlace; aquí solo se dice, y se ofrece volver a la app, que abre la sesión
 * sola con lo que la persona escribió al registrarse.
 */
export default function CuentaConfirmada() {
  /*
    Si el enlace venció o ya se usó, Supabase vuelve con el error en el
    fragmento (`#error=...&error_description=...`).
  */
  const fragmento = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const error = fragmento.get('error_description') || fragmento.get('error')

  return (
    <MainLayout header="default" bg="page" center>
      <div className="w-full px-4 py-10">
        <Card className="mx-auto max-w-[460px] px-6 py-10 text-center">
          {error ? (
            <>
              <h1 className="font-display text-2xl font-extrabold text-ink">
                Este enlace ya no sirve
              </h1>
              <p className="mt-3 text-sm text-ink/70">
                Puede que ya lo hayas usado o que haya vencido. Abre la app
                Veciyo e intenta entrar con tu correo y tu contraseña; si no te
                deja, pide que te enviemos otro correo de confirmación.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <CheckIcon className="h-8 w-8 text-success" />
              </div>
              <h1 className="mt-6 font-display text-2xl font-extrabold text-ink">
                Tu correo quedó confirmado
              </h1>
              <p className="mt-3 text-sm text-ink/70">
                Vuelve a la app Veciyo: tu sesión se abre sola.
              </p>
            </>
          )}
          <a
            href="veciyo://"
            className="mt-6 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white"
          >
            Abrir Veciyo
          </a>
          <p className="mt-3 text-xs text-ink/60">
            Si el botón no abre la app, ábrela tú desde el celular.
          </p>
        </Card>
      </div>
    </MainLayout>
  )
}
