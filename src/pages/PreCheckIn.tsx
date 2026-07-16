import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Select from '../components/Select'
import Button from '../components/Button'
import FileUploader from '../components/FileUploader'
import Loading from '../components/Loading'

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

type Phase = 'instruction' | 'step1' | 'processing'

export default function PreCheckIn() {
  const navigate = useNavigate()
  const location = useLocation()
  const recurringData = location.state as Record<string, unknown> | null

  const [phase, setPhase] = useState<Phase>('instruction')
  const [docType, setDocType] = useState<string | null>(null)
  const [frontDone, setFrontDone] = useState(false)
  const [backDone, setBackDone] = useState(false)
  const [passportDone, setPassportDone] = useState(false)

  const needsFrontAndBack = docType === 'dni' || docType === 'extranjero' || docType === 'otro'
  const allUploadsDone = needsFrontAndBack ? frontDone && backDone : passportDone

  useEffect(() => {
    if (phase !== 'processing') return
    const timer = setTimeout(() => {
      navigate('/confirm-data', {
        state: {
          docType,
          docTypeLabel: DOC_TYPE_LABELS[docType!] || docType,
          ...(recurringData?.isRecurring
            ? {
                firstName: recurringData.firstName || 'Carlos',
                lastName: recurringData.lastName || 'Balazo',
                docNumber: recurringData.identification || '1616516',
                phone: recurringData.phone || '',
                address: recurringData.address || '',
                email: recurringData.email || '',
              }
            : {
                firstName: 'Carlos',
                lastName: 'Balazo',
                docNumber: '1616516',
                phone: '',
                address: '',
                email: '',
              }),
        },
      })
    }, 1500)
    return () => clearTimeout(timer)
  }, [phase, navigate])

  return (
    <MainLayout header="default" bg="soft">
      <div className="mx-auto max-w-[640px] px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-extrabold leading-snug text-ink sm:text-[40px] sm:leading-tight">
          Bienvenido {recurringData?.firstName ? String(recurringData.firstName) : 'Carlos Balazo'}, este es el preregistro de seguridad del edificio Los Pinos.
        </h1>

        {phase === 'instruction' && (
          <>
            <p className="mt-4 text-base leading-relaxed text-ink/70 sm:mt-6">
              Completa tu registro de ingreso al condominio. Ten a la mano lo siguiente:
            </p>
            <ul className="mt-3 space-y-2 text-base leading-relaxed text-ink/70">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                Dirección de residencia
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                Correos electrónicos de contacto
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                Placas de los vehículos
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                Documentos de todos los huéspedes
              </li>
              <li className="flex items-start gap-2 font-semibold text-ink">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                Esto solo te tomará 2 minutos
              </li>
            </ul>

            <div className="flex justify-center pt-8">
              <Button
                type="button"
                className="w-full max-w-md py-3.5"
                onClick={() => setPhase('step1')}
              >
                Comencemos
              </Button>
            </div>
          </>
        )}

        {phase === 'step1' && (
          <>
            <div className="mt-6 flex items-center gap-3">
              <span className="text-sm font-bold text-brand">Paso 1 de 3</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand/20">
                <div className="h-full w-1/3 rounded-full bg-brand" />
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <Select
                label="Tipo de documento"
                tone="soft"
                placeholder="Seleccione"
                options={DOCUMENT_TYPES}
                value={docType || ''}
                onChange={(e) => {
                  const val = e.target.value
                  setDocType(val || null)
                  setFrontDone(false)
                  setBackDone(false)
                  setPassportDone(false)
                }}
              />

              {docType && (
                <div className="space-y-4">
                  {needsFrontAndBack ? (
                    <>
                      <FileUploader
                        tone="soft"
                        title="Foto del frente del documento"
                        onFileSelected={() => setFrontDone(true)}
                      />
                      <FileUploader
                        tone="soft"
                        title="Foto del reverso del documento"
                        onFileSelected={() => setBackDone(true)}
                      />
                    </>
                  ) : (
                    <FileUploader
                      tone="soft"
                      title="Foto del pasaporte"
                      onFileSelected={() => setPassportDone(true)}
                    />
                  )}
                </div>
              )}

              <div className="flex justify-center pt-2">
                <Button
                  type="button"
                  className="w-full max-w-md py-3.5"
                  onClick={() => setPhase('processing')}
                  disabled={!docType || !allUploadsDone}
                >
                  Continuar
                </Button>
              </div>
            </div>
          </>
        )}

        {phase === 'processing' && (
          <div className="mt-10 flex flex-col items-center gap-4 py-10">
            <Loading />
            <p className="text-base font-semibold text-ink">Extrayendo datos del documento...</p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
