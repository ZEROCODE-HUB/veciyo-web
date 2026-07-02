import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Input from '../components/Input'
import Button from '../components/Button'
import IdentityValidation from '../components/IdentityValidation'

export default function PreCheckIn() {
  const navigate = useNavigate()
  const [docType, setDocType] = useState<'dni' | 'pasaporte' | null>(null)
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
        docTypeLabel: docType === 'dni' ? 'Cédula / DNI' : 'Pasaporte',
        lastEntryDate,
      },
    })
  }

  return (
    <MainLayout header="default" bg="soft">
      <div className="mx-auto max-w-[640px] px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-extrabold leading-snug text-ink sm:text-[40px] sm:leading-tight">
          Bienvenido Carlos Balazo, este es el prechecking del edificio Los pinos
        </h1>
        <h2 className="mt-4 font-display text-xl font-bold text-ink sm:mt-6 sm:text-[28px]">
          Registro del responsable de la reservación
        </h2>

        {!validating ? (
          <div className="mt-8 space-y-6">
            {/* Document type selector — exactly 2 options */}
            <div>
              <p className="mb-2 text-sm font-semibold text-ink">Tipo de documento</p>
              <div className="flex gap-6">
                <label className="inline-flex cursor-pointer items-center gap-2.5 select-none">
                  <input
                    type="radio"
                    name="docType"
                    checked={docType === 'dni'}
                    onChange={() => setDocType('dni')}
                    className="h-5 w-5 accent-brand"
                  />
                  <span className="text-sm text-ink">Cédula / DNI</span>
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2.5 select-none">
                  <input
                    type="radio"
                    name="docType"
                    checked={docType === 'pasaporte'}
                    onChange={() => setDocType('pasaporte')}
                    className="h-5 w-5 accent-brand"
                  />
                  <span className="text-sm text-ink">Pasaporte</span>
                </label>
              </div>
            </div>

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
                Iniciar verificación
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
