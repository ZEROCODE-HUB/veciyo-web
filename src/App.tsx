import { Navigate, Route, Routes } from 'react-router-dom'
import PasswordReset from './pages/PasswordReset'
import PreCheckIn from './pages/PreCheckIn'
import Invitation from './pages/Invitation'
import Companions from './pages/Companions'
import ConfirmData from './pages/ConfirmData'
import DownloadApp from './pages/DownloadApp'
import Access from './pages/Access'
import Reserva from './pages/Reserva'
import CompanionAccess from './pages/CompanionAccess'
import Validation from './pages/Validation'
// Las dos paginas publicas que pide Google para publicar la pantalla de
// «Entrar con Google». Lo que el huesped acepta en su preregistro es otra
// cosa, y vive dentro del propio preregistro.
import Privacidad from './pages/Privacidad'
import Terminos from './pages/Terminos'
import AvisoDePrevencion from './components/AvisoDePrevencion'
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/invitacion" replace />} />
      <Route path="/access/:token" element={<Access />} />
      {/*
        La dirección que el anfitrión pone en su mensaje automático de Airbnb:
        termina en el código de la reserva. Corta a propósito: va en un
        mensaje de texto.
      */}
      <Route path="/r/:codigo" element={<Reserva />} />
      {/*
        `:token` y no `:id`. Un uuid de invitado **no es una credencial**: quien
        lo viera o lo adivinara podria editar la ficha de otra persona. El token
        vive en la base como sha256, igual que el del titular.
      */}
      <Route
        path="/access/acompanante/:token"
        element={
          <AvisoDePrevencion>
            <CompanionAccess />
          </AvisoDePrevencion>
        }
      />
      <Route path="/invitacion" element={<Invitation />} />
      <Route path="/invitación" element={<Navigate to="/invitacion" replace />} />
      {/*
        Donde cae el enlace de recuperar la contraseña. Estaba la pantalla y no
        estaba la ruta, asi que no se podia llegar a ella ni escribiendola.
      */}
      <Route path="/nueva-contrasena" element={<PasswordReset />} />
      {/*
        Los tres sitios donde puede caer el enlace de un huesped van detras
        del aviso de prevencion: el paso 1, el paso 2 --si ya habia empezado,
        `Access` lo manda directo ahi-- y la ficha de un acompañante.
      */}
      <Route
        path="/pre-check-in"
        element={
          <AvisoDePrevencion>
            <PreCheckIn />
          </AvisoDePrevencion>
        }
      />
      <Route
        path="/confirm-data"
        element={
          <AvisoDePrevencion>
            <ConfirmData />
          </AvisoDePrevencion>
        }
      />
      <Route path="/privacidad" element={<Privacidad />} />
      <Route path="/terminos" element={<Terminos />} />
      <Route path="/companions" element={<Companions />} />
      {/* «Validación de huéspedes» de la maqueta, recuperada el 15/10/2026:
          va entre «Enviar información» y la descarga de la app. */}
      <Route path="/validation" element={<Validation />} />
      <Route path="/download-app" element={<DownloadApp />} />
      {/*
        Aqui estaban seis rutas de la maqueta de diseño: `/login`,
        `/visit-details`, `/validation`, `/temporary-guest-pre-check-in`,
        `/admin-registration` y `/terms-and-conditions`. Se retiran el
        10/10/2026.

        Ninguna hablaba con la base. `/login` dejaba «entrar» a cualquiera y lo
        mandaba al preregistro como «Carlos Balazo», con su cedula y su
        telefono inventados; las demas enseñaban huespedes de mentira. Y no
        eran solo direcciones escondidas: **la cabecera de todas las pantallas
        de verdad** llevaba a `/login` desde el logo, desde «Inicio»,
        «Nosotros», «Contacto» y desde el boton «Iniciar sesion».

        Lo que aquella maqueta queria hacer ya existe en otro sitio: entrar
        con un codigo es `/r/:codigo`, y el huesped que vuelve inicia sesion
        dentro del preregistro.

        Los archivos de esas pantallas se borraron el 11/10/2026.
      */}
      <Route path="*" element={<Navigate to="/invitacion" replace />} />
    </Routes>
  )
}
