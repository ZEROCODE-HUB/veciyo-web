import type { InputHTMLAttributes } from 'react'
import TextoDeEtiqueta from './TextoDeEtiqueta'
import { useId, useState } from 'react'
import { EyeIcon, EyeOffIcon } from './icons'

type Tone = 'default' | 'soft'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  tone?: Tone
  /** Render the label in bold near-black (pre-checkin/temp guest style) */
  strongLabel?: boolean
  /**
   * Lo que está mal en este campo, debajo y en rojo.
   *
   * No lo había: toda la validación de este formulario vivía en «Confirmar y
   * continuar», así que un dato mal puesto no se sabía hasta el final y el
   * mensaje no decía de qué campo era. En la aplicación móvil esto ya existe
   * y lo cuenta un guarda (`npm run campos`), justo porque 73 de 104 campos
   * no enseñaban su error.
   */
  error?: string
}

const fieldBase =
  'w-full rounded-field px-4 py-3 text-base text-ink placeholder:text-muted/80 outline-none transition focus:ring-2 focus:ring-brand/30'

const tones: Record<Tone, string> = {
  default: 'bg-white border border-line shadow-[0_1px_2px_rgba(16,42,67,0.04)] focus:border-brand',
  soft: 'bg-surface-soft border border-brand-100 focus:border-brand',
}

export default function Input({
  label,
  tone = 'default',
  strongLabel = false,
  error,
  className = '',
  id,
  type,
  ...props
}: InputProps) {
  /*
    Las contraseñas llevan un ojito para ver lo escrito y volver a taparlo
    (Para Claude 182, 30/10/2026).
  */
  const esClave = type === 'password'
  const [verClave, setVerClave] = useState(false)
  const autoId = useId()
  const inputId = id ?? autoId
  const idDelError = `${inputId}-error`
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className={`mb-2 block text-sm ${
            strongLabel ? 'font-semibold text-ink' : 'font-medium text-ink'
          }`}
        >
          <TextoDeEtiqueta texto={label} />
        </label>
      )}
      <div className="relative">
      <input
        id={inputId}
        type={esClave && verClave ? 'text' : type}
        /*
          El borde rojo lo ve quien lo ve; `aria-invalid` y el texto enlazado
          con `aria-describedby` lo dicen para todos los demás.
        */
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? idDelError : undefined}
        className={`${fieldBase} ${
          error
            ? 'border border-danger bg-white focus:border-danger focus:ring-red-200'
            : tones[tone]
        } ${esClave ? 'pr-12' : ''} ${className}`}
        {...props}
      />
      {esClave ? (
        <button
          type="button"
          onClick={() => setVerClave((v) => !v)}
          aria-label={verClave ? 'Ocultar contraseña' : 'Ver contraseña'}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted hover:text-ink"
        >
          {verClave ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
        </button>
      ) : null}
      </div>
      {error ? (
        <p id={idDelError} role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
