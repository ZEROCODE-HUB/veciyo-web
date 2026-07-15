import { useMemo } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import ValidationCard, { type ValidationStatus } from '../components/ValidationCard'
import Loading from '../components/Loading'
import { CheckIcon, CrossMarkIcon } from '../components/icons'

export interface GuestValidationInfo {
  name: string
  identification: string
  status: ValidationStatus
  isMain?: boolean
  docsValidated?: boolean
  tycAccepted?: boolean
  tycExempt?: boolean
}

export default function Validation() {
  const navigate = useNavigate()
  const location = useLocation()
  const guests = (location.state as { guests?: GuestValidationInfo[] })?.guests

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
          Validación de huéspedes
        </h1>

        <p className="mx-auto mt-3 max-w-lg text-center text-base text-ink/60">
          Revisa el estado de cada huésped registrado antes de continuar.
        </p>

        {hasRejected && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-danger/20 bg-danger/5 px-5 py-4">
            <CrossMarkIcon className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            <p className="text-sm font-semibold text-danger">
              Hay huéspedes rechazados. Corrige la información antes de continuar.
            </p>
          </div>
        )}

        <div className="mt-8 space-y-6">
          {guests.map((guest, i) => (
            <div key={i}>
              <ValidationCard
                name={guest.name}
                identification={guest.identification}
                status={guest.status}
                isMain={guest.isMain}
              />
              <div className="mt-3 space-y-1.5 rounded-card bg-white px-5 py-4 shadow-card sm:px-7 sm:py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">Estado de validación</p>
                {guest.docsValidated ? (
                  <div className="flex items-center gap-2 rounded-lg bg-success/5 px-3 py-2">
                    <CheckIcon className="h-4 w-4 shrink-0 text-success" />
                    <span className="text-xs font-semibold text-success">Validación de documentos</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg bg-gold/10 px-3 py-2">
                    <Loading size="sm" />
                    <span className="text-xs font-semibold text-gold">Documentos pendientes de validación</span>
                  </div>
                )}
                {guest.tycExempt ? (
                  <div className="flex items-center gap-2 rounded-lg bg-brand/5 px-3 py-2">
                    <CheckIcon className="h-4 w-4 shrink-0 text-brand" />
                    <span className="text-xs font-semibold text-brand">Exento de aceptación de términos</span>
                  </div>
                ) : guest.tycAccepted ? (
                  <div className="flex items-center gap-2 rounded-lg bg-success/5 px-3 py-2">
                    <CheckIcon className="h-4 w-4 shrink-0 text-success" />
                    <span className="text-xs font-semibold text-success">Términos y condiciones aceptados</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg bg-gold/10 px-3 py-2">
                    <Loading size="sm" />
                    <span className="text-xs font-semibold text-gold">Términos y condiciones pendientes</span>
                  </div>
                )}
                <div className="flex items-center gap-2 rounded-lg bg-gold/10 px-3 py-2">
                  <Loading size="sm" />
                  <span className="text-xs font-semibold text-gold">Aceptación del anfitrión pendiente</span>
                </div>
              </div>
            </div>
          ))}
        </div>

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
      </div>
    </MainLayout>
  )
}
