import { useState, useEffect } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Card from '../components/Card'
import Input from '../components/Input'
import Select from '../components/Select'
import Checkbox from '../components/Checkbox'
import FileUploader from '../components/FileUploader'
import Button from '../components/Button'
import Loading from '../components/Loading'
import { CheckIcon } from '../components/icons'

const DOCUMENT_TYPES = [
  { value: 'dni', label: 'Cédula / DNI' },
  { value: 'pasaporte', label: 'Pasaporte' },
]

interface CompanionData {
  id: number
  type: 'adult' | 'minor'
  docType: 'dni' | 'pasaporte' | null
  docNumber: string
  frontDone: boolean
  backDone: boolean
  passportDone: boolean
  firstName: string
  lastName: string
  phone: string
  email: string
  selfRegister: boolean
  cantAcceptTyC: boolean
  completed: boolean
  tutelaUploaded: boolean
}

function createCompanion(id: number, type: 'adult' | 'minor'): CompanionData {
  return {
    id, type,
    docType: null, docNumber: '',
    frontDone: false, backDone: false, passportDone: false,
    firstName: '', lastName: '', phone: '', email: '',
    selfRegister: false, cantAcceptTyC: false,
    completed: false, tutelaUploaded: false,
  }
}

const MOCK_RESERVATION_COMPANIONS = [
  { id: 1, type: 'adult' as const },
  { id: 2, type: 'minor' as const },
]

