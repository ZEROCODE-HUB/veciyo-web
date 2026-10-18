import { useEffect, useState } from 'react'
import { porQueFallo } from './motivo'
import { parametrosPublicos, type Parametros } from './parametros'

/*
  Aparte de `parametros.ts` a propósito: ese lo importa `precheckin.ts`, que
  también corren los recorridos de la aplicación en Node, y ahí no pinta nada
  traerse React.
*/

/**
 * Para las pantallas. Mientras no hay `parametros`, la pantalla no pinta lo
 * que depende de ellos; si la lectura falla, `error` dice por qué.
 */
export function useParametros(): { parametros: Parametros | null; error: string | null } {
  const [parametros, setParametros] = useState<Parametros | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let vigente = true
    parametrosPublicos()
      .then((p) => {
        if (vigente) setParametros(p)
      })
      .catch((e: unknown) => {
        if (vigente) setError(porQueFallo(e, 'No se pudo cargar la configuración'))
      })
    return () => {
      vigente = false
    }
  }, [])

  return { parametros, error }
}
