import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Card from '../components/Card'
import Input from '../components/Input'
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
 * Un código de reserva no es un secreto: va en correos y en capturas de
 * pantalla. Por eso aquí se piden además los **últimos cuatro dígitos del
 * teléfono** con el que se reservó, que es lo único del huésped que trae el
 * calendario de Airbnb. Los intentos se cuentan en la base, no aquí.
 *
 * Si acierta, recibe un enlace de preregistro normal y sigue por el camino de
 * siempre (`/access/:token`): esta pantalla no duplica nada de aquel.
 */
type Aviso = { tono: 'info' | 'error'; texto: string } | null

const AVISOS: Record<string, Aviso> = {
  preparando: {
    tono: 'info',
    texto:
      'Todavía estamos preparando tu reserva. Si acabas de reservar, vuelve a intentarlo en un rato. Si el código no es este, revisa el enlace que te mandó tu anfitrión.',
  },
  ultimos4_incorrectos: {
    tono: 'error',
    texto:
      'Esos dígitos no coinciden con el teléfono de la reserva. Son los cuatro últimos del número con el que reservaste.',
  },
  bloqueado: {
    tono: 'error',
    texto:
      'Demasiados intentos. Por seguridad, esta reserva no se puede abrir desde aquí durante una hora. Tu anfitrión puede mandarte un enlace directo.',
  },
  cerrado: {
    tono: 'info',
    texto:
      'El preregistro de esta reserva ya está hecho. No hace falta que hagas nada más: al llegar, el personal de seguridad te recibe con esto ya listo.',
  },
  sin_telefono: {
    tono: 'info',
    texto:
      'Esta reserva no se puede abrir con el código. Pídele a tu anfitrión el enlace de preregistro.',
  },
}

export default function Reserva() {
  const { codigo = '' } = useParams<{ codigo: string }>()
  const navigate = useNavigate()
  const [digitos, setDigitos] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [aviso, setAviso] = useState<Aviso>(null)

  const completo = digitos.length === 4

  const abrir = async () => {
    if (!completo || buscando) return
    setBuscando(true)
    setAviso(null)
    try {
      const { estado, token } = await abrirPrecheckinPorReserva(codigo, digitos)
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
  }

  return (
    <MainLayout header="default" bg="soft">
      <div className="mx-auto max-w-[520px] px-4 py-14">
        <Card className="px-6 py-10 sm:px-10">
          <h1 className="text-center font-display text-3xl font-bold text-ink">
            Tu preregistro
          </h1>
          <p className="mt-3 text-center text-base text-ink/60">
            Reserva <span className="font-bold text-ink">{codigo.toUpperCase()}</span>.
            Para comprobar que es tuya, escribe los últimos cuatro dígitos del
            teléfono con el que reservaste.
          </p>

          <div className="mt-8">
            <Input
              label="Últimos 4 dígitos de tu teléfono"
              tone="soft"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              placeholder="0000"
              value={digitos}
              onChange={(e) => {
                setDigitos(e.target.value.replace(/\D/g, '').slice(0, 4))
                setAviso(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void abrir()
              }}
            />
          </div>

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

          <Button
            type="button"
            className="mt-6 w-full py-3.5"
            disabled={!completo || buscando}
            onClick={() => void abrir()}
          >
            {buscando ? 'Buscando tu reserva…' : 'Continuar'}
          </Button>
        </Card>
      </div>
    </MainLayout>
  )
}
