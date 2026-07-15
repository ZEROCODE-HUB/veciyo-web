import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Input from '../components/Input'
import Select from '../components/Select'
import Button from '../components/Button'

const VISIT_REASONS = [
  { value: 'turismo', label: 'Turismo' },
  { value: 'negocios', label: 'Negocios' },
  { value: 'trabajo', label: 'Trabajo' },
  { value: 'estudios', label: 'Estudios' },
  { value: 'transito', label: 'Tránsito' },
]

export default function ConfirmData() {
  const navigate = useNavigate()
  const location = useLocation()
  const data = location.state as {
    docType?: string
    docNumber?: string
  } | null
  if (!data?.docType) {
    return <Navigate to="/pre-check-in" replace />
  }

  const handleConfirm = () => {
    navigate('/terms-and-conditions', {
      state: { name: 'Carlos Balazo', identification: data.docNumber, docType: data.docType, docTypeLabel },
    })
  }

  const DOC_TYPE_LABELS: Record<string, string> = {
    dni: 'Cédula',
    pasaporte: 'Pasaporte',
    extranjero: 'Documento de identidad extranjero',
    otro: 'Otro',
  }
  const docTypeLabel = DOC_TYPE_LABELS[data.docType || ''] || data.docType || 'Cédula'

  return (
    <MainLayout header="default" bg="soft">
      <div className="mx-auto max-w-[640px] px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-center font-display text-3xl font-bold text-ink sm:text-[34px]">
          Confirma tus datos
        </h1>

        <div className="mt-8">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface-soft px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">Nombre</p>
              <p className="text-sm font-bold text-ink">Carlos</p>
            </div>
            <div className="rounded-xl bg-surface-soft px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">Apellido</p>
              <p className="text-sm font-bold text-ink">Balazo</p>
            </div>
            <div className="rounded-xl bg-surface-soft px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">Tipo de identificación</p>
              <p className="text-sm font-bold text-ink">{docTypeLabel}</p>
            </div>
            <div className="rounded-xl bg-surface-soft px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">Número de identificación</p>
              <p className="text-sm font-bold text-ink">{data.docNumber || '—'}</p>
            </div>
          </div>

          <div className="mt-6 border-t border-line pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/50">
              Datos editables
            </p>
            <div className="space-y-3">
              <Input
                label="Número de teléfono"
                type="tel"
                placeholder="Ingrese su número de teléfono"
                defaultValue=""
              />
              <Input
                label="Dirección de residencia"
                placeholder="Ingrese su dirección de residencia"
                defaultValue=""
              />
              <Select
                label="Motivo de alojamiento"
                placeholder="Seleccione un motivo"
                options={VISIT_REASONS}
              />
            </div>
          </div>

          <div className="flex justify-center pt-6">
            <Button
              type="button"
              className="w-full max-w-md py-3.5"
              onClick={handleConfirm}
            >
              Continuar
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
