import { useEffect, useState } from 'react'
import Input from './Input'
import Select from './Select'
import Button from './Button'
import { porQueFallo } from '../lib/motivo'
import {
  guardarMascota,
  mascotasDelPrecheckin,
  quitarMascota,
  type MascotaDelPrecheckin,
  type TipoMascota,
} from '../lib/precheckin'
import { soloNombre } from '../lib/ficha'

const TIPOS: { value: TipoMascota; label: string }[] = [
  { value: 'perro', label: 'Perro' },
  { value: 'gato', label: 'Gato' },
  { value: 'otra', label: 'Otra' },
]

/**
 * Las mascotas de la estancia (QA 23/10/2026, responsable de producto). Solo
 * aparece si el anfitrión dijo que el huésped trae mascota; la portería y el
 * anfitrión ven lo que se registre aquí.
 */
export default function MascotasDeLaEstancia({ token }: { token: string }) {
  const [trae, setTrae] = useState(false)
  const [lista, setLista] = useState<MascotaDelPrecheckin[]>([])
  const [tipo, setTipo] = useState<TipoMascota | ''>('')
  const [nombre, setNombre] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let vigente = true
    mascotasDelPrecheckin(token)
      .then((r) => {
        if (!vigente) return
        setTrae(r.traeMascota)
        setLista(r.mascotas)
      })
      .catch((e) => vigente && setError(porQueFallo(e, 'No pudimos cargar las mascotas')))
    return () => {
      vigente = false
    }
  }, [token])

  if (!trae && lista.length === 0) return null

  const anadir = async () => {
    if (!tipo || !nombre.trim() || guardando) return
    setGuardando(true)
    setError(null)
    try {
      await guardarMascota(token, tipo, nombre.trim())
      setLista((await mascotasDelPrecheckin(token)).mascotas)
      setTipo('')
      setNombre('')
    } catch (e) {
      setError(porQueFallo(e, 'No pudimos guardar la mascota'))
    } finally {
      setGuardando(false)
    }
  }

  const quitar = async (id: string) => {
    setError(null)
    try {
      await quitarMascota(token, id)
      setLista((antes) => antes.filter((m) => m.id !== id))
    } catch (e) {
      setError(porQueFallo(e, 'No pudimos quitar la mascota'))
    }
  }

  return (
    <div className="mt-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">Mascotas</p>
      <p className="mt-1 text-sm text-ink/70">
        Tu anfitrión indicó que viajas con mascota. Regístrala para que la
        portería lo sepa.
      </p>
      {lista.length > 0 && (
        <ul className="mt-3 space-y-2">
          {lista.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-xl border border-line bg-surface-soft px-4 py-3 text-sm"
            >
              <span className="font-semibold text-ink">
                {m.nombre}{' '}
                <span className="font-normal text-ink/60">
                  · {TIPOS.find((t) => t.value === m.tipo)?.label ?? m.tipo}
                </span>
              </span>
              <button
                type="button"
                onClick={() => void quitar(m.id)}
                className="text-xs font-semibold text-danger"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          label="Tipo"
          tone="soft"
          placeholder="Seleccione"
          options={TIPOS}
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoMascota | '')}
        />
        <Input
          label="Nombre"
          tone="soft"
          placeholder="Ej.: Firulais"
          value={nombre}
          onChange={(e) => setNombre(soloNombre(e.target.value))}
        />
      </div>
      <div className="mt-3 flex justify-end">
        <Button type="button" disabled={!tipo || !nombre.trim() || guardando} onClick={anadir}>
          {guardando ? 'Guardando…' : 'Añadir mascota'}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  )
}
