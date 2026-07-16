import { useMemo } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Card from '../components/Card'
import Button from '../components/Button'
import type { ValidationStatus } from '../components/ValidationCard'
import Loading from '../components/Loading'
import { CheckIcon, CrossMarkIcon, ClockIcon } from '../components/icons'

export interface GuestValidationInfo {
  name: string
  identification: string
  status: ValidationStatus
  isMain?: boolean
  docsValidated?: boolean
  tycAccepted?: boolean
  tycExempt?: boolean
}

interface MilestoneProps {
  done: boolean
  label: string
  variant?: 'success' | 'pending' | 'exempt'
}

function Milestone({ done, label, variant = 'success' }: MilestoneProps) {
  if (variant === 'exempt') {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-brand/5 px-3 py-2">
        <CheckIcon className="h-4 w-4 shrink-0 text-brand" />
        <span className="text-xs font-semibold text-brand">{label}</span>
      </div>
    )
  }
  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-success/5 px-3 py-2">
        <CheckIcon className="h-4 w-4 shrink-0 text-success" />
        <span className="text-xs font-semibold text-success">{label}</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 rounded-lg bg-gold/10 px-3 py-2">
      <Loading size="sm" />
      <span className="text-xs font-semibold text-gold">{label}</span>
    </div>
  )
}

export default function Validation() {
  const navigate = useNavigate()
  const location = useLocation()
  const stateData = location.state as { guests?: GuestValidationInfo[]; companionId?: number } | null
  const guests = stateData?.guests ?? (stateData === null ? [
    {
      name: 'Carlos Balazo',
      identification: '1616516',
      status: 'approved' as ValidationStatus,
      isMain: true,
      docsValidated: true,
      tycAccepted: true,
      tycExempt: false,
    },
    {
      name: 'María González',
      identification: '98765432',
      status: 'reviewing' as ValidationStatus,
      isMain: false,
      docsValidated: true,
      tycAccepted: false,
      tycExempt: false,
    },
  ] : undefined)
  const companionId = stateData?.companionId

  const displayedGuests = useMemo(() => {
    if (!guests || guests.length === 0) return []
    if (companionId !== undefined) {
      const filtered = guests.filter((_, i) => i === companionId || (i === 0 && companionId === 0))
      if (filtered.length === 0) return guests.slice(0, 1)
      return filtered
    }
    return guests
  }, [guests, companionId])

  const hasRejected = useMemo(
    () => guests?.some((g) => g.status === 'rejected') ?? false,
    [guests],
  )

  if (!guests || guests.length === 0) {
    return <Navigate to="/pre-check-in" replace />
  }

  return (
    <MainLayout header="default" bg="soft">
      <div className="mx-auto max-w-[820px] px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-center font-display text-3xl font-bold text-ink sm:text-[34px]">
          {companionId !== undefined ? 'Tu progreso' : 'Validación de huéspedes'}
        </h1>

        {companionId === undefined && (
          <p className="mx-auto mt-3 max-w-lg text-center text-base text-ink/60">
            Revisa el estado de cada huésped registrado antes de continuar.
          </p>
        )}

        {companionId !== undefined && (
          <p className="mx-auto mt-3 max-w-lg text-center text-base text-ink/60">
            Aquí puedes ver el progreso de tu registro.
          </p>
        )}

        {hasRejected && companionId === undefined && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-danger/20 bg-danger/5 px-5 py-4">
            <CrossMarkIcon className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            <p className="text-sm font-semibold text-danger">
              Hay huéspedes rechazados. Corrige la información antes de continuar.
            </p>
          </div>
        )}

        <div className="mt-8 space-y-6">
          {displayedGuests.map((guest, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="px-6 py-6 sm:px-8 sm:py-7">
                <div className="flex items-center gap-5">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${
                      guest.status === 'approved' || guest.status === 'approved-manual'
                        ? 'bg-success/10 text-success'
                        : guest.status === 'rejected'
                          ? 'bg-danger/10 text-danger'
                          : 'bg-gold/10 text-gold'
                    }`}
                  >
                    {guest.status === 'approved' || guest.status === 'approved-manual' ? (
                      <CheckIcon className="h-8 w-8" />
                    ) : guest.status === 'rejected' ? (
                      <CrossMarkIcon className="h-8 w-8" />
                    ) : (
                      <ClockIcon className="h-8 w-8" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-ink">{guest.name}</h3>
                      {guest.isMain && (
                        <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                          Principal
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-ink/60">
                      Identificación: {guest.identification}
                    </p>
                  </div>

                  <div
                    className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold ${
                      guest.status === 'approved' || guest.status === 'approved-manual'
                        ? 'bg-success/10 text-success'
                        : guest.status === 'rejected'
                          ? 'bg-danger/10 text-danger'
                          : 'bg-gold/10 text-gold'
                    }`}
                  >
                    {guest.status === 'approved'
                      ? 'Aprobado'
                      : guest.status === 'approved-manual'
                        ? 'Aprobado manualmente'
                        : guest.status === 'rejected'
                          ? 'Rechazado'
                          : 'En revisión'}
                  </div>
                </div>
              </div>

              <div className="border-t border-line px-6 py-4 sm:px-8">
                <div className="space-y-1.5">
                  <Milestone
                    done={guest.docsValidated ?? false}
                    label="Subida de documentos"
                  />
                  {guest.tycExempt ? (
                    <Milestone
                      done={false}
                      label="Exento de aceptación de Términos y Condiciones"
                      variant="exempt"
                    />
                  ) : (
                    <Milestone
                      done={guest.tycAccepted ?? false}
                      label="Aceptación de Términos y Condiciones"
                    />
                  )}
                  <Milestone
                    done={false}
                    label="Aceptación del Anfitrión"
                    variant="pending"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {companionId === undefined && (
          <div className="mt-10 flex justify-center">
            <Button
              type="button"
              className="w-full max-w-md py-3.5"
              disabled={hasRejected}
              onClick={() => navigate('/download-app')}
            >
              {hasRejected ? 'Corrija los rechazos para continuar' : 'Continuar'}
            </Button>
          </div>
        )}

        {companionId !== undefined && (
          <div className="mt-10 flex justify-center">
            <Button
              type="button"
              className="w-full max-w-md py-3.5"
              onClick={() => navigate('/download-app')}
            >
              Continuar
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
