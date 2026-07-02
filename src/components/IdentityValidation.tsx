import { useState, useEffect } from 'react'
import Checkbox from './Checkbox'
import Button from './Button'
import Accordion from './Accordion'

interface IdentityValidationProps {
  onComplete: () => void
  onCancel: () => void
}

type Step = 'processing' | 'tc'

export default function IdentityValidation({
  onComplete,
  onCancel,
}: IdentityValidationProps) {
  const [step, setStep] = useState<Step>('processing')
  const [tcAccepted, setTcAccepted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setStep('tc')
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  const handleConfirm = () => {
    if (tcAccepted) {
      onComplete()
    }
  }

  return (
    <div className="rounded-card border border-line bg-white px-6 py-8 shadow-card sm:px-10 sm:py-10">
      {step === 'processing' && (
        <div className="flex flex-col items-center gap-4 py-10">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="text-base font-semibold text-ink">Validando tu identidad...</p>
        </div>
      )}

      {step === 'tc' && (
        <div className="space-y-5">
          <div className="rounded-xl bg-success/5 px-5 py-4">
            <p className="text-sm font-semibold text-success">
              Identidad validada exitosamente
            </p>
          </div>

          <Accordion
            sections={[
              {
                id: 'terminos',
                title: 'Términos y Condiciones',
                content: (
                  <div className="space-y-3">
                    <p>
                      Al utilizar este servicio de validación de identidad, aceptas que los
                      datos proporcionados sean procesados por el proveedor de verificación.
                    </p>
                    <p>
                      Tus datos serán utilizados únicamente para fines de verificación de
                      identidad y no serán compartidos con terceros sin tu consentimiento
                      explícito.
                    </p>
                    <p>
                      La fotografía y documentos proporcionados serán almacenados de forma
                      segura durante el tiempo necesario para completar el proceso de registro.
                    </p>
                    <p>
                      Puedes solicitar la eliminación de tus datos en cualquier momento
                      contactando a nuestro equipo de soporte.
                    </p>
                  </div>
                ),
              },
              {
                id: 'datos',
                title: 'Tratamiento de Datos Personales',
                content: (
                  <p>
                    Los datos personales recopilados serán tratados conforme a la normativa
                    vigente de protección de datos. El responsable del tratamiento garantiza
                    la confidencialidad, integridad y disponibilidad de la información
                    proporcionada.
                  </p>
                ),
              },
              {
                id: 'privacidad',
                title: 'Política de Privacidad',
                content: (
                  <p>
                    Esta política describe cómo recopilamos, usamos y protegemos tu
                    información personal. Nos comprometemos a asegurar que tu privacidad esté
                    protegida en todo momento.
                  </p>
                ),
              },
              {
                id: 'condominio',
                title: 'Términos y Condiciones del Condominio',
                content: (
                  <p>
                    El huésped se compromete a cumplir con las normas internas del
                    condominio, incluyendo horarios de acceso, uso de áreas comunes y
                    comportamiento dentro de las instalaciones.
                  </p>
                ),
              },
            ]}
          />

          <div className="flex items-center gap-2">
            <Checkbox
              label=""
              checked={tcAccepted}
              onChange={(e) => setTcAccepted(e.target.checked)}
            />
            <span className="text-sm text-ink">Acepto los Términos y Condiciones</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={!tcAccepted}
            >
              Finalizar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
