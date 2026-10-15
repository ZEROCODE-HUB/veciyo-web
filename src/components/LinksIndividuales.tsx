import type { Acompanante } from '../lib/precheckin'

/**
 * «Links individuales para acompañantes», como en la maqueta (15/10/2026).
 *
 * Cada adulto acepta **sus** términos desde su propio enlace: eso nadie lo puede
 * hacer por otro. El enlace se emite aquí y vuelve una sola vez —en la base vive
 * solo su sha256—, así que se enseña con «Copiar mensaje completo» y el aviso de
 * que hay que copiarlo ahora.
 */
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
  if (personas.length === 0) return null

  const mensaje = (persona: Acompanante, url: string) =>
    `Hola, ${persona.nombre}. Completa tu preregistro con este enlace: ${url}. Desde el mismo enlace puedes ver cómo va.`

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
                    onClick={() => void navigator.clipboard?.writeText(mensaje(persona, url))}
                    className="self-start text-xs font-semibold text-brand hover:text-brand-700"
                  >
                    Copiar mensaje completo
                  </button>
                  <p className="text-[11px] font-semibold text-ink">
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
