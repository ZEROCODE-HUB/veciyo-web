import Logo from './Logo'

type LoadingProps = {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'dark' | 'white'
  className?: string
}

const sizeMap = {
  sm: 'h-5',
  md: 'h-10',
  lg: 'h-16',
}

export default function Loading({ size = 'md', variant = 'dark', className = '' }: LoadingProps) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div className="animate-veciyo-loader">
        <Logo variant={variant} className={`${sizeMap[size]} w-auto select-none`} />
      </div>
    </div>
  )
}
