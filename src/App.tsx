import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import PasswordReset from './pages/PasswordReset'
import VisitDetails from './pages/VisitDetails'
import PreCheckIn from './pages/PreCheckIn'
import TemporaryGuestPreCheckIn from './pages/TemporaryGuestPreCheckIn'
import AdminRegistration from './pages/AdminRegistration'
import Invitation from './pages/Invitation'
import Companions from './pages/Companions'
import Validation from './pages/Validation'
import ConfirmData from './pages/ConfirmData'
import DownloadApp from './pages/DownloadApp'
import Access from './pages/Access'
import Reserva from './pages/Reserva'
import CompanionAccess from './pages/CompanionAccess'
import TermsAndConditions from './pages/TermsAndConditions'
// Las dos paginas publicas que pide Google para publicar la pantalla de
// «Entrar con Google». No confundir con `TermsAndConditions`, que es lo que el
// huesped acepta en su preregistro, con las normas del condominio dentro.
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
      <Route path="/login" element={<Login />} />
      {/*
        Donde cae el enlace de recuperar la contraseña. Estaba la pantalla y no
        estaba la ruta, asi que no se podia llegar a ella ni escribiendola.
      */}
      <Route path="/nueva-contrasena" element={<PasswordReset />} />
      <Route path="/visit-details" element={<VisitDetails />} />
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
      <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
      <Route path="/privacidad" element={<Privacidad />} />
      <Route path="/terminos" element={<Terminos />} />
      <Route path="/companions" element={<Companions />} />
      <Route path="/validation" element={<Validation />} />
      <Route path="/download-app" element={<DownloadApp />} />
      <Route path="/temporary-guest-pre-check-in" element={<TemporaryGuestPreCheckIn />} />
      <Route path="/admin-registration" element={<AdminRegistration />} />
      <Route path="*" element={<Navigate to="/invitacion" replace />} />
    </Routes>
  )
}
