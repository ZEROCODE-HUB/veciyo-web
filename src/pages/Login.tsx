import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Input from '../components/Input'
import Button from '../components/Button'
import BackgroundCarousel from '../components/BackgroundCarousel'

const images = import.meta.glob('../assets/Imágenes/new/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
})
const TRAVEL_IMAGES = Object.entries(images)
  .sort(([a], [b]) => {
    const order = [2, 1, 3, 4, 5, 6]
    const num = (p: string) => parseInt(p.match(/(\d+)/)?.[1] ?? '0', 10)
    return order.indexOf(num(a)) - order.indexOf(num(b))
  })
  .map(([, src]) => src) as string[]

export default function Login() {
  const navigate = useNavigate()
  const [view, setView] = useState<'login' | 'reset'>('login')

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <BackgroundCarousel images={TRAVEL_IMAGES} />

      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-[520px] rounded-2xl border border-white/30 bg-white/40 px-8 py-10 shadow-2xl shadow-black/10 backdrop-blur-2xl sm:px-12 sm:py-12">
          <div className="flex justify-center">
            <span className="font-display text-3xl font-extrabold tracking-tight text-ink">
              VeciYo
            </span>
          </div>

          {view === 'login' ? (
            <>
              <h1 className="mt-6 text-center text-2xl font-bold text-ink sm:text-[28px]">
                Iniciar sesion
              </h1>

              <form
                className="mt-8 space-y-5"
                onSubmit={(e) => {
                  e.preventDefault()
                  navigate('/pre-check-in', {
                    state: { name: 'Carlos Balazo', identification: '1616516' },
                  })
                }}
              >
                <Input label="Correo:" type="email" placeholder="Ingrese su correo electrónico" />
                <Input
                  label="Contraseña"
                  type="password"
                  placeholder="Ingrese su correo contraseña"
                />

                <Button type="submit" className="w-full py-3">
                  Iniciar Sesión
                </Button>
              </form>

              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setView('reset')}
                  className="text-sm font-medium text-ink underline underline-offset-2 hover:text-brand"
                >
                  Recuperar la contraseña
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="mt-6 text-center text-2xl font-bold text-ink sm:text-[28px]">
                Cambio de contraseña
              </h1>

              <form
                className="mt-8 space-y-5"
                onSubmit={(e) => e.preventDefault()}
              >
                <Input
                  label="Contraseña actual:"
                  type="password"
                  placeholder="Ingrese la contraseña recibida en el correo electrónico"
                />
                <Input
                  label="Contraseña nueva"
                  type="password"
                  placeholder="Ingrese su contraseña nueva"
                />
                <Input
                  label="Repita la Contraseña:"
                  type="password"
                  placeholder="Ingrese su contraseña nueva"
                />

                <Button type="submit" className="w-full py-3">
                  Cambiar contraseña
                </Button>
              </form>

              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="text-sm font-medium text-ink underline underline-offset-2 hover:text-brand"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
