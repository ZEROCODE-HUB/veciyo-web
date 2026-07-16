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
  const [view, setView] = useState<'code' | 'login' | 'reset' | 'resetSent'>('code')
  const [code, setCode] = useState('')

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    const completed = localStorage.getItem('veciyo_registration_completed')
    if (completed) {
      navigate('/validation')
      return
    }
    navigate('/pre-check-in', {
      state: { code: code.trim(), isRecurring: false },
    })
  }

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const completed = localStorage.getItem('veciyo_registration_completed')
    if (completed) {
      navigate('/validation')
      return
    }
    navigate('/pre-check-in', {
      state: {
        isRecurring: true,
        firstName: 'Carlos',
        lastName: 'Balazo',
        identification: '1616516',
        docType: 'dni',
        docTypeLabel: 'Cédula',
        phone: '+57 300 123 4567',
        address: 'Calle 123 #45-67, Bogotá',
        email: 'carlos@ejemplo.com',
      },
    })
  }

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setView('resetSent')
  }

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

          {view === 'code' && (
            <>
              <h1 className="mt-6 text-center text-2xl font-bold text-ink sm:text-[28px]">
                Acceso al preregistro
              </h1>

              <form className="mt-8 space-y-5" onSubmit={handleCodeSubmit}>
                <Input
                  label="Ingresa tu código de acceso"
                  tone="soft"
                  placeholder="Código de acceso"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <Button type="submit" className="w-full py-3" disabled={!code.trim()}>
                  Ingresar
                </Button>
              </form>

              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="text-sm font-medium text-ink underline underline-offset-2 hover:text-brand"
                >
                  ¿Ya eres usuario? Iniciar sesión
                </button>
              </div>
            </>
          )}

          {view === 'login' && (
            <>
              <h1 className="mt-6 text-center text-2xl font-bold text-ink sm:text-[28px]">
                Iniciar sesión
              </h1>

              <form
                className="mt-8 space-y-5"
                onSubmit={handleLoginSubmit}
              >
                <Input label="Correo:" type="email" tone="soft" placeholder="Ingrese su correo electrónico" />
                <Input
                  label="Contraseña"
                  type="password"
                  tone="soft"
                  placeholder="Ingrese su contraseña"
                />

                <Button type="submit" className="w-full py-3">
                  Iniciar Sesión
                </Button>
              </form>

              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setView('reset')}
                  className="text-sm font-medium text-ink underline underline-offset-2 hover:text-brand"
                >
                  Recuperar contraseña
                </button>
              </div>

              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={() => setView('code')}
                  className="text-sm font-medium text-ink/60 underline underline-offset-2 hover:text-brand"
                >
                  Volver al código de acceso
                </button>
              </div>
            </>
          )}

          {view === 'reset' && (
            <>
              <h1 className="mt-6 text-center text-2xl font-bold text-ink sm:text-[28px]">
                Recuperar contraseña
              </h1>

              <form
                className="mt-8 space-y-5"
                onSubmit={handleResetSubmit}
              >
                <Input
                  label="Correo electrónico"
                  type="email"
                  tone="soft"
                  placeholder="Ingrese su correo electrónico"
                />
                <Button type="submit" className="w-full py-3">
                  Enviar enlace de recuperación
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

          {view === 'resetSent' && (
            <>
              <h1 className="mt-6 text-center text-2xl font-bold text-ink sm:text-[28px]">
                Revisa tu correo
              </h1>

              <p className="mt-4 text-center text-base text-ink/70">
                Te hemos enviado un enlace para recuperar tu contraseña. Revisa tu bandeja de entrada.
              </p>

              <div className="mt-8 flex justify-center">
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
