import { useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Input from '../components/Input'
import Select from '../components/Select'
import Button from '../components/Button'
import Accordion from '../components/Accordion'
import Checkbox from '../components/Checkbox'

const VISIT_REASONS = [
  { value: 'turismo', label: 'Turismo' },
  { value: 'negocios', label: 'Negocios' },
  { value: 'trabajo', label: 'Trabajo' },
  { value: 'estudios', label: 'Estudios' },
  { value: 'transito', label: 'Tránsito' },
]

const TYC_SECTIONS = [
  { id: 'terminos', title: 'Términos y Condiciones' },
  { id: 'datos', title: 'Tratamiento de Datos Personales' },
  { id: 'privacidad', title: 'Política de Privacidad' },
  { id: 'condominio', title: 'Términos y Condiciones del Condominio' },
]

const TYC_CONTENT: Record<string, string> = {
  terminos:
    'Al utilizar este servicio, aceptas que los datos proporcionados sean procesados conforme a los términos establecidos. El incumplimiento de estos términos puede resultar en la suspensión del servicio.',
  datos:
    'Los datos personales recopilados serán tratados conforme a la normativa vigente de protección de datos. El responsable del tratamiento garantiza la confidencialidad, integridad y disponibilidad de la información proporcionada.',
  privacidad:
    'Esta política describe cómo recopilamos, usamos y protegemos tu información personal. Nos comprometemos a asegurar que tu privacidad esté protegida en todo momento.',
  condominio:
    'El huésped se compromete a cumplir con las normas internas del condominio, incluyendo horarios de acceso, uso de áreas comunes y comportamiento dentro de las instalaciones.',
}

export default function ConfirmData() {
  const navigate = useNavigate()
  const location = useLocation()
  const data = location.state as {
    docType?: string
    docTypeLabel?: string
    firstName?: string
    lastName?: string
    docNumber?: string
    phone?: string
    address?: string
    email?: string
  } | null

  const [tycAccepted, setTycAccepted] = useState(false)

  if (!data?.docType) {
    return <Navigate to="/pre-check-in" replace />
  }

  const handleConfirm = () => {
    if (!tycAccepted) return
    navigate('/companions', {
      state: {
        name: `${data.firstName || 'Carlos'} ${data.lastName || 'Balazo'}`,
        identification: data.docNumber || 'N/A',
        docType: data.docType,
        docTypeLabel: data.docTypeLabel || data.docType,
        tycAccepted: true,
        hasVehicles: true,
        vehicleCount: 2,
      },
    })
  }

  return (
    <MainLayout header="default" bg="soft">
      <div className="mx-auto max-w-[640px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-brand">Paso 2 de 3</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand/20">
            <div className="h-full w-2/3 rounded-full bg-brand" />
          </div>
        </div>

        <h1 className="mt-6 text-center font-display text-3xl font-bold text-ink sm:text-[34px]">
          Confirma tus datos
        </h1>

        <p className="mx-auto mt-3 max-w-md text-center text-base text-ink/60">
          Los datos fueron extraídos automáticamente de tu documento. Verifica que sean correctos.
        </p>

        <div className="mt-8">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface-soft px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">Nombre</p>
              <p className="text-sm font-bold text-ink">{data.firstName || 'Carlos'}</p>
            </div>
            <div className="rounded-xl bg-surface-soft px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">Apellido</p>
              <p className="text-sm font-bold text-ink">{data.lastName || 'Balazo'}</p>
            </div>
            <div className="rounded-xl bg-surface-soft px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">Tipo de identificación</p>
              <p className="text-sm font-bold text-ink">{data.docTypeLabel || data.docType || 'Cédula'}</p>
            </div>
            <div className="rounded-xl bg-surface-soft px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">Número de identificación</p>
              <p className="text-sm font-bold text-ink">{data.docNumber || '—'}</p>
            </div>
          </div>

          <div className="mt-6 border-t border-line pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/50">
              Datos adicionales
            </p>
            <div className="space-y-3">
              <Input
                label="Número de teléfono"
                type="tel"
                tone="soft"
                placeholder="Ingrese su número de teléfono"
                defaultValue={data.phone || ''}
              />
              <Input
                label="Dirección de residencia"
                tone="soft"
                placeholder="Ingrese su dirección de residencia"
                defaultValue={data.address || ''}
              />
              <Select
                label="Motivo de alojamiento"
                tone="soft"
                placeholder="Seleccione un motivo"
                options={VISIT_REASONS}
              />
            </div>
          </div>

          {/* Términos y Condiciones integrados */}
          <div className="mt-6 border-t border-line pt-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/50">
              Términos y condiciones
            </p>
            <Accordion
              sections={TYC_SECTIONS.map((s) => ({
                id: s.id,
                title: s.title,
                content: <p>{TYC_CONTENT[s.id]}</p>,
              }))}
            />
            <div className="mt-6 flex items-start gap-3">
              <Checkbox
                label="Acepto los términos y condiciones"
                checked={tycAccepted}
                onChange={(e) => setTycAccepted(e.target.checked)}
              />
            </div>
          </div>

          <div className="flex justify-center pt-6">
            <Button
              type="button"
              className="w-full max-w-md py-3.5"
              disabled={!tycAccepted}
              onClick={handleConfirm}
            >
              Confirmar y continuar
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
