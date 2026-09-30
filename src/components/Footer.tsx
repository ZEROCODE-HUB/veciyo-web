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

        {/*
          Aquí había un bloque «Certificaciones de seguridad» con seis sellos:
          SOC 2, HIPAA, TRA, SIRE, RNT e Interpol. Se quitó el 29/09/2026 al
          recorrer el precheckin, por dos motivos distintos y los dos serios:

          · **Ninguno es una certificación de VeciYo.** SOC 2 es una auditoría
            que se paga y se aprueba; HIPAA es normativa sanitaria de Estados
            Unidos, que no aplica a un condominio; e «Interpol» no certifica
            software. Anunciarlos en el pie de la pantalla donde alguien entrega
            su documento de identidad es una afirmación falsa sobre la seguridad
            del producto, con lo que eso implica si alguien la reclama.
          · **TRA y SIRE no los puede ver el huésped.** Es una decisión explícita
            del KT, del 16/07/2026, con su motivo escrito: el huésped nunca lee
            esas palabras --para él es «un registro»-- porque preguntan «¿qué
            hackers son estos?». Aquí estaban en todas las pantallas del flujo.

          Si algún día hay certificaciones de verdad, vuelven con su número y su
          fecha. RNT sí existe, pero es del condominio y no de VeciYo, así que su
          sitio es la ficha de la vivienda, no este pie.
        */}

        <p className="mt-6 text-center text-[11px] text-ink/80">
          {/* El año, del reloj: escrito a fuego decía 2025 en 2026. */}
          © {new Date().getFullYear()} Veciyo. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}
