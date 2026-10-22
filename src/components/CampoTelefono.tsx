import { PAISES, PAIS_POR_DEFECTO } from '../lib/paises'

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
 * Aquí el selector es un `<select>` nativo y no una hoja con buscador como en
 * la aplicación: en un navegador el desplegable del sistema ya trae su propio
 * buscador por teclado, y una lista de treinta países no necesita más.
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
          {label}
        </label>
      )}

      {/*
        En un celular angosto el número se salía de la pantalla (Para Claude,
        21/10/2026): el `select` medía lo que su opción más larga y el `input`
        no se encogía. El país tiene un ancho fijo y el número toma el resto.
      */}
      <div className="flex w-full gap-2">
        <select
          value={codigoPais || PAIS_POR_DEFECTO}
          onChange={(e) => onCodigoPaisChange(e.target.value)}
          aria-label="País del teléfono"
          className={`w-28 shrink-0 truncate rounded-2xl border border-ink/10 px-3 py-3.5 text-base text-ink sm:w-40 ${fondo}`}
        >
          {PAISES.map((pais) => (
            <option key={pais.codigo} value={pais.codigo}>
              +{pais.prefijo} · {pais.nombre}
            </option>
          ))}
        </select>

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
