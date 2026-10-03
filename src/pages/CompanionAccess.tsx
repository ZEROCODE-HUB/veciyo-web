import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Card from '../components/Card'
import Input from '../components/Input'
import Select from '../components/Select'
import Button from '../components/Button'
import Checkbox from '../components/Checkbox'
import Accordion from '../components/Accordion'
import CampoTelefono from '../components/CampoTelefono'
import { PAIS_POR_DEFECTO } from '../lib/paises'
import { porQueFallo } from '../lib/motivo'
import {
  TIPOS_DOCUMENTO,
  aceptarMisTerminosAcompanante,
  consultarMiPrecheckin,
  guardarMiFichaAcompanante,
  legalesDeLaEstancia,
  type DocumentoLegal,
  type TipoDocumento,
} from '../lib/precheckin'

/**
 * El acompañante llena **sus** datos y acepta **sus** términos.
 *
 * Esta pantalla era una maqueta completa: ignoraba el identificador de la URL,
 * esperaba un segundo con un `setTimeout` y navegaba a otra pantalla con datos
 * inventados a mano —«Acompañante», «N/A», `companionId: 0`—. Cero llamadas a
 * la base. Quien llegaba por su enlace no podía hacer absolutamente nada.
 *
 * Y la ruta era `/access/acompanante/:id`, con el uuid del invitado. **Un uuid
 * no es una credencial**: quien lo viera o lo adivinara podría editar la ficha
 * de otra persona. Ahora es `/access/acompanante/:token`, con el mismo esquema
 * que el enlace del titular —en la base vive solo su sha256—.
 *
 * Lo que de verdad justifica que esta pantalla exista: **aceptar unas
 * condiciones en nombre de otro adulto no vale**. El titular puede teclearle
 * los datos a quien viene con él —lo pidió el cliente— pero los términos los
 * acepta cada uno, y sin esta pantalla no había dónde.
 */
type Estado = 'cargando' | 'invalido' | 'cerrado' | 'listo' | 'hecho'

interface Ficha {
  nombre: string
  apellidos: string
  tipoDocumento: TipoDocumento | ''
  documento: string
  correo: string
  telefono: string
  codigoPais: string
  fechaNacimiento: string
  ciudadResidencia: string
  ciudadProcedencia: string
}

const VACIA: Ficha = {
  nombre: '',
  apellidos: '',
  tipoDocumento: '',
  documento: '',
  correo: '',
  telefono: '',
  codigoPais: PAIS_POR_DEFECTO,
  fechaNacimiento: '',
  ciudadResidencia: '',
  ciudadProcedencia: '',
}

