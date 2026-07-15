import MainLayout from '../layouts/MainLayout'
import Card from '../components/Card'
import Loading from '../components/Loading'

export default function DownloadApp() {
  return (
    <MainLayout header="default" bg="page" center>
      <div className="w-full px-4 py-10 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-[640px] px-6 py-10 text-center sm:px-12 sm:py-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/10">
            <Loading size="sm" />
          </div>

          <h1 className="mt-6 font-display text-3xl font-extrabold text-ink sm:text-[34px]">
            Registro completado exitosamente
          </h1>

          <p className="mx-auto mt-4 max-w-md text-base text-ink/70">
            Tu registro como huésped temporal ha sido completado y se encuentra pendiente de
            aceptación por parte del anfitrión. Recibirás una notificación cuando sea aprobado.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3 rounded-lg bg-gold/10 px-4 py-3">
            <Loading size="sm" />
            <span className="text-sm font-semibold text-gold">
              Pendiente de aceptación por parte del anfitrión
            </span>
          </div>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block transition-transform hover:scale-105"
            >
              <img
                src="/assets/appstore.png"
                alt="Descargar en App Store"
                className="h-12 w-auto"
              />
            </a>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block transition-transform hover:scale-105"
            >
              <img
                src="/assets/Google_Play_Store_badge_EN.svg.webp"
                alt="Descargar en Google Play"
                className="h-12 w-auto"
              />
            </a>
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}
