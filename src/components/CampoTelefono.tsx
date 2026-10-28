import { PAIS_POR_DEFECTO, paisPorCodigo } from '../lib/paises'
import TextoDeEtiqueta from './TextoDeEtiqueta'
import CampoPais from './CampoPais'

interface Props {
  label?: string
  /** ISO 3166-1 alfa-2. Es lo que se guarda, no el prefijo. */
  codigoPais: string
  onCodigoPaisChange: (codigo: string) => void
  telefono: string
  onTelefonoChange: (numero: string) => void
  placeholder?: string
  tone?: 'default' | 'soft'
}

/**
 * Un teléfono con su país.
 *
 * El huésped de un alojamiento turístico casi nunca tiene número del país donde
 * se aloja — es justo la persona para la que este campo existe. Hasta el
 * 03/10/2026 escribía un número suelto y nadie sabía de dónde era: ni para
 * llamarle, ni para mandarle nada por WhatsApp.
 *
 * El país se elige con buscador (`CampoPais`): desde el 26/10/2026 son los 245
 * países del mundo, y bajar por un `<select>` nativo hasta el tuyo en un
 * celular no es razonable.
 */
export default function CampoTelefono({
  label,
  codigoPais,
  onCodigoPaisChange,
  telefono,
  onTelefonoChange,
  placeholder = 'Número de teléfono',
  tone = 'default',
}: Props) {
  const fondo = tone === 'soft' ? 'bg-ink/[0.03]' : 'bg-white'

  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-ink/70">
          <TextoDeEtiqueta texto={label} />
        </label>
      )}

      {/*
        En un celular angosto el número se salía de la pantalla (Para Claude,
        21/10/2026): el `select` medía lo que su opción más larga y el `input`
        no se encogía. El país tiene un ancho fijo y el número toma el resto.
      */}
      <div className="flex w-full gap-2">
        <CampoPais
          // Un código que la lista no conoce --había «+57» de antes-- cae en el
          // de por defecto, como hacía el `<select>`, en vez de quedar en blanco.
          value={paisPorCodigo(codigoPais) ? codigoPais : PAIS_POR_DEFECTO}
          onChange={onCodigoPaisChange}
          conPrefijo
          ariaLabel="País del teléfono"
          className="w-28 shrink-0 sm:w-40"
          claseBoton={`rounded-2xl border border-ink/10 px-3 py-3.5 ${fondo}`}
        />

        <input
          type="tel"
          inputMode="numeric"
          value={telefono}
          /*
            Solo dígitos. El número se guarda limpio y el formato se decide al
            pintarlo: un dato no se guarda ya formateado.
          */
          onChange={(e) => onTelefonoChange(e.target.value.replace(/\D/g, ''))}
          placeholder={placeholder}
          className={`min-w-0 flex-1 rounded-2xl border border-ink/10 px-4 py-3.5 text-base text-ink placeholder:text-ink/40 ${fondo}`}
        />
      </div>
    </div>
  )
}
