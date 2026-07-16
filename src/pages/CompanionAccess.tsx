import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import BackgroundCarousel from '../components/BackgroundCarousel'
import Loading from '../components/Loading'
import Button from '../components/Button'

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

export default function CompanionAccess() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  useEffect(() => {
    if (!id) {
      navigate('/invitacion', { replace: true })
      return
    }
    const timer = setTimeout(() => {
      setStatus('ready')
    }, 1000)
    return () => clearTimeout(timer)
  }, [id, navigate])

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <BackgroundCarousel images={TRAVEL_IMAGES} />
      <div className="relative z-10 flex flex-1 items-center justify-center px-4">
        {status === 'loading' ? (
          <div className="flex flex-col items-center gap-4">
            <Loading size="lg" variant="white" />
            <p className="text-lg font-semibold text-white">Cargando tu información...</p>
          </div>
        ) : (
          <div className="w-full max-w-[520px] rounded-2xl border border-white/30 bg-white/40 px-8 py-10 shadow-2xl shadow-black/10 backdrop-blur-2xl sm:px-12 sm:py-12">
            <h1 className="text-center text-2xl font-bold text-ink sm:text-[28px]">
              Acceso de acompañante
            </h1>
            <p className="mt-4 text-center text-base text-ink/70">
              Has sido invitado a completar tu registro como acompañante.
            </p>
            <div className="mt-8 flex flex-col gap-4">
              <Button
                type="button"
                className="w-full py-3.5"
                onClick={() =>
                  navigate('/validation', {
                    state: {
                      guests: [
                        {
                          name: 'Acompañante',
                          identification: 'N/A',
                          status: 'reviewing' as const,
                          isMain: false,
                          docsValidated: false,
                          tycAccepted: false,
                          tycExempt: false,
                        },
                      ],
                      companionId: 0,
                    },
                  })
                }
              >
                Ver mi progreso
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
