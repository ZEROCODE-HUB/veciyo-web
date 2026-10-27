import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Card from '../components/Card'
import Button from '../components/Button'
import { porQueFallo } from '../lib/motivo'
import { abrirPrecheckinPorReserva } from '../lib/precheckin'

/**
 * La puerta de quien llega desde el mensaje de Airbnb.
 *
 * La dirección termina en el código de la reserva —`/r/HMABCD1234`—, que el
 * anfitrión puso **una vez** en su mensaje automático. Así no tiene que
 * generar y mandar un enlace por cada reserva.
 *
 * Se abre sola (hueco 48, 27/10/2026): antes pedía los cuatro últimos dígitos
 * del teléfono, y el cliente decidió quitarlos. Si la reserva está, recibe un
 * enlace de preregistro normal y sigue por el camino de siempre
 * (`/access/:token`): esta pantalla no duplica nada de aquel.
 */
type Aviso = { tono: 'info' | 'error'; texto: string } | null

const AVISOS: Record<string, Aviso> = {
  preparando: {
    tono: 'info',
    texto:
      'Todavía estamos preparando tu reserva. Si acabas de reservar, vuelve a intentarlo en un rato. Si el código no es este, revisa el enlace que te mandó tu anfitrión.',
  },
  cerrado: {
    tono: 'info',
    texto:
      'El preregistro de esta reserva ya está hecho. No hace falta que hagas nada más: al llegar, el personal de seguridad te recibe con esto ya listo.',
  },
}

export default function Reserva() {
  const { codigo = '' } = useParams<{ codigo: string }>()
  const navigate = useNavigate()
  const [buscando, setBuscando] = useState(true)
  const [aviso, setAviso] = useState<Aviso>(null)

  const abrir = useCallback(async () => {
    setBuscando(true)
    setAviso(null)
    try {
      const { estado, token } = await abrirPrecheckinPorReserva(codigo)
      if (estado === 'listo' && token) {
        // El camino de siempre: allí se comprueba el enlace y se decide por
        // dónde seguir.
        navigate(`/access/${token}`, { replace: true })
        return
      }
      setAviso(
        AVISOS[estado] ?? { tono: 'error', texto: 'No pudimos abrir tu reserva.' },
      )
    } catch (e) {
      setAviso({ tono: 'error', texto: porQueFallo(e, 'No pudimos abrir tu reserva') })
    } finally {
      setBuscando(false)
    }
  }, [codigo, navigate])

  useEffect(() => {
    void abrir()
  }, [abrir])

  return (
    <MainLayout header="default" bg="soft">
      <div className="mx-auto max-w-[520px] px-4 py-14">
        <Card className="px-6 py-10 sm:px-10">
          <h1 className="text-center font-display text-3xl font-bold text-ink">
            Tu preregistro
          </h1>
          <p className="mt-3 text-center text-base text-ink/60">
            Reserva <span className="font-bold text-ink">{codigo.toUpperCase()}</span>.
          </p>

          {buscando && (
            <p className="mt-6 text-center text-sm text-ink/60">Buscando tu reserva…</p>
          )}

          {aviso && (
            <p
              className={`mt-5 rounded-xl px-4 py-3 text-sm ${
                aviso.tono === 'error'
                  ? 'bg-danger/5 font-semibold text-danger'
                  : 'bg-surface-soft text-ink/80'
              }`}
            >
              {aviso.texto}
            </p>
          )}

          {!buscando && aviso && (
            <Button type="button" className="mt-6 w-full py-3.5" onClick={() => void abrir()}>
              Volver a intentarlo
            </Button>
          )}
        </Card>
      </div>
    </MainLayout>
  )
}
