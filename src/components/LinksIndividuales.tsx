import { useState } from 'react'
import type { Acompanante } from '../lib/precheckin'

/**
 * Copia un texto y dice si pudo.
 *
 * «En la computadora no se puede copiar el enlace, en el celular sí» (Para
 * Claude, 21/10/2026). En Chrome de escritorio `navigator.clipboard.writeText`
 * se quedaba **esperando** --comprobado: la promesa no se resolvía ni fallaba--
 * y el botón no decía nada. Primero se copia por el camino directo, que es
 * síncrono y va dentro del clic; si no, el portapapeles del sistema con un
 * límite de espera.
 */
export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    const area = document.createElement('textarea')
    area.value = texto
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    if (ok) return true
  } catch {
    // Se prueba el otro camino.
  }
  if (!navigator.clipboard?.writeText) return false
  const espera = new Promise<boolean>((r) => setTimeout(() => r(false), 1500))
  const copia = navigator.clipboard.writeText(texto).then(
    () => true,
    () => false,
  )
  return Promise.race([copia, espera])
}

export default function LinksIndividuales({
  personas,
  enlaces,
  onGenerar,
}: {
  /** Los adultos a los que todavía les falta algo de su parte. */
  personas: Acompanante[]
  /** Los enlaces emitidos en esta visita a la pantalla, por persona. */
  enlaces: Record<string, string>
  onGenerar: (persona: Acompanante) => void
}) {
  /** Por persona: si el último intento de copiar salió bien o no. */
  const [copiado, setCopiado] = useState<Record<string, boolean>>({})

  if (personas.length === 0) return null

  const mensaje = (persona: Acompanante, url: string) =>
    `Hola, ${persona.nombre}. Completa tu preregistro con este enlace: ${url}. Desde el mismo enlace puedes ver cómo va.`

  const copiar = async (persona: Acompanante, url: string) => {
    const ok = await copiarTexto(mensaje(persona, url))
    setCopiado((c) => ({ ...c, [persona.id]: ok }))
  }

  return (
    <div className="mt-6 rounded-xl border border-brand/20 bg-brand/5 px-6 py-5">
      <p className="text-sm font-bold text-ink">Links individuales para acompañantes</p>
      <p className="mt-1 text-xs text-ink/60">
        Cada acompañante recibirá su propio enlace para completar su parte del proceso.
      </p>
      <div className="mt-3 space-y-2">
        {personas.map((persona) => {
          const url = enlaces[persona.id]
          return (
            <div key={persona.id} className="flex flex-col gap-1.5 rounded-lg bg-white px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink">{persona.nombre}:</span>
                {url ? (
                  <code className="flex-1 truncate text-brand">{url}</code>
                ) : (
                  <span className="flex-1 text-ink/60">
                    {persona.tiene_enlace ? 'Ya tiene un enlace emitido.' : 'Todavía sin enlace.'}
                  </span>
                )}
              </div>
              {url ? (
                <>
                  <button
                    type="button"
                    onClick={() => void copiar(persona, url)}
                    className="self-start text-xs font-semibold text-brand hover:text-brand-700"
                  >
                    {copiado[persona.id] ? 'Copiado ✓' : 'Copiar mensaje completo'}
                  </button>
                  {copiado[persona.id] === false ? (
                    <textarea
                      readOnly
                      aria-label={`Mensaje para ${persona.nombre}`}
                      value={mensaje(persona, url)}
                      onFocus={(e) => e.currentTarget.select()}
                      className="w-full rounded border border-ink/20 p-2 text-base text-ink"
                      rows={3}
                    />
                  ) : null}
                  {copiado[persona.id] === false ? (
                    <p className="text-[11px] text-ink/70">
                      No se pudo copiar solo: selecciona el texto de arriba y cópialo.
                    </p>
                  ) : null}
                  <p className="text-[11px] font-semibold text-ink">
                    {persona.correo
                      ? `También se lo enviamos a ${persona.correo}. `
                      : ''}
                    Cópialo ahora: no se vuelve a mostrar. Si lo pierdes hay que generar otro, y el
                    de ahora deja de valer.
                  </p>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => onGenerar(persona)}
                  className="self-start text-xs font-semibold text-brand hover:text-brand-700"
                >
                  {persona.tiene_enlace ? 'Generar otro enlace' : 'Generar su enlace'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
