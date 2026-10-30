import type { SVGProps } from 'react'

/* Generic stroke icon wrapper */
type IconProps = SVGProps<SVGSVGElement>

export function HamburgerIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <circle cx="4" cy="6" r="1.6" fill="currentColor" />
      <circle cx="4" cy="12" r="1.6" fill="currentColor" />
      <circle cx="4" cy="18" r="1.6" fill="currentColor" />
      <rect x="8" y="5" width="13" height="2.2" rx="1.1" fill="currentColor" />
      <rect x="8" y="10.9" width="13" height="2.2" rx="1.1" fill="currentColor" />
      <rect x="8" y="16.8" width="13" height="2.2" rx="1.1" fill="currentColor" />
    </svg>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M4 12.5l5.2 5.5L20 6"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CrossMarkIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M5 5l14 14M19 5L5 19"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function ClockIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 7.5V12l3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function TrashIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M9 3h6a1 1 0 0 1 1 1v1h4v2H4V5h4V4a1 1 0 0 1 1-1Z" />
      <path d="M6 8h12l-1 12.2A2 2 0 0 1 15 22H9a2 2 0 0 1-2-1.8L6 8Zm4 2v8h1.4v-8H10Zm3.6 0v8H15v-8h-1.4Z" />
    </svg>
  )
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M12 4v15M6 13l6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M15 5l-7 7 7 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M9 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function GridIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

export function EyeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

export function EyeOffIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M2 12s3.6-7 10-7c2 0 3.7.7 5.1 1.6M22 12s-3.6 7-10 7c-2 0-3.7-.7-5.1-1.6M3 3l18 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
