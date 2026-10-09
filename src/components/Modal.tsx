import { useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  abierto: boolean
  titulo: string
  onCerrar: () => void
  children: ReactNode
}

/**
 * Una ventana por encima de todo.
 *
 * No había ninguna en la web. El enlace de un acompañante se pintaba **al
 * final de la página**, debajo del formulario, así que al generarlo no pasaba
 * nada visible: había que bajar a buscarlo. Y ese enlace **vuelve una sola
 * vez** —en la base vive solo su sha256— así que no verlo significa emitir
 * otro y tirar el anterior. El cliente lo dijo el 09/10/2026: «el modal de ese
 * enlace, quiero que sea en un modal que se abre, porque actualmente se pone
 * ahí abajo y pues no se ve».
 *
 * Tres cosas que una ventana así necesita y que se olvidan:
 *
 *   · **Escape la cierra.** Es lo primero que prueba cualquiera.
 *   · **El fondo no se desplaza** mientras está abierta. Si no, se mueve la
 *     página de detrás y al cerrar uno aparece en otro sitio.
 *   · **Se anuncia como diálogo** y se le pone nombre, porque un `div` con
 *     sombra encima no es una ventana para quien no la ve.
 *
 * El foco no se encierra dentro: hacerlo bien pide bastante más código que
 * esto, y queda dicho aquí para que el día que esta ventana tenga un
 * formulario de verdad no se dé por hecho que ya está.
 */
export default function Modal({ abierto, titulo, onCerrar, children }: ModalProps) {
  const tarjeta = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return

    const alPulsarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', alPulsarTecla)

    // El fondo se queda quieto mientras la ventana está abierta.
    const desbordeAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // El foco entra en la ventana: si no, sigue en el botón que la abrió y
    // tabular lleva por detrás de ella.
    tarjeta.current?.focus()

    return () => {
      document.removeEventListener('keydown', alPulsarTecla)
      document.body.style.overflow = desbordeAnterior
    }
  }, [abierto, onCerrar])

  if (!abierto) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4"
      onClick={onCerrar}
    >
      <div
        ref={tarjeta}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        /*
          Pulsar dentro no cierra. Sin esto, seleccionar el texto del enlace
          para copiarlo a mano cierra la ventana a mitad.
        */
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-xl outline-none sm:max-w-[480px] sm:rounded-3xl"
      >
        <div className="mb-4 flex items-start gap-3">
          <h2 className="flex-1 text-base font-bold text-ink">{titulo}</h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="-mr-1 -mt-1 shrink-0 rounded-full p-1.5 text-ink/50 transition hover:bg-ink/5 hover:text-ink"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
