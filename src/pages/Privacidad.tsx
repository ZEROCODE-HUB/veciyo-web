/**
 * Política de privacidad de VeciYo.
 *
 * Existe por dos motivos. El primero es legal: VeciYo trata datos personales
 * en Colombia y en Perú —documentos de identidad, fotos de esos documentos,
 * registros de entrada y salida de personas a una vivienda— y eso obliga a
 * decir qué se recoge y para qué. El segundo es práctico: **Google no deja
 * publicar la pantalla de «Entrar con Google» sin una dirección pública de
 * política de privacidad**, y hasta que esté publicada solo pueden entrar cien
 * personas.
 *
 * Está escrita sobre lo que la aplicación **de verdad guarda**, columna por
 * columna, no sobre una plantilla. Si mañana se recoge un dato nuevo, esta
 * página se actualiza: una política que no coincide con lo que hace el sistema
 * es peor que no tenerla, porque afirma algo falso por escrito.
 *
 * **No la ha revisado un abogado.** Es un punto de partida honesto y completo,
 * y conviene que la vea uno antes de la marcha blanca —sobre todo la parte del
 * reporte a las autoridades, que tiene plazos y multas—.
 */
import MainLayout from '../layouts/MainLayout'

const ACTUALIZADA = '6 de octubre de 2026'

