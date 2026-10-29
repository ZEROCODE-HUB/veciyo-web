/**
 * Términos de servicio de VeciYo.
 *
 * La otra dirección pública que pide Google para publicar la pantalla de
 * «Entrar con Google». No es lo que el **huésped acepta** durante su
 * preregistro, con las normas del condominio dentro: esta es la relación
 * entre VeciYo y quien lo usa.
 *
 * **No la ha revisado un abogado.** Es un punto de partida honesto; conviene
 * que la vea uno antes de la marcha blanca.
 */
import MainLayout from '../layouts/MainLayout'
import CorreoDeLaBase from '../components/CorreoDeLaBase'

const ACTUALIZADA = '6 de octubre de 2026'

export default function Terminos() {
  return (
    <MainLayout>
      <article className="mx-auto max-w-2xl px-4 py-8 text-sm leading-6 text-ink">
        <h1 className="mb-1 text-2xl font-bold text-ink">
          Términos de servicio
        </h1>
        <p className="mb-6 text-xs text-ink/60">
          Última actualización: {ACTUALIZADA}
        </p>

        <Seccion titulo="1. Qué es VeciYo">
          <p>
            VeciYo es una aplicación para administrar edificios y conjuntos
            residenciales —visitas, correspondencia, zonas comunes, pagos,
            seguridad— y para gestionar la llegada de huéspedes a viviendas de
            renta corta.
          </p>
        </Seccion>

        <Seccion titulo="2. Quién puede usarlo">
          <p>
            Para tener cuenta hay que ser mayor de edad.{' '}
            <strong>Tener cuenta no da acceso a ningún edificio</strong>: para
            entrar a una vivienda, alguien de esa vivienda o su administración
            tiene que invitarlo. Un menor puede figurar como residente, dado de
            alta por el adulto responsable, y no tiene acceso a la aplicación.
          </p>
        </Seccion>

        <Seccion titulo="3. Su cuenta">
          <p>
            Usted responde de lo que se haga desde su cuenta, así que cuide su
            clave y avísenos si cree que alguien más entró. Los datos que
            registre deben ser verdaderos: de ellos dependen que la portería
            deje pasar a alguien y los reportes que el alojamiento debe
            presentar a las autoridades.
          </p>
        </Seccion>

        <Seccion titulo="4. Lo que no se puede hacer">
          <ul className="ml-5 list-disc space-y-1">
            <li>Suplantar a otra persona o registrar documentos ajenos.</li>
            <li>
              Usar los datos de sus vecinos para algo distinto de convivir:
              nada de publicidad, listas ni cesión a terceros.
            </li>
            <li>
              Usar el botón de emergencia sin una emergencia. Avisa a una
              persona de guardia de verdad.
            </li>
            <li>Intentar ver información de viviendas que no son suyas.</li>
          </ul>
        </Seccion>

        <Seccion titulo="5. Lo que decide su edificio, no nosotros">
          <p>
            Buena parte de lo que usted puede hacer lo configura la
            administración de su edificio: los horarios de las zonas comunes, si
            se piden documentos en la puerta, si se permite la renta corta, qué
            puede hacer la portería. VeciYo aplica esas reglas y no las fija.
          </p>
          <p>
            Las cuotas, las multas y las normas de convivencia son del edificio.
            Si no está de acuerdo con una, eso se resuelve con su
            administración.
          </p>
        </Seccion>

        <Seccion titulo="6. Obligaciones legales del alojamiento">
          <p>
            Si usted se hospeda en una vivienda de renta corta en Colombia, el
            alojamiento está obligado a reportarlo al Ministerio de Comercio y,
            si es extranjero, a Migración Colombia. VeciYo le ayuda al anfitrión
            a cumplir con eso; la responsabilidad del reporte y de su exactitud
            es del anfitrión.
          </p>
        </Seccion>

        <Seccion titulo="7. Disponibilidad">
          <p>
            Trabajamos para que el servicio esté siempre disponible, y aun así
            puede haber cortes por mantenimiento o por fallos de terceros.{' '}
            <strong>
              VeciYo no sustituye a los sistemas de seguridad físicos de su
              edificio
            </strong>
            : si hay una emergencia, llame a los números de emergencia.
          </p>
        </Seccion>

        <Seccion titulo="8. Sus datos">
          <p>
            Cómo tratamos su información está en la{' '}
            <a className="underline" href="/privacidad">
              política de privacidad
            </a>
            .
          </p>
        </Seccion>

        <Seccion titulo="9. Terminar">
          <p>
            Puede dejar de usar VeciYo cuando quiera y pedir que se borre su
            cuenta. Algunos registros se conservan aunque usted se vaya —las
            entradas y salidas de portería y los reportes legales— porque son
            constancia de un hecho y de un deber del alojamiento.
          </p>
          <p>
            Podemos suspender una cuenta que incumpla el punto 4, avisando del
            motivo.
          </p>
        </Seccion>

        <Seccion titulo="10. Cambios y contacto">
          <p>
            Si cambiamos algo que le afecte, se lo diremos dentro de la
            aplicación antes de que entre en vigor. Para cualquier duda:{' '}
            <CorreoDeLaBase clave="correo_contacto" />
            .
          </p>
        </Seccion>
      </article>
    </MainLayout>
  )
}

function Seccion({
  titulo,
  children,
}: {
  titulo: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-base font-semibold text-ink">{titulo}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  )
}
