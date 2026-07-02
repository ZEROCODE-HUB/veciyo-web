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
  const [accepted, setAccepted] = useState(false)

  const handleConfirm = () => {
    if (accepted) {
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
          Revisa los documentos y acepta para continuar.
        </p>

        <div className="mt-8">
          <Accordion
            sections={SECTIONS.map((s) => ({
              id: s.id,
              title: s.title,
              content: <p>{SECTION_CONTENT[s.id]}</p>,
            }))}
          />
        </div>

        <div className="mt-8 flex items-start gap-3">
          <Checkbox
            label="Acepto los términos y condiciones"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
        </div>

        <div className="mt-10 flex justify-center">
          <Button
            type="button"
            className="w-full max-w-md py-3.5"
            disabled={!accepted}
            onClick={handleConfirm}
          >
            Confirmar y enviar
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}
