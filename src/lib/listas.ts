import { useEffect, useState } from 'react'
import { supabase } from './supabase'

/**
 * Una lista de opciones de la base (`catalogo_opcion`), 28/10/2026.
 *
 * Los motivos de viaje, quién responde por un menor y los tipos de vehículo
 * estaban escritos aquí y en la app, cada uno por su lado. Ahora el
 * administrador de la app los renombra, ordena y oculta desde su panel, y la
 * web los lee. Los códigos no cambian: los guarda la base, y son un tipo
 * cerrado allí.
 *
 * `opciones` son las que se ofrecen, en su orden. `etiquetaDe` nombra también
 * las apagadas, para una ficha antigua que tenga una. Una vez por lista y por
 * visita: se guarda la promesa.
 *
 * Desde el 29/10/2026 trae también `extra` (jsonb), para las listas que llevan
 * algo más que una etiqueta: en `campos_obligatorios_preregistro`, si cada
 * campo es obligatorio para quien reserva y para un acompañante. `filas` las da
 * todas, apagadas incluidas, y `cargada` dice si ya llegaron: quien decide con
 * ellas tiene que distinguir «la lista está vacía» de «todavía no llegó».
 */
export type NombreDeLista =
  | 'motivos_de_viaje'
  | 'responsables_de_menor'
  | 'tipos_de_vehiculo'
  | 'campos_obligatorios_preregistro'
  | 'archivo_formatos'

export interface FilaDeLista {
  codigo: string
  etiqueta: string
  activo: boolean
  orden: number | null
  extra: unknown
}

type Fila = FilaDeLista

const leidas = new Map<NombreDeLista, Promise<Fila[]>>()

function leer(lista: NombreDeLista): Promise<Fila[]> {
  let promesa = leidas.get(lista)
  if (!promesa) {
    promesa = (async () => {
      if (!supabase) return []
      const { data, error } = await supabase
        .from('catalogo_opcion')
        .select('codigo, etiqueta, activo, orden, extra')
        .eq('catalogo', lista)
        .order('orden')
      if (error) throw error
      return (data ?? []) as Fila[]
    })().catch((e: unknown) => {
      leidas.delete(lista)
      throw e
    })
    leidas.set(lista, promesa)
  }
  return promesa
}

export function useListaDeLaBase(lista: NombreDeLista) {
  const [filas, setFilas] = useState<Fila[]>([])
  const [cargada, setCargada] = useState(false)

  useEffect(() => {
    let vigente = true
    leer(lista)
      .then((f) => {
        if (vigente) {
          setFilas(f)
          setCargada(true)
        }
      })
      .catch(() => {})
    return () => {
      vigente = false
    }
  }, [lista])

  return {
    opciones: filas.filter((f) => f.activo).map((f) => ({ value: f.codigo, label: f.etiqueta })),
    etiquetaDe: (codigo: string | null | undefined): string | null =>
      codigo ? (filas.find((f) => f.codigo === codigo)?.etiqueta ?? null) : null,
    opcion: (codigo: string): Fila | null => filas.find((f) => f.codigo === codigo) ?? null,
    filas,
    cargada,
  }
}
