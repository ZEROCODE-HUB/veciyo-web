import { useState, useEffect } from 'react'
import Button from './Button'
import FileUploader from './FileUploader'
import Loading from './Loading'

interface IdentityValidationProps {
  docType: string
  lastEntryDate?: string
  onComplete: () => void
  onCancel: () => void
}

type Step = 'processing' | 'upload'

export default function IdentityValidation({
  docType,
  onComplete,
  onCancel,
}: IdentityValidationProps) {
  const [step, setStep] = useState<Step>('processing')
  const [frontDone, setFrontDone] = useState(false)
  const [backDone, setBackDone] = useState(false)
  const [passportDone, setPassportDone] = useState(false)

  const needsFrontAndBack = docType === 'dni' || docType === 'extranjero' || docType === 'otro'
  const allUploadsDone =
    needsFrontAndBack ? frontDone && backDone : passportDone

  useEffect(() => {
    const timer = setTimeout(() => {
      setStep('upload')
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="rounded-card border border-line bg-white px-6 py-8 shadow-card sm:px-10 sm:py-10">
      {step === 'processing' && (
        <div className="flex flex-col items-center gap-4 py-10">
          <Loading />
          <p className="text-base font-semibold text-ink">Verificación en proceso...</p>
        </div>
      )}

      {step === 'upload' && (
        <div className="space-y-6">
          <p className="text-sm font-semibold text-ink">
            Sube las fotos de tu documento para continuar con la verificación.
          </p>

          {needsFrontAndBack ? (
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
          ) : (
            <div className="space-y-4">
              <FileUploader
                tone="soft"
                title="Pasaporte"
                onFileSelected={() => setPassportDone(true)}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={onComplete}
              disabled={!allUploadsDone}
            >
              Continuar
            </Button>
          </div>
        </div>
      )}

    </div>
  )
}
