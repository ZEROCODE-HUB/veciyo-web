import { useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Card from '../components/Card'
import Input from '../components/Input'
import Checkbox from '../components/Checkbox'
import FileUploader from '../components/FileUploader'
import Button from '../components/Button'
import { ClockIcon } from '../components/icons'

type CompanionStatus = 'pending_tc' | 'tc_accepted'

interface CompanionEntry {
  email: string
  isMinor: boolean
  status: CompanionStatus
}

const STATUS_LABELS: Record<CompanionStatus, string> = {
  pending_tc: 'Pendiente de T&C',
  tc_accepted: 'T&C aceptados',
}

const STATUS_COLORS: Record<CompanionStatus, string> = {
  pending_tc: 'bg-gold/10 text-gold',
  tc_accepted: 'bg-success/10 text-success',
}

export default function Companions() {
  const navigate = useNavigate()
  const location = useLocation()
  const mainGuest = location.state as {
    name?: string
    identification?: string
  } | null

  const [companions, setCompanions] = useState<CompanionEntry[]>([])
  const [emailInput, setEmailInput] = useState('')
  const [isMinor, setIsMinor] = useState(false)
  const [minorModalIndex, setMinorModalIndex] = useState<number | null>(null)

  if (!mainGuest?.name) {
    return <Navigate to="/pre-check-in" replace />
  }

  const addCompanion = () => {
    const email = emailInput.trim()
    if (!email) return
    setCompanions((prev) => [...prev, { email, isMinor, status: 'pending_tc' }])
    setEmailInput('')
    if (isMinor) {
      setMinorModalIndex(companions.length)
      setIsMinor(false)
    }
  }

  const closeMinorModal = () => {
    setMinorModalIndex(null)
  }

  const handleSubmit = () => {
    navigate('/validation', {
      state: {
        guests: [
          {
            name: mainGuest.name!,
            identification: mainGuest.identification || 'N/A',
            status: 'approved' as const,
            isMain: true,
          },
        ],
      },
    })
  }

  return (
    <MainLayout header="default" bg="soft">
      <div className="mx-auto max-w-[820px] px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-extrabold text-ink sm:text-[34px]">
          Registro de acompañantes
        </h1>

        {/* Responsible guest card */}
        <Card className="mt-6 px-6 py-7 sm:px-10 sm:py-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
            <div className="min-w-0 sm:w-56">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">Huésped principal</p>
              <h3 className="mt-1.5 text-lg font-bold text-ink">
                {mainGuest.name}
              </h3>
              {mainGuest.identification && (
                <p className="mt-1 text-sm font-semibold text-ink/70">
                  Identificación: <span className="text-ink">{mainGuest.identification}</span>
                </p>
              )}
            </div>
            <div className="flex flex-1 items-center sm:justify-start">
              <div className="flex items-center gap-3">
                <ClockIcon className="h-9 w-9 shrink-0 text-ink" />
                <p className="text-sm leading-snug text-ink/80">
                  Viernes 03/07/2025 al
                  <br />
                  Jueves 21/08/2025
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <Button
                type="button"
                onClick={() => navigate('/pre-check-in')}
              >
                Iniciar verificación
              </Button>
            </div>
          </div>
        </Card>

        {/* Companion email input */}
        <div className="mt-8 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                tone="soft"
                placeholder="Correo electrónico del acompañante"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
            </div>
            <Button
              type="button"
              className="px-6 py-3"
              onClick={addCompanion}
              disabled={!emailInput.trim()}
            >
              Agregar acompañante
            </Button>
          </div>
          <Checkbox
            label="¿Es menor de edad?"
            checked={isMinor}
            onChange={(e) => setIsMinor(e.target.checked)}
          />
        </div>

        {/* Companion cards */}
        {companions.length > 0 && (
          <div className="mt-6 space-y-4">
            <h2 className="text-lg font-bold text-ink">
              Acompañantes ({companions.length})
            </h2>
            {companions.map((c, i) => (
              <Card key={i} className="px-6 py-5 sm:px-10 sm:py-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">
                      Huésped acompañante
                    </p>
                    <p className="mt-1 text-base font-semibold text-ink">
                      {c.email}
                    </p>
                    {c.isMinor && (
                      <span className="mt-0.5 inline-block text-xs font-medium text-ink/50">
                        Menor de edad
                      </span>
                    )}
                  </div>
                  <div className="shrink-0">
                    <span
                      className={`inline-block rounded-full px-4 py-1.5 text-sm font-bold ${STATUS_COLORS[c.status]}`}
                    >
                      {STATUS_LABELS[c.status]}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-10 flex justify-center border-t border-line pt-8">
          <Button
            type="button"
            className="w-full max-w-md py-3.5 text-base"
            onClick={handleSubmit}
          >
            Enviar información
          </Button>
        </div>
      </div>

      {/* Minor documentation modal */}
      {minorModalIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-card bg-white px-6 py-8 shadow-card sm:px-8">
            <h3 className="text-lg font-bold text-ink">
              Documentación para menor de edad
            </h3>
            <p className="mt-1 text-sm text-ink/60">
              Por favor adjunta la carta de potestad o tutela notarial correspondiente.
            </p>
            <div className="mt-5">
              <FileUploader
                tone="soft"
                title="Carta de potestad / tutela notarial"
              />
            </div>
            <div className="mt-6 flex justify-end">
              <Button type="button" onClick={closeMinorModal}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
