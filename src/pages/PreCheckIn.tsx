import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Input from '../components/Input'
import Select from '../components/Select'
import FileUploader from '../components/FileUploader'
import Checkbox from '../components/Checkbox'
import Button from '../components/Button'
import IdentityValidation from '../components/IdentityValidation'

const SIRE_TRAO_PLACEHOLDER = 'Opciones pendientes de verificación con SIRE/TRAO'

export default function PreCheckIn() {
  const navigate = useNavigate()
  const [docType, setDocType] = useState<'dni' | 'pasaporte' | null>(null)
  const [frontDone, setFrontDone] = useState(false)
  const [backDone, setBackDone] = useState(false)
  const [passportDone, setPassportDone] = useState(false)
  const [lastEntryDate, setLastEntryDate] = useState('')
  const [isMinor, setIsMinor] = useState(false)
  const [custodyDone, setCustodyDone] = useState(false)
  const [validating, setValidating] = useState(false)

  const allUploadsDone =
    docType === 'dni' ? frontDone && backDone : docType === 'pasaporte' ? passportDone : false
  const canValidate = allUploadsDone && (!isMinor || custodyDone)

  const handleValidate = () => {
    if (canValidate) {
      setValidating(true)
    }
  }

  const handleValidationComplete = () => {
    navigate('/confirm-data', {
      state: {
        docType,
        docNumber: '',
        docTypeLabel: docType === 'dni' ? 'Cédula / DNI' : 'Pasaporte',
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

            {/* Conditional image uploads */}
            {docType === 'dni' && (
              <div className="space-y-4">
                <FileUploader
                  tone="soft"
                  title="Frente del documento"
                  onFileSelected={() => setFrontDone(true)}
                />
                <FileUploader
                  tone="soft"
                  title="Reverso del documento"
                  onFileSelected={() => setBackDone(true)}
                />
              </div>
            )}
            {docType === 'pasaporte' && (
              <div className="space-y-4">
                <FileUploader
                  tone="soft"
                  title="Pasaporte"
                  onFileSelected={() => setPassportDone(true)}
                />
                <Input
                  label="Fecha de último ingreso al país"
                  type="date"
                  tone="soft"
                  value={lastEntryDate}
                  onChange={(e) => setLastEntryDate(e.target.value)}
                />
              </div>
            )}

            {/* Motivo de alojamiento */}
            <Select
              tone="soft"
              label="Motivo de alojamiento"
              placeholder={SIRE_TRAO_PLACEHOLDER}
              options={[]}
            />

            {/* Menor de edad */}
            <Checkbox
              label="¿Es menor de edad?"
              checked={isMinor}
              onChange={(e) => setIsMinor(e.target.checked)}
            />
            {isMinor && (
              <FileUploader
                tone="soft"
                title="Carta de potestad / tutela notarial"
                onFileSelected={() => setCustodyDone(true)}
              />
            )}

            {/* Editable contact data */}
            <div className="border-t border-line pt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/50">
                Datos de contacto
              </p>
              <Input
                label="Número de teléfono"
                type="tel"
                tone="soft"
                placeholder="Ingrese su número de teléfono"
              />
              <div className="mt-3">
                <Input
                  label="Dirección de residencia"
                  tone="soft"
                  placeholder="Ingrese su dirección de residencia"
                  defaultValue="Calle 123, Bogotá"
                />
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <Button
                type="button"
                className="w-full max-w-md py-3.5"
                onClick={handleValidate}
                disabled={!canValidate}
              >
                Validar identidad
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <IdentityValidation
              onCancel={() => setValidating(false)}
              onComplete={handleValidationComplete}
            />
          </div>
        )}
      </div>
    </MainLayout>
  )
}
