import { useState } from 'react'
import Input from './Input'
import Select from './Select'
import Button from './Button'
import Checkbox from './Checkbox'
import { porQueFallo } from '../lib/motivo'
import { useParametros } from '../lib/useParametros'
import { useDocumentos } from '../lib/useDocumentos'
import { soloNombre } from '../lib/ficha'
import {
  declararIncapacidad,
  esNombreDeRelleno,
  guardarAcompanante,
  type Acompanante,
  type TipoDocumento,
} from '../lib/precheckin'

interface Props {
  token: string
  persona: Acompanante
  /** El nombre del titular, si ya se sabe, para no hacérselo escribir otra vez. */
  nombreTitular: string
  onHecho: () => void
  onCancelar: () => void
}

/**
 * El titular declara por un acompañante que no puede registrarse solo.
 *
 * Lo pidió el cliente el 09/10/2026. Cada adulto acepta sus términos desde su
 * propio enlace, y eso deja fuera a quien no puede: una persona que no lee,
 * alguien con una discapacidad, un adulto mayor sin teléfono.
 *
 * Tres cosas en una sola ventana, porque son un solo acto:
 *
 *   · **sus datos**, que el titular teclea por él —a esta persona nadie le va
 *     a mandar un enlace para que los llene—;
 *   · **el motivo**, en texto libre: el KT pide que no haya lista cerrada;
 *   · **la firma**: el nombre del titular y una casilla que dice lo que firma.
 *
 * La declaración que queda guardada la redacta la base, no esta pantalla.
 *
 * Espera al nombre provisional del titular (`titular_provisional_nombre`, en
 * la base) antes de pintar el formulario: con él decide si la casilla
 * «Nombre» arranca vacía, y eso solo se decide una vez, al abrir.
 */
export default function DeclararIncapacidad(props: Props) {
  const { parametros, error } = useParametros()
  // Los documentos del país del edificio (25/10/2026).
  const { documentos, error: errorDocumentos } = useDocumentos(props.token)
  if (!parametros || !documentos) {
    return <p className="text-sm text-ink/60">{error ?? errorDocumentos ?? 'Cargando...'}</p>
  }
  return (
    <Formulario
      {...props}
      nombreProvisional={parametros.texto('titular_provisional_nombre')}
      tiposDocumento={documentos.ofrecidos()}
    />
  )
}

function Formulario({
  token,
  persona,
  nombreTitular,
  onHecho,
  onCancelar,
  nombreProvisional,
  tiposDocumento,
}: Props & { nombreProvisional: string; tiposDocumento: { value: string; label: string }[] }) {
  const [nombre, setNombre] = useState(
    esNombreDeRelleno(persona.nombre, nombreProvisional) ? '' : persona.nombre,
  )
  const [apellidos, setApellidos] = useState(persona.apellidos ?? '')
  const [tipoDoc, setTipoDoc] = useState<TipoDocumento | ''>(
    persona.tipo_documento ?? '',
  )
  const [documento, setDocumento] = useState(persona.documento_numero ?? '')
  const [motivo, setMotivo] = useState('')
  const [firma, setFirma] = useState(nombreTitular)
  const [acepto, setAcepto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const completo =
    nombre.trim() !== '' &&
    tipoDoc !== '' &&
    documento.trim() !== '' &&
    motivo.trim() !== '' &&
    firma.trim() !== '' &&
    acepto

  const declarar = async () => {
    if (!completo || guardando) return
    setGuardando(true)
    setError(null)
    try {
      // Primero sus datos: sin documento el preregistro no se cierra, y a
      // esta persona no le va a llegar un enlace para ponerlo.
      await guardarAcompanante(token, {
        id: persona.id,
        nombre: nombre.trim(),
        apellidos: apellidos.trim() || undefined,
        tipoDocumento: tipoDoc || undefined,
        documento: documento.trim(),
        correo: persona.correo ?? undefined,
        telefono: persona.telefono ?? undefined,
        fechaNacimiento: persona.fecha_nacimiento ?? undefined,
      })
      await declararIncapacidad(token, {
        invitadoId: persona.id,
        motivo: motivo.trim(),
        nombreDeclarante: firma.trim(),
      })
      onHecho()
    } catch (e) {
      setError(porQueFallo(e, 'No pudimos guardar la declaración'))
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink/70">
        Úsalo solo si esta persona no puede llenar su registro ni aceptar los
        términos por sí misma. Vas a responder tú por ella, y tu anfitrión lo
        va a ver.
      </p>

      <Input
        label="Nombres"
        tone="soft"
        value={nombre}
        onChange={(e) => setNombre(soloNombre(e.target.value))}
      />
      <Input
        label="Apellidos"
        tone="soft"
        value={apellidos}
        onChange={(e) => setApellidos(soloNombre(e.target.value))}
      />
      <Select
        label="Tipo de documento"
        tone="soft"
        placeholder="Seleccione"
        options={tiposDocumento}
        value={tipoDoc}
        onChange={(e) => setTipoDoc(e.target.value as TipoDocumento | '')}
      />
      <Input
        label="Número de documento"
        tone="soft"
        placeholder="Tal como aparece en el documento"
        value={documento}
        onChange={(e) => setDocumento(e.target.value)}
      />
      <Input
        label="¿Por qué no está en capacidad de aceptar los términos y condiciones por sí mismo(a)?"
        tone="soft"
        placeholder="Por ejemplo: no sabe leer, tiene una discapacidad visual…"
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
      />
      <Input
        label="Tu nombre completo, como firma"
        tone="soft"
        value={firma}
        onChange={(e) => setFirma(soloNombre(e.target.value))}
      />
      <Checkbox
        label="Declaro que es verdad, y acepto en su nombre los términos y las reglas del edificio"
        checked={acepto}
        onChange={(e) => setAcepto(e.target.checked)}
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          className="flex-1 py-2.5"
          disabled={!completo || guardando}
          onClick={() => void declarar()}
        >
          {guardando ? 'Guardando…' : 'Declarar y aceptar por esta persona'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="flex-1 py-2.5"
          onClick={onCancelar}
        >
          Cancelar
        </Button>
      </div>
    </div>
  )
}
