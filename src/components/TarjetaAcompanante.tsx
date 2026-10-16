import type { ReactNode } from 'react'
import Card from './Card'
import Checkbox from './Checkbox'
import FileUploader from './FileUploader'
import Recuadro from './Recuadro'
import Hito from './Hito'
import BloqueTutela from './BloqueTutela'
import {
  necesitaPermiso,
  PARENTESCOS,
  TIPOS_DOCUMENTO,
  type Acompanante,
  type AdultoDeLaEstancia,
} from '../lib/precheckin'

/**
 * La tarjeta de cada acompañante, con el aspecto de la maqueta (15/10/2026):
 * su nombre arriba, «Datos del acompañante» en recuadros, el bloque de tutela
 * si es menor, «Estado de validación» y la casilla de quien no puede aceptar.
 *
 * Todo lo que hace ya existía: aquí solo cambia cómo se ve. Lo que falta de
 * cada persona se dice en los hitos y se resuelve desde la propia tarjeta.
 */
interface Props {
  persona: Acompanante
  /** Su número en la reserva, para «Acompañante N» si aún no tiene nombre. */
  numero: number
  adultos: AdultoDeLaEstancia[]
  /** El motivo, si el titular declaró que no puede registrarse sola. */
  incapacidad?: string
  /** Si se está declarando por ella ahora mismo. */
  declarando: boolean
  subiendo: boolean
  onSubirDocumento: (archivo: File) => void
  onSubirCarta: (archivo: File) => void
  onSubirAdicional: (archivo: File) => void
  onNoPuedeAceptar: (activar: boolean) => void
  onRetirarDeclaracion: () => void
  onQuitar: () => void
  /** El formulario de declaración, cuando `declarando`. */
  children?: ReactNode
}

const etiquetaDoc = (tipo: string | null) =>
  TIPOS_DOCUMENTO.find((t) => t.value === tipo)?.label ?? ''

