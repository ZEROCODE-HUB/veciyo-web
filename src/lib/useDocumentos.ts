import { useEffect, useState } from 'react'
import { porQueFallo } from './motivo'
import { documentosDelEnlace, type Documentos } from './documentos'

/*
  Aparte de `documentos.ts` por lo mismo que `useParametros`: los recorridos de
  la aplicación importan las funciones en Node, y ahí no pinta nada React.
*/

/**
 * Para las pantallas. Mientras no hay `documentos`, la pantalla no pinta lo
 * que depende de ellos; si la lectura falla, `error` dice por qué.
 */
export function useDocumentos(
  token: string | null | undefined,
): { documentos: Documentos | null; error: string | null } {
  const [documentos, setDocumentos] = useState<Documentos | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let vigente = true
    documentosDelEnlace(token)
      .then((d) => {
        if (vigente) setDocumentos(d)
      })
      .catch((e: unknown) => {
        if (vigente) setError(porQueFallo(e, 'No se pudieron cargar los documentos'))
      })
    return () => {
      vigente = false
    }
  }, [token])

  return { documentos, error }
}
