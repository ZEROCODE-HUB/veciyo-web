import { useEffect, useState } from 'react'
import Input from './Input'
import Card from './Card'
import Recuadro from './Recuadro'
import Select from './Select'
import Button from './Button'
import { porQueFallo } from '../lib/motivo'
import {
  TIPOS_VEHICULO,
  guardarVehiculo,
  normalizarPlaca,
  quitarVehiculo,
  vehiculosDelPrecheckin,
  type AdultoDeLaEstancia,
  type TipoVehiculo,
  type VehiculoDelPrecheckin,
} from '../lib/precheckin'

interface Props {
  token: string
  /** Los adultos de la reserva: uno de ellos responde por cada vehículo. */
  adultos: AdultoDeLaEstancia[]
}

/**
 * Los vehículos con los que llega la reserva.
 *
 * La portada del preregistro los anunciaba y no se pedían en ningún sitio. El
 * cliente lo pidió el 09/10/2026 con una condición: cada vehículo dice **quién
 * responde por él**, que tiene que ser un adulto de esta misma reserva. Eso lo
 * comprueba la base; aquí solo se ofrecen los que valen.
 *
 * Es opcional: quien llega a pie no tiene que hacer nada.
 */
export default function VehiculosDeLaEstancia({ token, adultos }: Props) {
  const [lista, setLista] = useState<VehiculoDelPrecheckin[]>([])
  const [error, setError] = useState<string | null>(null)
  const [abierto, setAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const [placa, setPlaca] = useState('')
  const [tipo, setTipo] = useState<TipoVehiculo | ''>('')
  const [marca, setMarca] = useState('')
  const [color, setColor] = useState('')
  const [responsableId, setResponsableId] = useState('')

  useEffect(() => {
    let vigente = true
    vehiculosDelPrecheckin(token)
      .then((v) => vigente && setLista(v))
      .catch(
        (e) =>
          vigente && setError(porQueFallo(e, 'No pudimos cargar los vehículos')),
      )
    return () => {
      vigente = false
    }
  }, [token])

  const limpiar = () => {
    setPlaca('')
    setTipo('')
    setMarca('')
    setColor('')
    setResponsableId('')
  }

  // La misma placa se podía apuntar dos veces en la misma estancia.
  const repetida =
    normalizarPlaca(placa) !== '' &&
    lista.some((v) => normalizarPlaca(v.placa) === normalizarPlaca(placa))

  const completo =
    normalizarPlaca(placa) !== '' && responsableId !== '' && !repetida

  const anadir = async () => {
    if (!completo || guardando) return
    setGuardando(true)
    setError(null)
    try {
      await guardarVehiculo(token, {
        placa: normalizarPlaca(placa),
        tipo: tipo || undefined,
        marca: marca.trim() || undefined,
        color: color.trim() || undefined,
        responsableId,
      })
      setLista(await vehiculosDelPrecheckin(token))
      limpiar()
      setAbierto(false)
    } catch (e) {
      setError(porQueFallo(e, 'No pudimos guardar el vehículo'))
    } finally {
      setGuardando(false)
    }
  }

  /*
    El vehículo que apuntó el anfitrión al reservar llega sin responsable: en
    ese momento no sabía quién venía. Se completa aquí, y sin eso el
    preregistro no se cierra.
  */
  const asignar = async (vehiculo: VehiculoDelPrecheckin, adultoId: string) => {
    if (!adultoId) return
    setError(null)
    try {
      await guardarVehiculo(token, {
        id: vehiculo.id,
        placa: vehiculo.placa,
        tipo: vehiculo.tipo ?? undefined,
        marca: vehiculo.marca ?? undefined,
        color: vehiculo.color ?? undefined,
        responsableId: adultoId,
      })
      setLista(await vehiculosDelPrecheckin(token))
    } catch (e) {
      setError(porQueFallo(e, 'No pudimos guardar quién responde'))
    }
  }

  const quitar = async (id: string) => {
    setError(null)
    try {
      await quitarVehiculo(token, id)
      setLista((previa) => previa.filter((v) => v.id !== id))
    } catch (e) {
      setError(porQueFallo(e, 'No pudimos quitar el vehículo'))
    }
  }

  const etiquetaTipo = (valor: TipoVehiculo | null) =>
    TIPOS_VEHICULO.find((t) => t.value === valor)?.label ?? null

  /*
    El aspecto de la maqueta (15/10/2026): «Vehículos» como encabezado pequeño
    y una tarjeta «Vehículo N» por cada uno, con placa, marca y color en tres
    columnas. Lo que se añadió después --tipo y quién responde-- va en una
    segunda fila de la misma tarjeta.
  */
  return (
    <div className="mt-6 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">Vehículos</p>
      <p className="text-sm text-ink/70">
        Si llegan en vehículo, anótalo para que la portería lo deje pasar. Si
        no, sáltate esta parte.
      </p>

      {lista.map((v, i) => (
        <Card key={v.id} className="px-6 py-5 sm:px-10 sm:py-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-ink">Vehículo {i + 1}</p>
            <button
              type="button"
              className="text-xs font-semibold text-danger underline underline-offset-2"
              onClick={() => void quitar(v.id)}
            >
              Quitar
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Recuadro etiqueta="Placa" value={v.placa} />
            <Recuadro etiqueta="Marca" value={v.marca ?? ''} />
            <Recuadro etiqueta="Color" value={v.color ?? ''} />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Recuadro etiqueta="Tipo" value={etiquetaTipo(v.tipo) ?? ''} />
            {v.responsable_invitado_id ? (
              <Recuadro etiqueta="Responde" value={v.responsable_nombre ?? ''} />
            ) : (
              <Select
                label="Falta decir quién responde por este vehículo"
                tone="soft"
                placeholder="Seleccione un adulto de la reserva"
                options={adultos.map((a) => ({
                  value: a.id,
                  label: `${a.nombre} ${a.apellidos ?? ''}`.trim(),
                }))}
                value=""
                onChange={(e) => void asignar(v, e.target.value)}
              />
            )}
          </div>
        </Card>
      ))}

      {abierto ? (
        <Card className="px-6 py-5 sm:px-10 sm:py-6">
          <p className="mb-3 text-sm font-bold text-ink">Vehículo {lista.length + 1}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              label="Placa"
              tone="soft"
              placeholder="Ingrese la placa"
              value={placa}
              error={repetida ? 'Ese vehículo ya está en la lista.' : ''}
              onChange={(e) => setPlaca(normalizarPlaca(e.target.value))}
            />
            <Input
              label="Marca"
              tone="soft"
              placeholder="Ingrese la marca"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
            />
            <Input
              label="Color"
              tone="soft"
              placeholder="Ingrese el color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Adulto responsable del vehículo"
              tone="soft"
              placeholder="Seleccione"
              options={adultos.map((a) => ({
                value: a.id,
                label: `${a.nombre} ${a.apellidos ?? ''}`.trim(),
              }))}
              value={responsableId}
              onChange={(e) => setResponsableId(e.target.value)}
            />
            <Select
              label="Tipo"
              tone="soft"
              placeholder="Seleccione"
              options={TIPOS_VEHICULO as unknown as { value: string; label: string }[]}
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoVehiculo | '')}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              className="flex-1 py-2.5"
              disabled={!completo || guardando}
              onClick={() => void anadir()}
            >
              {guardando ? 'Guardando…' : 'Guardar vehículo'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="flex-1 py-2.5"
              onClick={() => {
                limpiar()
                setAbierto(false)
              }}
            >
              Cancelar
            </Button>
          </div>
        </Card>
      ) : (
        <Button
          type="button"
          variant="ghost"
          className="w-full py-2.5"
          onClick={() => setAbierto(true)}
        >
          + Añadir un vehículo
        </Button>
      )}

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  )
}