export default function CompanionAccess() {
  const { token } = useParams<{ token: string }>()
  const [estado, setEstado] = useState<Estado>('cargando')
  const [ficha, setFicha] = useState<Ficha>(VACIA)
  const [esMenor, setEsMenor] = useState(false)
  const [estancia, setEstancia] = useState({ condominio: '', unidad: '', titular: '' })
  const [legales, setLegales] = useState<DocumentoLegal[]>([])
  const [aceptados, setAceptados] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setEstado('invalido')
      return
    }
    let vigente = true

    consultarMiPrecheckin(token)
      .then((fila) => {
        if (!vigente) return
        if (!fila) {
          setEstado('invalido')
          return
        }
        if (fila.cerrado === true) {
          setEstado('cerrado')
          return
        }
        const texto = (v: unknown) => (typeof v === 'string' ? v : '')
        // Lo que ya hubiera, venga de quien venga: el titular pudo teclearlo.
        setFicha({
          nombre: texto(fila.nombre),
          apellidos: texto(fila.apellidos),
          tipoDocumento: (fila.tipo_documento as TipoDocumento) ?? '',
          documento: texto(fila.documento),
          correo: texto(fila.correo),
          telefono: texto(fila.telefono),
          codigoPais: texto(fila.codigo_pais) || PAIS_POR_DEFECTO,
          fechaNacimiento: texto(fila.fecha_nacimiento),
          ciudadResidencia: texto(fila.ciudad_residencia),
          ciudadProcedencia: texto(fila.ciudad_procedencia),
        })
        setEsMenor(fila.es_menor === true)
        setAceptados(fila.terminos_aceptados === true)
        setEstancia({
          condominio: texto(fila.condominio),
          unidad: texto(fila.unidad),
          titular: texto(fila.titular),
        })
        setEstado('listo')
      })
      .catch(() => vigente && setEstado('invalido'))

    legalesDeLaEstancia(token)
      .then((docs) => vigente && setLegales(docs))
      .catch(() => vigente && setLegales([]))

    return () => {
      vigente = false
    }
  }, [token])

  const campo = (clave: keyof Ficha) => (valor: string) =>
    setFicha((previa) => ({ ...previa, [clave]: valor }))

  /*
    A un menor no se le pide documento propio ni se le hace aceptar nada: por él
    responde quien le acompaña. Es la misma regla que aplica la base al cerrar.
  */
  const completo =
    ficha.nombre.trim() !== '' &&
    (esMenor || (ficha.documento.trim() !== '' && ficha.tipoDocumento !== '')) &&
    (esMenor || aceptados)

  const enviar = async () => {
    if (!token || !completo || guardando) return
    setGuardando(true)
    setError(null)
    try {
      await guardarMiFichaAcompanante(token, {
        nombre: ficha.nombre.trim(),
        apellidos: ficha.apellidos.trim() || undefined,
        tipoDocumento: ficha.tipoDocumento || null,
        documento: ficha.documento.trim() || undefined,
        correo: ficha.correo.trim() || undefined,
        telefono: ficha.telefono.trim() || undefined,
        codigoPais: ficha.telefono.trim() ? ficha.codigoPais : undefined,
        fechaNacimiento: ficha.fechaNacimiento || undefined,
        ciudadResidencia: ficha.ciudadResidencia.trim() || undefined,
        ciudadProcedencia: ficha.ciudadProcedencia.trim() || undefined,
      })
      /*
        Dos llamadas y no una: aceptar los términos es un hecho con fecha y con
        consecuencias legales, no un campo más de la ficha. La base le pone el
        sello temporal y la versión del reglamento que se aceptó.
      */
      if (!esMenor) await aceptarMisTerminosAcompanante(token)
      setEstado('hecho')
    } catch (e) {
      setError(porQueFallo(e, 'No pudimos guardar tus datos'))
      setGuardando(false)
    }
  }

  if (estado === 'cargando') {
    return (
      <MainLayout header="default" bg="soft">
        <div className="mx-auto max-w-[640px] px-4 py-16">
          <p className="text-center text-sm text-ink/60">Buscando tu registro...</p>
        </div>
      </MainLayout>
    )
  }

  if (estado === 'invalido' || estado === 'cerrado') {
    return (
      <MainLayout header="default" bg="soft">
        <div className="mx-auto max-w-[560px] px-4 py-16">
          <Card className="px-6 py-10 text-center">
            <h1 className="text-2xl font-bold text-ink">
              {estado === 'cerrado'
                ? 'Este registro ya se cerró'
                : 'Este enlace no vale'}
            </h1>
            <p className="mt-4 text-sm text-ink/70">
              {estado === 'cerrado'
                ? 'Quien hizo la reserva ya lo terminó. Si falta algo tuyo, díselo a esa persona.'
                : 'Puede que haya vencido o que esté mal copiado. Pídele a quien reservó que te lo mande otra vez.'}
            </p>
          </Card>
        </div>
      </MainLayout>
    )
  }

  if (estado === 'hecho') {
    return (
      <MainLayout header="default" bg="soft">
        <div className="mx-auto max-w-[560px] px-4 py-16">
          <Card className="px-6 py-10 text-center">
            <h1 className="text-2xl font-bold text-ink">Listo, {ficha.nombre}</h1>
            <p className="mt-4 text-sm text-ink/70">
              Tus datos quedaron registrados para la estadía en{' '}
              {estancia.condominio}. La portería los va a comparar con tu
              documento cuando llegues, así que llévalo contigo.
            </p>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout header="default" bg="soft">
      <div className="mx-auto max-w-[640px] px-4 py-10 sm:px-6">
        <h1 className="text-center font-display text-3xl font-bold text-ink">
          Tus datos para la estadía
        </h1>
        <p className="mx-auto mt-3 max-w-md text-center text-base text-ink/60">
          {estancia.titular
            ? `${estancia.titular} te incluyó en su reserva`
            : 'Te incluyeron en una reserva'}{' '}
          en {estancia.condominio}, vivienda {estancia.unidad}. La portería
          necesita tus datos para dejarte entrar.
        </p>

        <Card className="mt-8 px-5 py-6 sm:px-8">
          <div className="space-y-3">
            <Input
              label="Nombres"
              tone="soft"
              value={ficha.nombre}
              onChange={(e) => campo('nombre')(e.target.value)}
            />
            <Input
              label="Apellidos"
              tone="soft"
              value={ficha.apellidos}
              onChange={(e) => campo('apellidos')(e.target.value)}
            />

            {/*
              A un menor no se le pide documento propio. Enseñar los campos y no
              exigirlos sería la casilla decorativa de siempre; se esconden.
            */}
            {!esMenor && (
              <>
                <Select
                  label="Tipo de documento"
                  tone="soft"
                  placeholder="Seleccione"
                  options={TIPOS_DOCUMENTO as unknown as { value: string; label: string }[]}
                  value={ficha.tipoDocumento}
                  onChange={(e) =>
                    campo('tipoDocumento')(e.target.value)
                  }
                />
                <Input
                  label="Número de documento"
                  tone="soft"
                  placeholder="Sin puntos ni guiones"
                  value={ficha.documento}
                  onChange={(e) => campo('documento')(e.target.value)}
                />
              </>
            )}

            <Input
              label="Correo electrónico"
              type="email"
              tone="soft"
              placeholder="correo@ejemplo.com"
              value={ficha.correo}
              onChange={(e) => campo('correo')(e.target.value)}
            />
            <CampoTelefono
              label="Número de teléfono"
              tone="soft"
              codigoPais={ficha.codigoPais}
              onCodigoPaisChange={campo('codigoPais')}
              telefono={ficha.telefono}
              onTelefonoChange={campo('telefono')}
            />
            <Input
              label="Fecha de nacimiento"
              type="date"
              tone="soft"
              value={ficha.fechaNacimiento}
              onChange={(e) => campo('fechaNacimiento')(e.target.value)}
            />
            <Input
              label="Ciudad donde vives"
              tone="soft"
              placeholder="Medellín"
              value={ficha.ciudadResidencia}
              onChange={(e) => campo('ciudadResidencia')(e.target.value)}
            />
            <Input
              label="Ciudad desde la que viajas"
              tone="soft"
              placeholder="Lima"
              value={ficha.ciudadProcedencia}
              onChange={(e) => campo('ciudadProcedencia')(e.target.value)}
            />
          </div>

          {!esMenor && (
            <div className="mt-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/50">
                Lo que aceptas
              </p>
              <Accordion
                sections={legales.map((doc) => ({
                  id: doc.id,
                  title: doc.titulo,
                  content: (
                    <p className="whitespace-pre-line">{doc.contenido}</p>
                  ),
                }))}
              />
              <div className="mt-4">
                <Checkbox
                  label="Acepto los términos y condiciones"
                  checked={aceptados}
                  onChange={(e) => setAceptados(e.target.checked)}
                />
              </div>
              {/*
                Se dice en voz alta porque es el motivo de que esta pantalla
                exista: nadie más puede marcar esta casilla por ti.
              */}
              <p className="mt-2 text-xs text-ink/50">
                Esta aceptación es tuya. Quien hizo la reserva no puede hacerla
                por ti.
              </p>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <Button
            type="button"
            className="mt-6 w-full py-3.5"
            onClick={() => void enviar()}
            disabled={!completo || guardando}
          >
            {guardando ? 'Guardando...' : 'Confirmar mis datos'}
          </Button>
        </Card>
      </div>
    </MainLayout>
  )
}
