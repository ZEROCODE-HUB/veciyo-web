import { useNavigate } from 'react-router-dom'
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

export default function Invitation() {
  const navigate = useNavigate()

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <BackgroundCarousel images={TRAVEL_IMAGES} />

      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-[640px] rounded-2xl border border-white/30 bg-white/40 px-8 py-12 shadow-2xl shadow-black/10 backdrop-blur-2xl sm:px-14 sm:py-14">
          <h1 className="text-center font-display text-3xl font-extrabold text-ink sm:text-[34px]">
            Preregistro de Seguridad del Condominio
          </h1>

          <p className="mx-auto mt-4 max-w-md text-center text-base leading-relaxed text-ink/80">
            Este condominio requiere que usted complete este preregistro de seguridad para aprobar la reservación.
          </p>

          <div className="mt-8 rounded-xl border border-white/30 bg-white/40 px-6 py-5 shadow-lg backdrop-blur-md">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div className="col-span-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-ink/70">Nombre del huésped</p>
                <p className="text-sm font-bold text-ink">Carlos Balazo</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-ink/70">Nombre de la publicación</p>
                <p className="text-sm font-bold text-ink">Apartamento acogedor en el centro histórico</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-ink/70">Cantidad de huéspedes</p>
                <p className="text-sm font-bold text-ink">3</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-ink/70">Vehículos</p>
                <p className="text-sm font-bold text-ink">2</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-ink/70">Fechas de la reserva</p>
                <p className="text-sm font-bold text-ink whitespace-nowrap">
                  Entrada: 12/08/2026&emsp;&emsp;Salida: 18/08/2026
                </p>
              </div>
            </div>
          </div>

          <Button
            type="button"
            className="mt-10 w-full py-3.5"
            onClick={() => navigate('/login')}
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  )
}