export default function Companions() {
  const navigate = useNavigate()
  const location = useLocation()
  const mainGuest = location.state as {
    name?: string
    identification?: string
  } | null

  const [companions, setCompanions] = useState<CompanionData[]>(() =>
    MOCK_RESERVATION_COMPANIONS.map((c) => createCompanion(c.id, c.type))
  )
  const [policeVerified, setPoliceVerified] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setPoliceVerified(true), 6000)
    return () => clearTimeout(timer)
  }, [])

  if (!mainGuest?.name) {
    return <Navigate to="/pre-check-in" replace />
  }

  const updateCompanion = (id: number, partial: Partial<CompanionData>) => {
    setCompanions((prev) => prev.map((c) => (c.id === id ? { ...c, ...partial } : c)))
  }

  const isFormValid = (c: CompanionData) => {
    if (c.selfRegister) return c.email.trim().length > 0
    return (
      c.docType !== null &&
      c.docNumber.trim().length > 0 &&
      (c.docType === 'dni' ? c.frontDone && c.backDone : c.passportDone) &&
      c.firstName.trim().length > 0 &&
      c.lastName.trim().length > 0 &&
      c.phone.trim().length > 0 &&
      c.email.trim().length > 0 &&
      (c.type === 'minor' ? c.tutelaUploaded : true)
    )
  }

  const allHandled = companions.every(
    (c) => c.cantAcceptTyC || c.completed || (c.selfRegister && c.email.trim().length > 0)
  )

  const handleSubmit = () => {
    navigate('/validation', {
      state: {
        guests: [
          {
            name: mainGuest.name!,
            identification: mainGuest.identification || 'N/A',
            status: 'approved' as const,
            isMain: true,
          },
        ],
      },
    })
  }

  return (
    <MainLayout header="default" bg="soft">
      <div className="mx-auto max-w-[820px] px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-extrabold text-ink sm:text-[34px]">
          Registro de acompañantes
        </h1>

        {/* Main guest card */}
        <Card className="mt-6 px-6 py-7 sm:px-10 sm:py-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">Huésped principal</p>
              <h3 className="mt-1.5 text-lg font-bold text-ink">{mainGuest.name}</h3>
              {mainGuest.identification && (
                <p className="mt-1 text-sm font-semibold text-ink/70">
                  Identificación: <span className="text-ink">{mainGuest.identification}</span>
                </p>
              )}
            </div>
          </div>
          <div className="mt-5 space-y-3 border-t border-line pt-5">
            <div className="flex items-center gap-3 rounded-lg bg-success/5 px-4 py-3">
              <CheckIcon className="h-5 w-5 shrink-0 text-success" />
              <span className="text-sm font-semibold text-success">TRA/SIRE verificado</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg px-4 py-3" style={{ backgroundColor: policeVerified ? 'rgba(18,115,212,0.05)' : 'rgba(242,186,13,0.05)' }}>
              {policeVerified ? (
                <>
                  <CheckIcon className="h-5 w-5 shrink-0 text-success" />
                  <span className="text-sm font-semibold text-success">
                    Verificación policial y judicial completada.
                  </span>
                </>
              ) : (
                <>
                  <Loading size="sm" />
                  <span className="text-sm font-semibold text-gold">
                    Verificación policial y judicial en proceso...
                  </span>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Vehicles info */}
        <div className="mt-6 rounded-card bg-white px-6 py-5 shadow-card sm:px-10 sm:py-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">Vehículos</p>
          <p className="mt-1 text-base font-bold text-ink">2 vehículos incluidos en la reserva</p>
        </div>

        {/* Companion cards */}
        <div className="mt-6 space-y-6">
          {companions.map((comp, idx) => (
            <Card key={comp.id} className="px-6 py-7 sm:px-10 sm:py-8">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-ink">Acompañante {idx + 1}</h3>
                {comp.cantAcceptTyC && (
                  <span className="inline-block rounded-full bg-brand/10 px-4 py-1.5 text-sm font-bold text-brand">
                    Pendiente de aceptación por parte del propietario
                  </span>
                )}
                {comp.completed && !comp.cantAcceptTyC && (
                  <span className="inline-block rounded-full bg-gold/10 px-4 py-1.5 text-sm font-bold text-gold">
                    Pendiente de aceptación de Términos y Condiciones
                  </span>
                )}
              </div>

              {comp.type === 'minor' && !comp.cantAcceptTyC && (
                <div className="mt-3">
                  <span className="inline-block rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
                    Menor de edad
                  </span>
                </div>
              )}

              {/* Self-register option */}
              {!comp.cantAcceptTyC && !comp.completed && (
                <div className="mt-5">
                  <Checkbox
                    label="Este acompañante completará su documentación y sus datos por sí mismo."
                    checked={comp.selfRegister}
                    onChange={(e) => updateCompanion(comp.id, { selfRegister: e.target.checked })}
                  />
                </div>
              )}

              {/* Self-register message */}
              {comp.selfRegister && !comp.cantAcceptTyC && !comp.completed && (
                <div className="mt-5 space-y-4">
                  <div className="rounded-xl bg-brand/5 px-5 py-4">
                    <p className="text-sm leading-relaxed text-ink/80">
                      Este acompañante completará su documentación y sus datos por sí mismo. Se le enviará un enlace a su correo electrónico.
                    </p>
                  </div>
                  <Input
                    label="Correo electrónico del acompañante"
                    type="email"
                    tone="soft"
                    placeholder="correo@ejemplo.com"
                    value={comp.email}
                    onChange={(e) => updateCompanion(comp.id, { email: e.target.value })}
                  />
                </div>
              )}

              {/* Companion form */}
              {!comp.selfRegister && !comp.cantAcceptTyC && !comp.completed && (
                <div className="mt-5 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Select
                      label="Tipo de documento"
                      tone="soft"
                      placeholder="Seleccione"
                      options={DOCUMENT_TYPES}
                      value={comp.docType || ''}
                      onChange={(e) => {
                        const val = e.target.value as 'dni' | 'pasaporte' | ''
                        updateCompanion(comp.id, {
                          docType: val || null,
                          docNumber: '',
                          frontDone: false,
                          backDone: false,
                          passportDone: false,
                        })
                      }}
                    />
                    <Input
                      label="Número de documento"
                      tone="soft"
                      placeholder="Ingrese el número"
                      value={comp.docNumber}
                      onChange={(e) => updateCompanion(comp.id, { docNumber: e.target.value })}
                    />
                  </div>

                  {comp.docType === 'dni' && (
                    <div className="space-y-3">
                      <FileUploader
                        tone="soft"
                        title="Foto del frente"
                        onFileSelected={() => updateCompanion(comp.id, { frontDone: true })}
                      />
                      <FileUploader
                        tone="soft"
                        title="Foto del reverso"
                        onFileSelected={() => updateCompanion(comp.id, { backDone: true })}
                      />
                    </div>
                  )}
                  {comp.docType === 'pasaporte' && (
                    <FileUploader
                      tone="soft"
                      title="Foto del pasaporte"
                      onFileSelected={() => updateCompanion(comp.id, { passportDone: true })}
                    />
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="Nombres"
                      tone="soft"
                      placeholder="Ingrese los nombres"
                      value={comp.firstName}
                      onChange={(e) => updateCompanion(comp.id, { firstName: e.target.value })}
                    />
                    <Input
                      label="Apellidos"
                      tone="soft"
                      placeholder="Ingrese los apellidos"
                      value={comp.lastName}
                      onChange={(e) => updateCompanion(comp.id, { lastName: e.target.value })}
                    />
                    <Input
                      label="Teléfono"
                      type="tel"
                      tone="soft"
                      placeholder="Ingrese el teléfono"
                      value={comp.phone}
                      onChange={(e) => updateCompanion(comp.id, { phone: e.target.value })}
                    />
                    <Input
                      label="Correo electrónico"
                      type="email"
                      tone="soft"
                      placeholder="correo@ejemplo.com"
                      value={comp.email}
                      onChange={(e) => updateCompanion(comp.id, { email: e.target.value })}
                    />
                  </div>

                  {comp.type === 'minor' && (
                    <div className="rounded-xl bg-gold/5 px-5 py-4">
                      <p className="mb-3 text-sm font-semibold text-ink">
                        Documentación de tutela requerida
                      </p>
                      <FileUploader
                        tone="soft"
                        title="Carta de potestad / tutela notarial"
                        onFileSelected={() => updateCompanion(comp.id, { tutelaUploaded: true })}
                      />
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button
                      type="button"
                      onClick={() => updateCompanion(comp.id, { completed: true })}
                      disabled={!isFormValid(comp)}
                    >
                      Completar registro
                    </Button>
                  </div>
                </div>
              )}

              {/* Cannot accept TyC option */}
              {!comp.cantAcceptTyC && (comp.completed || comp.selfRegister) && (
                <div className="mt-5 border-t border-line pt-5">
                  <Checkbox
                    label="Este usuario no está en capacidad de aceptar los Términos y Condiciones."
                    checked={comp.cantAcceptTyC}
                    onChange={(e) => updateCompanion(comp.id, { cantAcceptTyC: e.target.checked })}
                  />
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Submit */}
        <div className="mt-10 flex justify-center border-t border-line pt-8">
          <Button
            type="button"
            className="w-full max-w-md py-3.5 text-base"
            onClick={handleSubmit}
            disabled={!allHandled}
          >
            Enviar información
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}
