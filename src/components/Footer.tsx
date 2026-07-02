import { Link } from 'react-router-dom'
import SocialIcons from './SocialIcons'

export default function Footer() {
  return (
    <footer className="bg-brand text-ink">
      <div className="mx-auto max-w-content px-4 py-8 sm:px-6 lg:px-8">
        <ul className="flex flex-wrap items-center justify-center gap-x-12 gap-y-3 text-sm font-medium">
          <li>
            <Link to="/login" className="hover:opacity-80">
              Términos y condiciones
            </Link>
          </li>
          <li>
            <Link to="/soporte" className="hover:opacity-80">
              Soporte
            </Link>
          </li>
        </ul>

        <SocialIcons className="mt-6" />

        <div className="mt-6 text-center">
          <p className="text-xs font-semibold text-ink/70">
            Certificaciones de seguridad
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-ink/60">
            <span>SOC 2</span>
            <span>HIPAA</span>
            <span>TRA</span>
            <span>SIRE</span>
            <span>RNT</span>
            <span>Interpol</span>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-ink/80">
          © 2025 Veciyo. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}
