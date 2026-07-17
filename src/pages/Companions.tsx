import { useState } from 'react'
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
  { value: 'dni', label: 'Cédula' },
  { value: 'pasaporte', label: 'Pasaporte' },
  { value: 'extranjero', label: 'Documento de identidad extranjero' },
  { value: 'otro', label: 'Otro' },
]

interface CompanionData {
  id: number
  type: 'adult' | 'minor'
  docType: string | null
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
  tutelaDocs: string[]
  dataExtracted: boolean
}

interface VehicleData {
  plate: string
  brand: string
  color: string
}

function createCompanion(id: number, type: 'adult' | 'minor'): CompanionData {
  return {
    id, type,
    docType: null, docNumber: '',
    frontDone: false, backDone: false, passportDone: false,
    firstName: '', lastName: '', phone: '', email: '',
    selfRegister: false, cantAcceptTyC: false,
    completed: false, tutelaDocs: [],
    dataExtracted: false,
  }
}

const MOCK_RESERVATION_COMPANIONS = [
  { id: 1, type: 'adult' as const },
  { id: 2, type: 'minor' as const },
]

const MOCK_EXTRACTED: Record<number, { firstName: string; lastName: string; docNumber: string; email?: string }> = {
  1: { firstName: 'María', lastName: 'González', docNumber: '98765432' },
  2: { firstName: 'Luis', lastName: 'González', docNumber: '12345678' },
}