export default function TarjetaAcompanante({
  persona,
  numero,
  adultos,
  incapacidad,
  declarando,
  subiendo,
  onSubirDocumento,
  onSubirCarta,
  onSubirAdicional,
  onNoPuedeAceptar,
  onRetirarDeclaracion,
  onQuitar,
  children,
}: Props) {
  const titulo = persona.nombre?.trim() || `Acompañante ${numero}`
  const responsable = adultos.find((a) => a.id === persona.responsable_id)
  // «Otra persona» ya no se ofrece, pero puede venir en fichas antiguas.
  const parentesco =
    PARENTESCOS.find((p) => p.value === persona.parentesco)?.label ??
    (persona.parentesco === 'otro' ? 'Otra persona' : undefined)

  return (
    <Card className="px-6 py-7 sm:px-10 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-ink">
          {titulo} {persona.apellidos ?? ''}
        </h3>
        <button
          type="button"
          onClick={onQuitar}
          className="text-xs font-semibold text-danger underline underline-offset-2"
          aria-label={`Quitar a ${persona.nombre}`}
        >
          Quitar
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {persona.es_menor && (
          <span className="inline-block rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
            Menor de edad
          </span>
        )}
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">
          Datos del acompañante
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Recuadro etiqueta="Nombres" value={persona.nombre} />
          <Recuadro etiqueta="Apellidos" value={persona.apellidos ?? ''} />
          <Recuadro etiqueta="Tipo de documento" value={etiquetaDoc(persona.tipo_documento)} />
          <Recuadro etiqueta="Número de documento" value={persona.documento_numero ?? ''} />
          {persona.es_menor ? (
            <Recuadro etiqueta="Fecha de nacimiento" value={persona.fecha_nacimiento ?? ''} />
          ) : (
            <>
              <Recuadro etiqueta="Teléfono" value={persona.telefono ?? ''} />
              <Recuadro etiqueta="Correo electrónico" value={persona.correo ?? ''} />
            </>
          )}
        </div>

        {persona.es_menor && (
          <BloqueTutela>
            <p className="text-sm text-ink/80">
              {responsable
                ? `Responde por el menor: ${responsable.nombre} ${responsable.apellidos ?? ''}`.trim() +
                  (parentesco ? ` (${parentesco})` : '')
                : 'Falta decir quién responde por el menor.'}
            </p>
            {necesitaPermiso(persona.parentesco) ? (
              persona.tiene_autorizacion ? (
                <>
                  <Hito estado="hecho">Carta de potestad / tutela notarial subida</Hito>
                  <FileUploader
                    key={`adicional-${persona.id}-${subiendo ? 's' : 'n'}`}
                    tone="soft"
                    compact
                    title="Documento adicional"
                    hint="Si la tutela viene en varias hojas. Foto o PDF."
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onFileSelected={(f) => f && onSubirAdicional(f)}
                  />
                </>
              ) : (
                <FileUploader
                  key={`carta-${persona.id}`}
                  tone="soft"
                  title="Carta de potestad / tutela notarial"
                  hint="Hace falta al no ser su padre ni su madre. Foto o PDF."
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onFileSelected={(f) => f && onSubirCarta(f)}
                />
              )
            ) : (
              <p className="text-xs text-ink/60">
                Viene con su padre o su madre: no hace falta carta de potestad.
              </p>
            )}
          </BloqueTutela>
        )}

        {!persona.es_menor && incapacidad && (
          <div className="rounded-xl bg-brand/5 px-4 py-3">
            <p className="text-xs font-semibold text-brand">
              Exento de aceptación de Términos y Condiciones — tú asumes la responsabilidad.
            </p>
            <p className="mt-1 text-xs text-ink/70">Motivo: {incapacidad}</p>
            <button
              type="button"
              onClick={onRetirarDeclaracion}
              className="mt-2 text-xs font-semibold text-brand underline underline-offset-2"
            >
              Retirar la declaración
            </button>
          </div>
        )}

        {/* La foto del documento la sube el titular para un menor o para quien
            no puede hacerlo por sí mismo; un adulto la sube desde su enlace. */}
        {!persona.tiene_documento && (persona.es_menor || incapacidad) && (
          <FileUploader
            key={`doc-${persona.id}`}
            tone="soft"
            compact
            title="Foto de su documento"
            hint="El frente, donde se ve la foto"
            accept="image/jpeg,image/png,image/webp"
            onFileSelected={(f) => f && onSubirDocumento(f)}
          />
        )}
        {subiendo && <p className="text-xs font-semibold text-brand">Subiendo…</p>}
      </div>

      <div className="mt-4 space-y-2 border-t border-line pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">
          Estado de validación
        </p>
        <Hito estado={persona.tiene_documento ? 'hecho' : 'pendiente'}>
          {persona.tiene_documento ? 'Validación de documentos' : 'Documentos pendientes de validación'}
        </Hito>
        {persona.es_menor ? (
          necesitaPermiso(persona.parentesco) ? (
            <Hito estado={persona.tiene_autorizacion ? 'hecho' : 'pendiente'}>
              {persona.tiene_autorizacion ? 'Documentación de tutela' : 'Documentación de tutela pendiente'}
            </Hito>
          ) : null
        ) : incapacidad ? (
          <Hito estado="exento">Exento de aceptación de términos</Hito>
        ) : (
          <Hito estado={persona.terminos_aceptados ? 'hecho' : 'pendiente'}>
            {persona.terminos_aceptados
              ? 'Términos y condiciones aceptados'
              : 'Términos y condiciones pendientes'}
          </Hito>
        )}
      </div>

      {!persona.es_menor && !incapacidad && !persona.terminos_aceptados && (
        <div className="mt-4 border-t border-line pt-4">
          <Checkbox
            label="Este usuario no está en capacidad de aceptar por su cuenta los Términos y Condiciones."
            checked={declarando}
            onChange={(e) => onNoPuedeAceptar(e.target.checked)}
          />
          {declarando && <div className="mt-4">{children}</div>}
        </div>
      )}
    </Card>
  )
}
