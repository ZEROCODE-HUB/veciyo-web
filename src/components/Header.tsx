import { useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from './Logo'
import Button from './Button'
import { HamburgerIcon, CloseIcon } from './icons'

type HeaderVariant = 'default' | 'app'

const NAV_LINKS = [
  { label: 'Inicio', to: '/login' },
  { label: 'Nosotros', to: '/login' },
  { label: 'Contacto', to: '/login' },
]

const APP_MENU = [
  { label: 'Historial de ofertas', to: '/visit-details' },
  { label: 'Administradores', to: '/admin-registration' },
  { label: 'Cambiar contraseña', to: '/password-reset' },
  { label: 'Cerrar Sesión', to: '/login' },
]

export default function Header({ variant = 'default' }: { variant?: HeaderVariant }) {
  const [menuOpen, setMenuOpen] = useState(false)

  if (variant === 'app') {
    return (
      <header className="relative z-30 bg-brand">
        <div className="mx-auto flex h-[68px] max-w-content items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/visit-details" aria-label="VeciYo">
            <Logo variant="white" />
          </Link>
          <button
            type="button"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-md p-1.5 text-ink"
          >
            {menuOpen ? (
              <CloseIcon className="h-7 w-7" />
            ) : (
              <HamburgerIcon className="h-8 w-8" />
            )}
          </button>
        </div>

        {menuOpen && (
          <div className="absolute right-3 top-[72px] w-64 overflow-hidden rounded-xl border border-line bg-white shadow-card sm:right-6">
            {APP_MENU.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className="block border-b border-line px-5 py-3.5 text-sm text-ink last:border-b-0 hover:bg-surface-soft"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>
    )
  }

  return (
    <header className="bg-brand">
      <div className="mx-auto flex h-[68px] max-w-content items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/login" aria-label="VeciYo">
          <Logo variant="dark" />
        </Link>

        <nav className="flex items-center gap-5 sm:gap-7">
          <ul className="hidden items-center gap-6 text-sm font-medium text-ink md:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="hover:text-ink/70">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/login">
            <Button variant="cta">Iniciar sesion</Button>
          </Link>
        </nav>
      </div>
    </header>
  )
}
