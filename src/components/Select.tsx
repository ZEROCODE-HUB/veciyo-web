import type { SelectHTMLAttributes } from 'react'
import { useId } from 'react'
import { ChevronDownIcon } from './icons'

type Tone = 'default' | 'soft'

interface Option {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  tone?: Tone
  strongLabel?: boolean
  placeholder?: string
  options: Option[]
}

const tones: Record<Tone, string> = {
  default: 'bg-white border border-line shadow-[0_1px_2px_rgba(16,42,67,0.04)] focus:border-brand',
  soft: 'bg-surface-soft border border-brand-100 focus:border-brand',
}

export default function Select({
  label,
  tone = 'default',
  strongLabel = false,
  placeholder,
  options,
  className = '',
  id,
  defaultValue,
  ...props
}: SelectProps) {
  const autoId = useId()
  const selectId = id ?? autoId
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className={`mb-2 block text-sm ${
            strongLabel ? 'font-semibold text-ink' : 'font-medium text-ink'
          }`}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          defaultValue={defaultValue ?? (placeholder ? '' : undefined)}
          className={`w-full appearance-none rounded-field px-4 py-3 pr-11 text-base text-ink outline-none transition focus:ring-2 focus:ring-brand/30 ${tones[tone]} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink" />
      </div>
    </div>
  )
}
