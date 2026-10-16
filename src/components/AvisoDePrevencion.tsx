import { useState, type ReactNode } from 'react'
import MainLayout from '../layouts/MainLayout'
import Card from './Card'
import Button from './Button'
import Loading from './Loading'

/**
 * El aviso que se lee **antes** de escribir ningún dato.
 *
 * Lo pidió el cliente el 09/10/2026: «antes de llenar datos, texto: este
 * edificio está comprometido con evitar abusos sexuales… — Entendido».
 *
 * En la aplicación existe desde el principio —lo ve el anfitrión al marcar a
 * un menor en `VisitasNuevoScreen`— y en la web **no existía en ningún
 * sitio**, que es justo donde está quien de verdad viaja con el menor.
 *
 * El texto son las mismas dos frases que las de la aplicación. Son dos
 * repositorios y no hay forma de compartir la constante: si se cambia aquí,
 * hay que cambiarlo allá. El texto legal definitivo está pendiente del
 * abogado del cliente, junto con los términos para menores.
 *
 * ## Es una puerta, no una página
 *
 * Envuelve a las pantallas en vez de ser una ruta más. El enlace del huésped
 * puede caer en tres sitios distintos —el paso 1, el paso 2 si ya había
 * empezado, o la ficha de un acompañante— y una ruta intermedia obligaría a
 * acordarse de pasar por ella desde los tres. Así no se puede llegar a un
 * formulario sin haberlo visto.
 *
 * Se recuerda en `sessionStorage`: dura lo que la pestaña, que es lo que dura
 * el preregistro. No se guarda en la base porque no es un dato de nadie; si el
 * cliente quiere constancia de quién lo leyó, eso es una columna y se anota.
 */
const CLAVE = 'veciyo_aviso_prevencion_visto'

/** El mismo texto que enseña la aplicación al anfitrión. */
export const TEXTO_DE_PREVENCION =
  'Este condominio está comprometido en proteger la integridad de los ' +
  'menores de edad y prevenir la explotación comercial sexual de las niñas, ' +
  'niños y adolescentes. Si el invitado es menor de edad, debe ' +
  'ingresar con su padre, madre o tutor legal, con la documentación ' +
  'respectiva.'

function yaLoVio(): boolean {
  try {
    return sessionStorage.getItem(CLAVE) === 'si'
  } catch {
    // Navegación privada o almacenamiento bloqueado: se enseña otra vez, que
    // es el lado prudente.
    return false
  }
}

function apuntarQueLoVio(): void {
  try {
    sessionStorage.setItem(CLAVE, 'si')
  } catch {
    /* ver arriba */
  }
}

export default function AvisoDePrevencion({ children }: { children: ReactNode }) {
  const [visto, setVisto] = useState(yaLoVio)

  if (visto) return <>{children}</>

  return (
    <MainLayout header="default" bg="soft" center>
      <div className="w-full px-4 py-10 sm:px-6">
        <Card className="mx-auto max-w-[560px] px-6 py-10 text-center sm:px-10">
          {/* El búho en el círculo dorado, como en la maqueta: sin emojis. */}
          <div
            aria-hidden="true"
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/10"
          >
            <Loading size="sm" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-extrabold text-ink">
            Antes de empezar
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-ink/80">
            {TEXTO_DE_PREVENCION}
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm text-ink/60">
            El personal de seguridad comprueba la identidad de cada persona al llegar.
          </p>
          <Button
            type="button"
            className="mt-8 w-full py-3.5"
            onClick={() => {
              apuntarQueLoVio()
              setVisto(true)
            }}
          >
            Entendido
          </Button>
        </Card>
      </div>
    </MainLayout>
  )
}
