import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Accordion from '../components/Accordion'
import Checkbox from '../components/Checkbox'
import Button from '../components/Button'

const SECTIONS = [
  { id: 'terminos', title: 'Términos y Condiciones' },
  { id: 'datos', title: 'Tratamiento de Datos Personales' },
  { id: 'privacidad', title: 'Política de Privacidad' },
  { id: 'condominio', title: 'Términos y Condiciones del Condominio' },
]

const SECTION_CONTENT: Record<string, string> = {
  terminos:
    'Al utilizar este servicio, aceptas que los datos proporcionados sean procesados conforme a los términos establecidos. El incumplimiento de estos términos puede resultar en la suspensión del servicio.',
  datos:
    'Los datos personales recopilados serán tratados conforme a la normativa vigente de protección de datos. El responsable del tratamiento garantiza la confidencialidad, integridad y disponibilidad de la información proporcionada.',
  privacidad:
    'Esta política describe cómo recopilamos, usamos y protegemos tu información personal. Nos comprometemos a asegurar que tu privacidad esté protegida en todo momento.',
  condominio:
    'El huésped se compromete a cumplir con las normas internas del condominio, incluyendo horarios de acceso, uso de áreas comunes y comportamiento dentro de las instalaciones.',
}

export default function TermsAndConditions() {
  const navigate = useNavigate()
  const [accepted, setAccepted] = useState<Set<string>>(new Set())

  const allAccepted = SECTIONS.every((s) => accepted.has(s.id))

  const toggleAccept = (id: string) => {
    setAccepted((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleConfirm = () => {
    if (allAccepted) {
      navigate('/companions')
    }
  }

  return (
    <MainLayout header="default" bg="soft">
      <div className="mx-auto max-w-[640px] px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-center font-display text-3xl font-bold text-ink sm:text-[34px]">
          Términos y Condiciones
        </h1>

        <p className="mx-auto mt-3 max-w-md text-center text-base text-ink/60">
          Revisa y acepta cada sección para continuar.
        </p>

        <div className="mt-8">
          <Accordion
            sections={SECTIONS.map((s) => ({
              id: s.id,
              title: s.title,
              content: (
                <div className="space-y-3">
                  <p>{SECTION_CONTENT[s.id]}</p>
                  <Checkbox
                    label="Acepto esta sección"
                    checked={accepted.has(s.id)}
                    onChange={() => toggleAccept(s.id)}
                  />
                </div>
              ),
            }))}
          />
        </div>

        <div className="mt-10 flex justify-center">
          <Button
            type="button"
            className="w-full max-w-md py-3.5"
            disabled={!allAccepted}
            onClick={handleConfirm}
          >
            Confirmar y enviar
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}
