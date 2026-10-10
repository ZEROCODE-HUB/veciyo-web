import { useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from './Logo'
import { HamburgerIcon, CloseIcon } from './icons'

type HeaderVariant = 'default' | 'app'

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

  /*
    Solo el logo. Aqui habia «Inicio», «Nosotros», «Contacto» y un boton
    «Iniciar sesion», y los cinco --con el logo-- llevaban a `/login`, que era
    una maqueta: quien estaba a mitad de su preregistro y pulsaba cualquiera
    salia de el hacia una pantalla que lo dejaba «entrar» como otra persona.
    No hay inicio, ni nosotros, ni contacto a los que ir: cuando existan, se
    ponen.
  */
  return (
    <header className="bg-brand">
      <div className="mx-auto flex h-[68px] max-w-content items-center px-4 sm:px-6 lg:px-8">
        <Logo variant="dark" />
      </div>
    </header>
  )
}
