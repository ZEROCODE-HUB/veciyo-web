import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import BackgroundCarousel from '../components/BackgroundCarousel'
import Loading from '../components/Loading'

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

export default function Access() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'ready' | 'completed'>('loading')

  useEffect(() => {
    if (!token) {
      navigate('/invitacion', { replace: true })
      return
    }

    // Simula validación del token contra backend
    const timer = setTimeout(() => {
      // Por ahora siempre redirige a bienvenida
      // Cuando el backend indique que el proceso ya fue completado,
      // cambiar a 'completed' para mostrar estado de reserva
      setStatus('ready')
    }, 1500)

    return () => clearTimeout(timer)
  }, [token, navigate])

  useEffect(() => {
    if (status === 'ready') {
      navigate('/invitacion', { replace: true })
    }
  }, [status, navigate])

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <BackgroundCarousel images={TRAVEL_IMAGES} />
      <div className="relative z-10 flex flex-1 items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <Loading size="lg" variant="white" />
          {status === 'completed' && (
            <p className="text-lg font-semibold text-white">Redirigiendo al estado de tu reserva...</p>
          )}
        </div>
      </div>
    </div>
  )
}