export default function Privacidad() {
  return (
    <MainLayout>
      <article className="mx-auto max-w-2xl px-4 py-8 text-sm leading-6 text-ink">
        <h1 className="mb-1 text-2xl font-bold text-ink">
          Política de privacidad
        </h1>
        <p className="mb-6 text-xs text-ink/60">
          Última actualización: {ACTUALIZADA}
        </p>

        <p className="mb-6">
          VeciYo es una aplicación para administrar edificios y conjuntos
          residenciales, y para gestionar la llegada de huéspedes a viviendas de
          renta corta. Esta política explica qué datos tratamos, para qué, con
          quién se comparten y qué puede hacer usted con los suyos.
        </p>

        <Seccion titulo="1. Quién responde por sus datos">
          <p>
            El responsable del tratamiento es el administrador del edificio o el
            anfitrión de la vivienda que lo dio de alta en VeciYo. VeciYo actúa
            como <strong>encargado</strong>: pone la herramienta y custodia la
            información, y no la usa para fines propios.
          </p>
          <p>
            Para cualquier solicitud sobre sus datos:{' '}
            <a className="underline" href="mailto:privacidad@veciyo.com">
              privacidad@veciyo.com
            </a>
            .
          </p>
        </Seccion>

        <Seccion titulo="2. Qué datos recogemos">
          <p>No todos los datos aplican a todas las personas. Según su papel:</p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>Si vive en el edificio o administra uno:</strong> nombre y
              apellido, correo, teléfono con su país, tipo y número de
              documento, su vivienda, y el contacto de emergencia que usted
              indique. Si lo configura, también placas de sus vehículos.
            </li>
            <li>
              <strong>Si llega como huésped:</strong> lo anterior y, además,{' '}
              <strong>fotografías de su documento de identidad</strong> por
              ambas caras. Esto no es opcional: es lo que la ley colombiana
              exige al alojamiento para registrar a quien se hospeda.
            </li>
            <li>
              <strong>Si entra como visita:</strong> nombre, documento, y la
              fecha y hora de entrada y salida. La portería puede tomar una
              fotografía en el ingreso.
            </li>
            <li>
              <strong>De todos:</strong> los mensajes que escriba en el chat del
              edificio, las reservas de zonas comunes que haga, y los
              movimientos registrados en portería.
            </li>
          </ul>
          <p>
            <strong>No recogemos</strong> su ubicación, ni sus contactos, ni
            datos biométricos, ni información de otras aplicaciones de su
            teléfono.
          </p>
        </Seccion>

        <Seccion titulo="3. Si entra con su cuenta de Google">
          <p>
            Si elige entrar con Google, recibimos únicamente{' '}
            <strong>su correo y su nombre</strong>. No pedimos ni recibimos
            acceso a su correo, a sus contactos, a su calendario ni a sus
            archivos. No publicamos nada en su nombre.
          </p>
          <p>
            Entrar con Google <strong>no le da ningún permiso</strong> en ningún
            edificio: solo crea su acceso. Para ver una vivienda, alguien de esa
            vivienda tiene que invitarlo.
          </p>
        </Seccion>

        <Seccion titulo="4. Para qué los usamos">
          <ul className="ml-5 list-disc space-y-1">
            <li>Dejarle entrar a su vivienda y saber qué puede ver y hacer.</li>
            <li>
              Que la portería sepa a quién dejar pasar, y que quede constancia
              de quién entró y cuándo.
            </li>
            <li>Avisarle de lo que pasa en su edificio y en su vivienda.</li>
            <li>
              Cumplir las obligaciones legales del alojamiento, explicadas
              abajo.
            </li>
          </ul>
          <p>
            <strong>No vendemos sus datos</strong>, no los cedemos a anunciantes
            y no los usamos para perfilarlo con fines comerciales.
          </p>
        </Seccion>

        <Seccion titulo="5. Con quién se comparten">
          <p>Solo en estos casos, y por estos motivos:</p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>Con la administración y la portería de su edificio</strong>
              , lo necesario para su función. La administración no ve el
              contenido de sus conversaciones privadas con portería, ni los
              servicios que usted tenga contratados en su casa.
            </li>
            <li>
              <strong>Con las autoridades colombianas, si se hospeda:</strong>{' '}
              el alojamiento está obligado a reportar a los huéspedes al
              Ministerio de Comercio (registro de alojamiento) y, si usted es
              extranjero, a Migración Colombia. Es una obligación legal, no una
              decisión nuestra, y no requiere su autorización.
            </li>
            <li>
              <strong>Con un verificador de antecedentes</strong>, si el
              edificio lo tiene activado para huéspedes. Se consulta su
              documento en registros públicos. Se le informará antes.
            </li>
            <li>
              <strong>Con nuestros proveedores de infraestructura</strong>
              —alojamiento de la base de datos y envío de correo—, que tratan
              los datos por cuenta nuestra y no para fines propios.
            </li>
          </ul>
        </Seccion>

        <Seccion titulo="6. Cuánto tiempo los guardamos">
          <p>
            Mientras tenga una relación con el edificio, y después el tiempo que
            exija la ley. Los registros de entrada y salida y los reportes
            legales <strong>no se borran a petición</strong>: son constancia de
            un hecho y de un deber legal del alojamiento.
          </p>
        </Seccion>

        <Seccion titulo="7. Sus derechos">
          <p>
            Puede conocer, actualizar, rectificar y suprimir sus datos, y
            revocar la autorización, escribiendo a{' '}
            <a className="underline" href="mailto:privacidad@veciyo.com">
              privacidad@veciyo.com
            </a>
            . Si está en Colombia, esto es lo que le reconoce la Ley 1581 de
            2012; también puede reclamar ante la Superintendencia de Industria y
            Comercio.
          </p>
          <p>
            Nombre, teléfono, alias y preferencias los puede cambiar usted
            mismo, cuando quiera, desde su perfil en la aplicación.
          </p>
        </Seccion>

        <Seccion titulo="8. Seguridad">
          <p>
            Cada persona ve únicamente lo que le corresponde, y eso se aplica en
            la base de datos, no solo en la pantalla. Las claves de acceso a una
            vivienda —wifi, cerradura— se guardan cifradas y solo las ve quien
            tiene una estancia en curso. Las conexiones van cifradas.
          </p>
        </Seccion>

        <Seccion titulo="9. Menores de edad">
          <p>
            Un menor puede figurar como residente de una vivienda, dado de alta
            por el adulto responsable, y <strong>no tiene acceso</strong> a la
            aplicación. Para que un menor se hospede sin sus padres se exige la
            autorización firmada de quien responde por él.
          </p>
        </Seccion>

        <Seccion titulo="10. Cambios">
          <p>
            Si cambiamos algo que le afecte, se lo diremos dentro de la
            aplicación antes de que entre en vigor. La fecha de arriba indica la
            última versión.
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
