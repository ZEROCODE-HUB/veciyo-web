import { useEffect, useRef, useState } from 'react'
import Checkbox from './Checkbox'
import { reglamentoDeLaEstancia, type Reglamento } from '../lib/precheckin'

interface Props {
  token: string
  aceptadas: boolean
  onCambiar: (aceptadas: boolean) => void
  /**
   * Si el edificio tiene reglas vigentes. Quien monta esto lo necesita para
   * saber si tiene que exigirlas: un edificio que no las ha escrito no puede
   * pedir que se acepten, y el cierre tampoco las exige entonces.
   */
  onSaberSiHay: (hay: boolean) => void
}

/**
 * Las reglas del edificio para huéspedes: se recorren y se aceptan.
 *
 * Lo pidió el cliente el 09/10/2026: que el huésped tenga que «scrollear y
 * aceptar esas reglas al hacer el prechecking», junto con los términos. Son
 * otra cosa que los términos —los términos son el contrato; las reglas, cómo
 * se convive aquí— y hasta ese día solo se podían leer con sesión, que quien
 * hace el preregistro no tiene.
 *
 * ## La casilla se enciende al llegar al final
 *
 * Es lo que quiere decir «que lo tenga que scrollear». Si el texto cabe entero
 * sin desplazarse, se enciende sola: no hay final al que llegar, y dejarla
 * apagada para siempre bloquearía el registro por tener un reglamento corto.
 *
 * **Esto es cortesía de la pantalla, no el límite.** El límite es
 * `cerrar_precheckin`, que no cierra si a algún adulto le falta la
 * aceptación. Aquí solo se evita que alguien marque sin haber visto.
 */
export default function ReglasDelEdificio({
  token,
  aceptadas,
  onCambiar,
  onSaberSiHay,
}: Props) {
  const [reglas, setReglas] = useState<Reglamento | null>(null)
  const [cargando, setCargando] = useState(true)
  const [fallo, setFallo] = useState(false)
  // Quien ya las aceptó y vuelve a su enlace no tiene que recorrerlas otra vez.
  const [llegoAlFinal, setLlegoAlFinal] = useState(aceptadas)
  const caja = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let vigente = true
    reglamentoDeLaEstancia(token)
      .then((r) => {
        if (!vigente) return
        setReglas(r)
        onSaberSiHay(Boolean(r))
      })
      .catch(() => {
        if (!vigente) return
        /*
          No se pudo saber. Se dice, y **no** se da por hecho que no hay: si
          el edificio las tiene, el cierre las va a exigir igual y el huésped
          se enteraría al final.
        */
        setFallo(true)
        onSaberSiHay(true)
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })
    return () => {
      vigente = false
    }
    // `onSaberSiHay` cambia de identidad en cada render del padre; el token no.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // Si todo cabe sin desplazarse, no hay final al que llegar.
  useEffect(() => {
    const el = caja.current
    if (el && el.scrollHeight <= el.clientHeight + 8) setLlegoAlFinal(true)
  }, [reglas])

  useEffect(() => {
    if (aceptadas) setLlegoAlFinal(true)
  }, [aceptadas])

  if (cargando) return null
  if (!reglas && !fallo) return null

  return (
    <div className="mt-6 border-t border-line pt-5">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink/50">
        Reglas del edificio
      </p>

      {fallo ? (
        <p className="text-sm leading-relaxed text-ink/70">
          No pudimos cargar las reglas del edificio. Inténtalo de nuevo en un
          momento; si sigue igual, avisa a tu anfitrión.
        </p>
      ) : (
        <>
          <p className="mb-3 text-sm text-ink/70">
            {reglas?.titulo}. Léelas hasta el final para poder aceptarlas.
          </p>
          <div
            ref={caja}
            tabIndex={0}
            role="region"
            aria-label="Reglas del edificio para huéspedes"
            onScroll={(e) => {
              const el = e.currentTarget
              if (el.scrollHeight - el.scrollTop <= el.clientHeight + 8) {
                setLlegoAlFinal(true)
              }
            }}
            className="max-h-64 overflow-y-auto rounded-xl border border-line bg-white px-5 py-4 text-sm text-ink/80 outline-none focus:ring-2 focus:ring-brand/30"
          >
            {reglas?.secciones.map((seccion) => (
              <div key={seccion.titulo} className="mb-4 last:mb-0">
                <p className="font-semibold text-ink">{seccion.titulo}</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5">
                  {seccion.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Checkbox
              label="He leído y acepto las reglas del edificio"
              checked={aceptadas}
              disabled={!llegoAlFinal}
              onChange={(e) => onCambiar(e.target.checked)}
            />
          </div>
          {!llegoAlFinal && (
            <p className="mt-1.5 text-xs text-ink/50">
              Desplázate hasta el final del texto para poder marcarla.
            </p>
          )}
        </>
      )}
    </div>
  )
}
