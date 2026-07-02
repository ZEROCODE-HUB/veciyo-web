import { useState, useEffect } from 'react'
import Button from './Button'
import FileUploader from './FileUploader'

interface IdentityValidationProps {
  docType: 'dni' | 'pasaporte'
  lastEntryDate?: string
  onComplete: () => void
  onCancel: () => void
}

type Step = 'processing' | 'upload' | 'done'

export default function IdentityValidation({
  docType,
  onComplete,
  onCancel,
}: IdentityValidationProps) {
  const [step, setStep] = useState<Step>('processing')
  const [frontDone, setFrontDone] = useState(false)
  const [backDone, setBackDone] = useState(false)
  const [passportDone, setPassportDone] = useState(false)
  const [selfieDone, setSelfieDone] = useState(false)

  const allUploadsDone =
    (docType === 'dni' ? frontDone && backDone : passportDone) && selfieDone

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
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="text-base font-semibold text-ink">Verificación en proceso...</p>
        </div>
      )}

      {step === 'upload' && (
        <div className="space-y-6">
          <p className="text-sm font-semibold text-ink">
            Sube las fotos de tu documento para continuar con la verificación.
          </p>

          {docType === 'dni' ? (
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

          <FileUploader
            tone="soft"
            title="Selfie"
            onFileSelected={() => setSelfieDone(true)}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => setStep('done')}
              disabled={!allUploadsDone}
            >
              Verificar
            </Button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="space-y-5">
          <div className="rounded-xl bg-success/5 px-5 py-4">
            <p className="text-sm font-semibold text-success">
              Identidad validada exitosamente
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="button" onClick={onComplete}>
              Continuar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
