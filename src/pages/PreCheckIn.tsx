import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Input from '../components/Input'
import Select from '../components/Select'
import Button from '../components/Button'
import IdentityValidation from '../components/IdentityValidation'

const DOCUMENT_TYPES = [
  { value: 'dni', label: 'Cédula' },
  { value: 'pasaporte', label: 'Pasaporte' },
  { value: 'extranjero', label: 'Documento de identidad extranjero' },
  { value: 'otro', label: 'Otro' },
]

const DOC_TYPE_LABELS: Record<string, string> = {
  dni: 'Cédula',
  pasaporte: 'Pasaporte',
  extranjero: 'Documento de identidad extranjero',
  otro: 'Otro',
}

export default function PreCheckIn() {
  const navigate = useNavigate()
  const [docType, setDocType] = useState<string | null>(null)
  const [docNumber, setDocNumber] = useState('')
  const [lastEntryDate, setLastEntryDate] = useState('')
  const [validating, setValidating] = useState(false)

  const canValidate = docType !== null && docNumber.trim().length > 0

  const handleValidate = () => {
    if (canValidate) {
      setValidating(true)
    }
  }

  const handleValidationComplete = () => {
    navigate('/confirm-data', {
      state: {
        docType,
        docNumber,
        docTypeLabel: DOC_TYPE_LABELS[docType!] || docType,
        lastEntryDate,
      },
    })
  }

  return (
    <MainLayout header="default" bg="soft">
      <div className="mx-auto max-w-[640px] px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-extrabold leading-snug text-ink sm:text-[40px] sm:leading-tight">
          Bienvenido Carlos Balazo, este es el preregistro de seguridad del edificio Los Pinos.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink/70 sm:mt-6">
          Registro del responsable de la reservación. Ten a la mano la dirección de residencia, correos electrónicos, placas de los vehículos y los documentos de todos los huéspedes. Cada huésped recibirá por correo un enlace para aceptar sus propios Términos y Condiciones.
        </p>

        {!validating ? (
          <div className="mt-8 space-y-6">
            <Select
              label="Tipo de documento"
              tone="soft"
              placeholder="Seleccione"
              options={DOCUMENT_TYPES}
              value={docType || ''}
              onChange={(e) => {
                const val = e.target.value
                setDocType(val || null)
              }}
            />

            <Input
              label="Número de identificación"
              tone="soft"
              placeholder="Ingrese su número de identificación"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
            />

            {docType === 'pasaporte' && (
              <Input
                label="Fecha de último ingreso al país"
                type="date"
                tone="soft"
                value={lastEntryDate}
                onChange={(e) => setLastEntryDate(e.target.value)}
              />
            )}

            <div className="flex justify-center pt-2">
              <Button
                type="button"
                className="w-full max-w-md py-3.5"
                onClick={handleValidate}
                disabled={!canValidate}
              >
                Comencemos
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <IdentityValidation
              docType={docType!}
              onCancel={() => setValidating(false)}
              onComplete={handleValidationComplete}
            />
          </div>
        )}
      </div>
    </MainLayout>
  )
}
