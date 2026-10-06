/**
 * Brand logo lockup. Two variants matching the designs:
 *  - "dark"  : dark owl + dark "Veciyo" wordmark (used on the blue marketing header)
 *  - "white" : owl + white "VeciYo" wordmark (used on the app header)
 */
type LogoProps = {
  variant?: 'dark' | 'white'
  className?: string
}

export default function Logo({ variant = 'dark', className = '' }: LogoProps) {
  const src = variant === 'white' ? '/assets/logo-white.png' : '/assets/logo-dark.png'
  return (
    <img
      src={src}
      alt="VeciYo"
      className={`block h-9 w-auto select-none sm:h-10 ${className}`}
      draggable={false}
    />
  )
}