export default function Companions() {
  const navigate = useNavigate()
  const location = useLocation()
  const mainGuest = location.state as {
    name?: string
    identification?: string
    docType?: string
    docTypeLabel?: string
    tycAccepted?: boolean
    hasVehicles?: boolean
    vehicleCount?: number
  } | null

  const [companions, setCompanions] = useState<CompanionData[]>(() =>
    MOCK_RESERVATION_COMPANIONS.map((c) => createCompanion(c.id, c.type))
  )
  const [vehicles, setVehicles] = useState<VehicleData[]>(() => {
    const count = mainGuest?.vehicleCount ?? 2
    return Array.from({ length: count }, () => ({ plate: '', brand: '', color: '' }))
  })
  const [submitted, setSubmitted] = useState(false)

  if (!mainGuest?.name) {
    return <Navigate to="/pre-check-in" replace />
  }

  const updateCompanion = (id: number, partial: Partial<CompanionData>) => {
    setCompanions((prev) => prev.map((c) => (c.id === id ? { ...c, ...partial } : c)))
  }

  const needsFrontAndBack = (dt: string | null) => dt === 'dni' || dt === 'extranjero' || dt === 'otro'

  const simulateExtraction = (id: number) => {
    const extracted = MOCK_EXTRACTED[id]
    if (!extracted) return
    updateCompanion(id, {
      dataExtracted: true,
      firstName: extracted.firstName,
      lastName: extracted.lastName,
      docNumber: extracted.docNumber,
    })
  }

  const isFormValid = (c: CompanionData) => {
    if (c.selfRegister) return c.email.trim().length > 0
    const docsOk = needsFrontAndBack(c.docType) ? c.frontDone && c.backDone : c.passportDone
    const extractedOrManual = c.dataExtracted || (c.docNumber.trim().length > 0 && c.firstName.trim().length > 0 && c.lastName.trim().length > 0)
    return (
      c.docType !== null &&
      docsOk &&
      extractedOrManual &&
      c.phone.trim().length > 0 &&
      c.email.trim().length > 0 &&
      (c.type === 'minor' ? c.tutelaDocs.length > 0 : true)
    )
  }

  const allHandled = companions.every(
    (c) => (c.completed) || (c.selfRegister && c.email.trim().length > 0)
  )

  const allVehiclesFilled = !mainGuest?.hasVehicles || vehicles.every((v) => v.plate.trim() && v.brand.trim() && v.color.trim())

  const handleSubmit = () => {
    localStorage.setItem('veciyo_registration_completed', 'true')
    setSubmitted(true)
  }

  const handleContinueToValidation = () => {
    const mainGuestValidation = {
      name: mainGuest.name!,
      identification: mainGuest.identification || 'N/A',
      status: 'approved' as const,
      isMain: true,
      docsValidated: true,
      tycAccepted: mainGuest?.tycAccepted ?? false,
      tycExempt: !mainGuest?.tycAccepted,
    }

    const companionValidations = companions.map((c) => ({
      name: c.firstName ? `${c.firstName} ${c.lastName}` : `Acompañante`,
      identification: c.docNumber || 'N/A',
      status: 'approved' as const,
      docsValidated: c.completed || c.cantAcceptTyC,
      tycAccepted: c.completed && !c.cantAcceptTyC,
      tycExempt: c.cantAcceptTyC,
    }))

    navigate('/validation', {
      state: {
        guests: [mainGuestValidation, ...companionValidations],
      },
    })
  }

  const getCompanionLabel = (comp: CompanionData, idx: number) => {
    if (comp.firstName && comp.lastName) {
      return `${comp.firstName} ${comp.lastName}`
    }
    return `Acompañante ${idx + 1}`
  }

  return (
    <MainLayout header="default" bg="soft">
      <div className="mx-auto max-w-[820px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-brand">Paso 3 de 3</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand/20">
            <div className="h-full w-full rounded-full bg-brand" />
          </div>
        </div>

        <h1 className="mt-4 font-display text-3xl font-extrabold text-ink sm:text-[34px]">
          Registro de acompañantes
        </h1>

        {/* Main guest card */}
        <Card className="mt-6 px-6 py-7 sm:px-10 sm:py-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">Huésped principal</p>
              <h3 className="mt-1.5 text-lg font-bold text-ink">{mainGuest.name}</h3>
              {mainGuest.docTypeLabel && (
                <p className="mt-1 text-sm font-semibold text-ink/70">
                  Tipo de documento: <span className="text-ink">{mainGuest.docTypeLabel}</span>
                </p>
              )}
              {mainGuest.identification && (
                <p className="mt-1 text-sm font-semibold text-ink/70">
                  Identificación: <span className="text-ink">{mainGuest.identification}</span>
                </p>
              )}
            </div>
          </div>
          {submitted && (
            <div className="mt-4 space-y-2 border-t border-line pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">Estado de validación</p>
              <div className="flex items-center gap-2 rounded-lg bg-success/5 px-3 py-2">
                <CheckIcon className="h-4 w-4 shrink-0 text-success" />
                <span className="text-xs font-semibold text-success">Validación de documentos</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-success/5 px-3 py-2">
                <CheckIcon className="h-4 w-4 shrink-0 text-success" />
                <span className="text-xs font-semibold text-success">
                  {mainGuest?.tycAccepted ? 'Términos y condiciones aceptados' : 'Exento de aceptación'}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-gold/10 px-3 py-2">
                <Loading size="sm" />
                <span className="text-xs font-semibold text-gold">Aceptación del anfitrión pendiente</span>
              </div>
            </div>
          )}
        </Card>

        {/* Vehicles */}
        {mainGuest?.hasVehicles && (
          <div className="mt-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">Vehículos</p>
            {vehicles.map((v, i) => (
              <Card key={i} className="px-6 py-5 sm:px-10 sm:py-6">
                <p className="mb-3 text-sm font-bold text-ink">Vehículo {i + 1}</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Input
                    label="Placa"
                    tone="soft"
                    placeholder="Ingrese la placa"
                    value={v.plate}
                    onChange={(e) => {
                      const next = [...vehicles]
                      next[i] = { ...next[i], plate: e.target.value }
                      setVehicles(next)
                    }}
                  />
                  <Input
                    label="Marca"
                    tone="soft"
                    placeholder="Ingrese la marca"
                    value={v.brand}
                    onChange={(e) => {
                      const next = [...vehicles]
                      next[i] = { ...next[i], brand: e.target.value }
                      setVehicles(next)
                    }}
                  />
                  <Input
                    label="Color"
                    tone="soft"
                    placeholder="Ingrese el color"
                    value={v.color}
                    onChange={(e) => {
                      const next = [...vehicles]
                      next[i] = { ...next[i], color: e.target.value }
                      setVehicles(next)
                    }}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Companion cards */}
        <div className="mt-6 space-y-6">
          {companions.map((comp, idx) => (
            <Card key={comp.id} className="px-6 py-7 sm:px-10 sm:py-8">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-ink">{getCompanionLabel(comp, idx)}</h3>
              </div>

              {/* Self-register option — only for adults */}
              {comp.type === 'adult' && !comp.cantAcceptTyC && !comp.completed && (
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
              {!comp.selfRegister && !comp.completed && (
                <div className="mt-5 space-y-4">
                  <Select
                    label="Tipo de documento"
                    tone="soft"
                    placeholder="Seleccione"
                    options={DOCUMENT_TYPES}
                    value={comp.docType || ''}
                    onChange={(e) => {
                      const val = e.target.value
                      updateCompanion(comp.id, {
                        docType: val || null,
                        docNumber: '',
                        frontDone: false,
                        backDone: false,
                        passportDone: false,
                        dataExtracted: false,
                      })
                    }}
                  />

                  {needsFrontAndBack(comp.docType) && (
                    <div className="space-y-3">
                      <FileUploader
                        tone="soft"
                        title="Foto del frente"
                        onFileSelected={() => {
                          updateCompanion(comp.id, { frontDone: true })
                          simulateExtraction(comp.id)
                        }}
                      />
                      <FileUploader
                        tone="soft"
                        title="Foto del reverso"
                        onFileSelected={() => {
                          updateCompanion(comp.id, { backDone: true })
                          simulateExtraction(comp.id)
                        }}
                      />
                    </div>
                  )}
                  {comp.docType === 'pasaporte' && (
                    <FileUploader
                      tone="soft"
                      title="Foto del pasaporte"
                      onFileSelected={() => {
                        updateCompanion(comp.id, { passportDone: true })
                        simulateExtraction(comp.id)
                      }}
                    />
                  )}

                  {comp.dataExtracted && (
                    <div className="space-y-3">
                      <div className="rounded-xl bg-success/5 px-4 py-3">
                        <p className="text-xs font-semibold text-success">
                          Datos extraídos automáticamente del documento:
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-surface-soft px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">Nombres</p>
                          <p className="text-sm font-bold text-ink">{comp.firstName || '—'}</p>
                        </div>
                        <div className="rounded-xl bg-surface-soft px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">Apellidos</p>
                          <p className="text-sm font-bold text-ink">{comp.lastName || '—'}</p>
                        </div>
                        <div className="rounded-xl bg-surface-soft px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">Número de documento</p>
                          <p className="text-sm font-bold text-ink">{comp.docNumber || '—'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      <div className="mb-4 rounded-lg bg-brand/5 px-4 py-3">
                        <p className="text-sm font-semibold text-ink">
                          Este condominio tiene principal interés en proteger la integridad de los menores de edad y prevenir la explotación comercial sexual de las niñas, niños y adolescentes.
                        </p>
                      </div>
                      <p className="mb-3 text-sm font-semibold text-ink">
                        Documentación de tutela requerida
                      </p>
                      {comp.tutelaDocs.map((_, di) => (
                        <div key={di} className="mb-3">
                          <FileUploader
                            tone="soft"
                            title={`Carta de potestad / tutela notarial ${di + 1}`}
                            onFileSelected={() => {
                              /* already tracked */
                            }}
                          />
                        </div>
                      ))}
                      <FileUploader
                        tone="soft"
                        title={
                          comp.tutelaDocs.length === 0
                            ? 'Carta de potestad / tutela notarial'
                            : `Documento adicional ${comp.tutelaDocs.length + 1}`
                        }
                        onFileSelected={() =>
                          updateCompanion(comp.id, {
                            tutelaDocs: [...comp.tutelaDocs, 'uploaded'],
                          })
                        }
                      />
                    </div>
                  )}

                  {/* Cannot accept TyC option — dentro del formulario antes del botón */}
                  <div className="border-t border-line pt-4">
                    <Checkbox
                      label="Este usuario no está en capacidad de aceptar los Términos y Condiciones."
                      checked={comp.cantAcceptTyC}
                      onChange={(e) => updateCompanion(comp.id, { cantAcceptTyC: e.target.checked })}
                    />
                  </div>

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

              {/* Summary view when completed */}
              {(comp.completed || comp.cantAcceptTyC) && (
                <div className="mt-5 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">Datos del acompañante</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-surface-soft px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">Nombres</p>
                      <p className="text-sm font-bold text-ink">{comp.firstName || '—'}</p>
                    </div>
                    <div className="rounded-xl bg-surface-soft px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">Apellidos</p>
                      <p className="text-sm font-bold text-ink">{comp.lastName || '—'}</p>
                    </div>
                    <div className="rounded-xl bg-surface-soft px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">Número de documento</p>
                      <p className="text-sm font-bold text-ink">{comp.docNumber || '—'}</p>
                    </div>
                    <div className="rounded-xl bg-surface-soft px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">Teléfono</p>
                      <p className="text-sm font-bold text-ink">{comp.phone || '—'}</p>
                    </div>
                    <div className="rounded-xl bg-surface-soft px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">Correo electrónico</p>
                      <p className="text-sm font-bold text-ink">{comp.email || '—'}</p>
                    </div>
                  </div>
                  {comp.cantAcceptTyC && (
                    <div className="rounded-xl bg-brand/5 px-4 py-3">
                      <p className="text-xs font-semibold text-brand">
                        Exento de aceptación de Términos y Condiciones — el anfitrión asume la responsabilidad.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Per-guest validation status */}
              {submitted && (
                <div className="mt-4 space-y-2 border-t border-line pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">Estado de validación</p>
                  {comp.completed || comp.cantAcceptTyC ? (
                    <div className="flex items-center gap-2 rounded-lg bg-success/5 px-3 py-2">
                      <CheckIcon className="h-4 w-4 shrink-0 text-success" />
                      <span className="text-xs font-semibold text-success">Validación de documentos</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg bg-gold/10 px-3 py-2">
                      <Loading size="sm" />
                      <span className="text-xs font-semibold text-gold">Documentos pendientes de validación</span>
                    </div>
                  )}
                  {comp.cantAcceptTyC ? (
                    <div className="flex items-center gap-2 rounded-lg bg-brand/5 px-3 py-2">
                      <CheckIcon className="h-4 w-4 shrink-0 text-brand" />
                      <span className="text-xs font-semibold text-brand">Exento de aceptación de términos</span>
                    </div>
                  ) : comp.completed ? (
                    <div className="flex items-center gap-2 rounded-lg bg-success/5 px-3 py-2">
                      <CheckIcon className="h-4 w-4 shrink-0 text-success" />
                      <span className="text-xs font-semibold text-success">Términos y condiciones aceptados</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg bg-gold/10 px-3 py-2">
                      <Loading size="sm" />
                      <span className="text-xs font-semibold text-gold">Términos y condiciones pendientes</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 rounded-lg bg-gold/10 px-3 py-2">
                    <Loading size="sm" />
                    <span className="text-xs font-semibold text-gold">Aceptación del anfitrión pendiente</span>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Individual companion links — shown after submit */}
        {submitted && (
          <div className="mt-6 rounded-xl border border-brand/20 bg-brand/5 px-6 py-5">
            <p className="text-sm font-bold text-ink">Links individuales para acompañantes</p>
            <p className="mt-1 text-xs text-ink/60">
              Cada acompañante recibirá su propio enlace para completar su parte del proceso.
            </p>
            <div className="mt-3 space-y-2">
              {companions.map((comp, idx) => (
                  <div key={comp.id} className="flex flex-col gap-1.5 rounded-lg bg-white px-3 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">{getCompanionLabel(comp, idx)}:</span>
                      <code className="flex-1 truncate text-brand">
                        https://veciyo.app/acceso/acompanante-{comp.id}-{Date.now()}
                      </code>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const name = getCompanionLabel(comp, idx)
                        const link = `https://veciyo.app/acceso/acompanante-${comp.id}-${Date.now()}`
                        const code = `ACC-${comp.id}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
                        const message = `Hola, ${name}. Completa tu Pre-Check-in utilizando este enlace: ${link}. Desde este mismo enlace también podrás consultar el estado de tu Pre-Check-in. Recuerda que tu código de acceso es: ${code}.`
                        navigator.clipboard.writeText(message)
                      }}
                      className="self-start text-xs font-semibold text-brand hover:text-brand-700"
                    >
                      Copiar mensaje completo
                    </button>
                  </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit */}
        {!submitted && (
          <div className="mt-10 flex justify-center border-t border-line pt-8">
            <Button
              type="button"
              className="w-full max-w-md py-3.5 text-base"
              onClick={handleSubmit}
              disabled={!allHandled || !allVehiclesFilled}
            >
              Enviar información
            </Button>
          </div>
        )}

        {/* Continue to validation */}
        {submitted && (
          <div className="mt-10 flex justify-center border-t border-line pt-8">
            <Button
              type="button"
              className="w-full max-w-md py-3.5 text-base"
              onClick={handleContinueToValidation}
            >
              Ver detalle de validación
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
