import { useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Input from '../components/Input'
import Select from '../components/Select'
import Button from '../components/Button'
import Accordion from '../components/Accordion'
import Checkbox from '../components/Checkbox'
import {
  aceptarTerminos,
  guardarFicha,
  MOTIVOS,
  TIPOS_DOCUMENTO,
  tokenActual,
  type Motivo,
  type TipoDocumento,
} from '../lib/precheckin'

const TYC_SECTIONS = [
  { id: 'terminos', title: 'Términos y Condiciones' },
  { id: 'datos', title: 'Tratamiento de Datos Personales' },
  { id: 'privacidad', title: 'Política de Privacidad' },
  { id: 'condominio', title: 'Términos y Condiciones del Condominio' },
]

const TYC_CONTENT: Record<string, string> = {
  terminos:
    'Al utilizar este servicio, aceptas que los datos proporcionados sean procesados conforme a los términos establecidos. El incumplimiento de estos términos puede resultar en la suspensión del servicio.',
  datos:
    'Los datos personales recopilados serán tratados conforme a la normativa vigente de protección de datos. El responsable del tratamiento garantiza la confidencialidad, integridad y disponibilidad de la información proporcionada.',
  privacidad:
    'Esta política describe cómo recopilamos, usamos y protegemos tu información personal. Nos comprometemos a asegurar que tu privacidad esté protegida en todo momento.',
  condominio:
    'El huésped se compromete a cumplir con las normas internas del condominio, incluyendo horarios de acceso, uso de áreas comunes y comportamiento dentro de las instalaciones.',
}

/**
 * Los datos del titular.
 *
 * Aquí se perdían: el teléfono, la dirección y el motivo eran `<Input
 * defaultValue>` sin nadie que los leyera, y «Confirmar y continuar» los
 * tiraba y navegaba con «Carlos Balazo» cableado. Ahora se escriben con
 * `guardar_precheckin`.
 *
 * El título decía «Los datos fueron extraídos automáticamente de tu
 * documento». No lo estaban: no hay lector de documentos contratado. Decirlo
 * hacía que alguien diera por buenos unos datos que en realidad estaban en
 * blanco, así que ahora se piden. Cuando exista el lector, esta pantalla
 * seguirá sirviendo tal cual: llegará con los campos llenos en vez de vacíos.
 */
export default function ConfirmData() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = tokenActual()
  const docType = (location.state as { docType?: TipoDocumento } | null)?.docType

  const [nombre, setNombre] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [documento, setDocumento] = useState('')
  const [correo, setCorreo] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [motivo, setMotivo] = useState<Motivo | ''>('')
  const [aceptados, setAceptados] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!token || !docType) {
    return <Navigate to="/pre-check-in" replace />
  }

  const etiquetaDoc =
    TIPOS_DOCUMENTO.find((t) => t.value === docType)?.label ?? docType

  /*
    La misma validación que hace la base, para poder decir qué falta antes de
    ir y volver por red. La base la repite de todos modos: es el límite, no
    este formulario.
  */
  const completo =
    nombre.trim() !== '' &&
    apellidos.trim() !== '' &&
    documento.trim() !== '' &&
    correo.includes('@') &&
    aceptados

  const confirmar = async () => {
    if (!completo || guardando) return
    setGuardando(true)
    setError(null)
    try {
      await guardarFicha(token, {
        nombre: nombre.trim(),
        apellidos: apellidos.trim(),
        tipoDocumento: docType,
        documento: documento.trim(),
        correo: correo.trim(),
        telefono: telefono.trim() || undefined,
        direccion: direccion.trim() || undefined,
        motivo: motivo || undefined,
      })
      // Dos llamadas y no una: aceptar los términos es un hecho con fecha y
      // con consecuencias legales, no un campo más de la ficha.
      await aceptarTerminos(token)
      navigate('/companions', { state: { nombre: `${nombre} ${apellidos}` } })
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No pudimos guardar tus datos',
      )
      setGuardando(false)
    }
  }

  return (
    <MainLayout header="default" bg="soft">
      <div className="mx-auto max-w-[640px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-brand">Paso 2 de 3</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand/20">
            <div className="h-full w-2/3 rounded-full bg-brand" />
          </div>
        </div>

        <h1 className="mt-6 text-center font-display text-3xl font-bold text-ink sm:text-[34px]">
          Tus datos
        </h1>

        <p className="mx-auto mt-3 max-w-md text-center text-base text-ink/60">
          Escríbelos tal como figuran en tu {etiquetaDoc.toLowerCase()}. La
          portería los compara con el documento cuando llegues.
        </p>

        <div className="mt-8 space-y-3">
          <Input
            label="Nombres"
            tone="soft"
            placeholder="Como figura en el documento"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <Input
            label="Apellidos"
            tone="soft"
            placeholder="Como figuran en el documento"
            value={apellidos}
            onChange={(e) => setApellidos(e.target.value)}
          />
          <div className="rounded-xl bg-surface-soft px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">
              Tipo de identificación
            </p>
            <p className="text-sm font-bold text-ink">{etiquetaDoc}</p>
          </div>
          <Input
            label="Número de identificación"
            tone="soft"
            placeholder="Sin puntos ni guiones"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
          />
          <Input
            label="Correo electrónico"
            type="email"
            tone="soft"
            placeholder="correo@ejemplo.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
          <p className="px-1 text-xs text-ink/60">
            A este correo te llega el acceso a la aplicación, donde vas a ver
            la clave del wifi y el código de la puerta.
          </p>
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/50">
            Datos adicionales
          </p>
          <div className="space-y-3">
            <Input
              label="Número de teléfono"
              type="tel"
              tone="soft"
              placeholder="Ingrese su número de teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
            <Input
              label="Dirección de residencia"
              tone="soft"
              placeholder="Tu domicilio habitual, no el del alojamiento"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
            />
            <Select
              label="Motivo de alojamiento"
              tone="soft"
              placeholder="Seleccione un motivo"
              options={MOTIVOS as unknown as { value: string; label: string }[]}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value as Motivo | '')}
            />
          </div>
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/50">
            Términos y condiciones
          </p>
          <Accordion
            sections={TYC_SECTIONS.map((s) => ({
              id: s.id,
              title: s.title,
              content: <p>{TYC_CONTENT[s.id]}</p>,
            }))}
          />
          <div className="mt-6 flex items-start gap-3">
            <Checkbox
              label="Acepto los términos y condiciones"
              checked={aceptados}
              onChange={(e) => setAceptados(e.target.checked)}
            />
          </div>
        </div>

        {error && (
          <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-center pt-6">
          <Button
            type="button"
            className="w-full max-w-md py-3.5"
            disabled={!completo || guardando}
            onClick={confirmar}
          >
            {guardando ? 'Guardando…' : 'Confirmar y continuar'}
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}
