import { useState, useEffect } from 'react'
import Button from './Button'

interface IdentityValidationProps {
  onComplete: () => void
  onCancel: () => void
}

type Step = 'processing' | 'done'

export default function IdentityValidation({
  onComplete,
  onCancel,
}: IdentityValidationProps) {
  const [step, setStep] = useState<Step>('processing')

  useEffect(() => {
    const timer = setTimeout(() => {
      setStep('done')
    }, 2000)
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
