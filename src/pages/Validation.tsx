import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Card from '../components/Card'
import Button from '../components/Button'
import Hito from '../components/Hito'
import { CheckIcon, ClockIcon } from '../components/icons'

/**
 * «Validación de huéspedes», la pantalla de la maqueta (15/10/2026).
 *
 * Se había borrado el 11/10 junto con las maquetas sin ruta; el cliente pidió
 * recuperar la interfaz tal cual. Va después de «Enviar información» y antes de
 * la descarga de la app, y enseña lo que quedó de cada persona con los datos de
 * verdad que le pasa la pantalla de acompañantes.
 *
 * Lo que **no** vuelve de la maqueta es el hito «Aceptación del anfitrión» y el
 * «Rechazado»: dependen de la revisión del anfitrión, que el huésped no ve
 * (KT: el huésped nunca ve nada de la verificación), y afirmar «pendiente de
 * aceptación» sería falso en la mayoría de las reservas.
 */
export interface HuespedValidado {
  nombre: string
  identificacion: string
  principal?: boolean
  esMenor?: boolean
  documentoSubido: boolean
  terminosAceptados: boolean
  exento?: boolean
}

interface Estado {
  acceso?: unknown
  huespedes?: HuespedValidado[]
}

export default function Validation() {
  const navigate = useNavigate()
  const estado = (useLocation().state as Estado | null) ?? null
  const huespedes = estado?.huespedes

  if (!huespedes || huespedes.length === 0) {
    return <Navigate to="/download-app" replace state={{ acceso: estado?.acceso }} />
  }

  return (
    <MainLayout header="default" bg="soft">
      <div className="mx-auto max-w-[820px] px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-center font-display text-3xl font-bold text-ink sm:text-[34px]">
          Validación de huéspedes
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-center text-base text-ink/60">
          Revisa el estado de cada huésped registrado antes de continuar.
        </p>

        <div className="mt-8 space-y-6">
          {huespedes.map((h, i) => {
            const completo = h.documentoSubido && (h.terminosAceptados || h.exento || h.esMenor)
            return (
              <Card key={i} className="overflow-hidden">
                <div className="px-6 py-6 sm:px-8 sm:py-7">
                  <div className="flex items-center gap-5">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${
                        completo ? 'bg-success/10 text-success' : 'bg-gold/10 text-gold'
                      }`}
                    >
                      {completo ? <CheckIcon className="h-8 w-8" /> : <ClockIcon className="h-8 w-8" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-ink">{h.nombre}</h3>
                        {h.principal && (
                          <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                            Principal
                          </span>
                        )}
                        {h.esMenor && (
                          <span className="rounded-full bg-gold/10 px-2.5 py-0.5 text-xs font-semibold text-gold">
                            Menor de edad
                          </span>
                        )}
                      </div>
                      {h.identificacion && (
                        <p className="mt-0.5 text-sm text-ink/60">Identificación: {h.identificacion}</p>
                      )}
                    </div>
                    <div
                      className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold ${
                        completo ? 'bg-success/10 text-success' : 'bg-gold/10 text-gold'
                      }`}
                    >
                      {completo ? 'Completo' : 'En revisión'}
                    </div>
                  </div>
                </div>
                <div className="border-t border-line px-6 py-4 sm:px-8">
                  <div className="space-y-1.5">
                    <Hito estado={h.documentoSubido ? 'hecho' : 'pendiente'}>
                      {h.documentoSubido ? 'Subida de documentos' : 'Documentos: los revisa la portería al llegar'}
                    </Hito>
                    {h.esMenor ? null : h.exento ? (
                      <Hito estado="exento">Exento de aceptación de Términos y Condiciones</Hito>
                    ) : (
                      <Hito estado={h.terminosAceptados ? 'hecho' : 'pendiente'}>
                        Aceptación de Términos y Condiciones
                      </Hito>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <Button
            type="button"
            className="w-full max-w-md py-3.5"
            onClick={() => navigate('/download-app', { state: { acceso: estado?.acceso } })}
          >
            Continuar
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}
