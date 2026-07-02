import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Input from '../components/Input'
import Button from '../components/Button'

export default function ConfirmData() {
  const navigate = useNavigate()
  const location = useLocation()
  const data = location.state as {
    docType?: string
    docNumber?: string
  } | null

  if (!data?.docType) {
    return <Navigate to="/pre-check-in" replace />
  }

  const handleConfirm = () => {
    navigate('/companions', {
      state: { name: 'Carlos Balazo', identification: data.docNumber },
    })
  }

  const docTypeLabel =
    data.docType === 'dni' ? 'Cédula / DNI' : data.docType === 'pasaporte' ? 'Pasaporte' : 'Cédula'

  return (
    <MainLayout header="default" bg="soft">
      <div className="mx-auto max-w-[640px] px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-center font-display text-3xl font-bold text-ink sm:text-[34px]">
          Confirma tus datos
        </h1>

        <div className="mt-8">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface-soft px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">Nombres</p>
              <p className="text-sm font-bold text-ink">Carlos</p>
            </div>
            <div className="rounded-xl bg-surface-soft px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">Apellidos</p>
              <p className="text-sm font-bold text-ink">Balazo</p>
            </div>
            <div className="rounded-xl bg-surface-soft px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">Tipo de documento</p>
              <p className="text-sm font-bold text-ink">{docTypeLabel}</p>
            </div>
            <div className="rounded-xl bg-surface-soft px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">Número de documento</p>
              <p className="text-sm font-bold text-ink">{data.docNumber}</p>
            </div>
          </div>

          <div className="mt-6 border-t border-line pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/50">
              Datos editables
            </p>
            <div className="space-y-3">
              <Input
                label="Número de teléfono"
                type="tel"
                placeholder="Ingrese su número de teléfono"
                defaultValue=""
              />
              <Input
                label="Dirección de residencia"
                placeholder="Ingrese su dirección de residencia"
                defaultValue=""
              />
            </div>
          </div>

          <div className="flex justify-center pt-6">
            <Button
              type="button"
              className="w-full max-w-md py-3.5"
              onClick={handleConfirm}
            >
              Confirmar y enviar
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
