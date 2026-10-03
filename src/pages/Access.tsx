import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import BackgroundCarousel from '../components/BackgroundCarousel'
import Loading from '../components/Loading'
import { hayBackend } from '../lib/supabase'
import {
  consultarPrecheckin,
  fichaDelPrecheckin,
  guardarToken,
  type EstanciaPrecheckin,
} from '../lib/precheckin'

const images = import.meta.glob('../assets/Imágenes/new/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
})
const TRAVEL_IMAGES = Object.entries(images)
  .sort(([a], [b]) => {
    const order = [2, 1, 3, 4, 5, 6]
    const num = (p: string) => parseInt(p.match(/(\d+)/)?.[1] ?? '0', 10)
    return order.indexOf(num(a)) - order.indexOf(num(b))
  })
  .map(([, src]) => src) as string[]

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'invalido' }
  | { tipo: 'vencido' }
  | { tipo: 'completado'; datos: EstanciaPrecheckin }

/**
 * La puerta de entrada del huésped: el enlace que le mandó su anfitrión.
 *
 * Aquí había un `setTimeout` de 1500 ms con el comentario «Simula validación
 * del token contra backend», y pasara lo que pasara redirigía a `/invitacion`.
 * O sea que un enlace inventado, uno vencido y uno bueno llevaban los tres al
 * mismo sitio.
 *
 * Ahora el token se comprueba de verdad. Los tres desenlaces son distintos
 * porque para el huésped son problemas distintos: uno no vale, otro ya pasó, y
 * en el tercero no hay nada que hacer porque ya está hecho.
 */
export default function Access() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' })

  useEffect(() => {
    if (!token || !hayBackend) {
      setEstado({ tipo: 'invalido' })
      return
    }

    let vigente = true
    consultarPrecheckin(token)
      .then((datos) => {
        if (!vigente) return
        if (!datos) {
          setEstado({ tipo: 'invalido' })
        } else if (!datos.vigente) {
          setEstado({ tipo: 'vencido' })
        } else if (datos.completado) {
          setEstado({ tipo: 'completado', datos })
        } else {
          // El token viaja en `sessionStorage` y no en el estado de
          // navegación: son seis pantallas, y recargar en mitad no puede
          // obligar a pedirle otro enlace al anfitrión.
          guardarToken(token)
          /*
            Y si ya habia empezado, se le deja donde lo dejo.

            Volver al enlace es el caso normal para alguien que viaja, no la
            excepcion. Mandarlo siempre al paso 1 --elegir tipo de documento y
            subir las fotos otra vez-- cuando ya tenia su ficha escrita era
            pedirle que repitiera el trabajo sin decirselo.

            Se decide por el documento: es lo primero que se pide, asi que si
            esta, el paso 1 ya paso.
          */
          fichaDelPrecheckin(token)
            .then((ficha) => {
              if (!vigente) return
              const empezado = Boolean(ficha?.documento?.trim())
              navigate(empezado ? '/confirm-data' : '/pre-check-in', {
                replace: true,
              })
            })
            .catch(() => vigente && navigate('/pre-check-in', { replace: true }))
        }
      })
      .catch(() => vigente && setEstado({ tipo: 'invalido' }))

    return () => {
      vigente = false
    }
  }, [token, navigate])

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <BackgroundCarousel images={TRAVEL_IMAGES} />
      <div className="relative z-10 flex flex-1 items-center justify-center px-4">
        {estado.tipo === 'cargando' ? (
          <div className="flex flex-col items-center gap-4">
            <Loading size="lg" variant="white" />
            <p className="text-lg font-semibold text-white">
              Buscando tu reserva…
            </p>
          </div>
        ) : (
          <div className="w-full max-w-[560px] rounded-2xl border border-white/30 bg-white/40 px-8 py-12 text-center shadow-2xl shadow-black/10 backdrop-blur-2xl sm:px-14">
            {estado.tipo === 'invalido' && (
              <Aviso
                titulo="No encontramos esta reserva"
                detalle="Puede que el enlace esté incompleto o que tu anfitrión haya generado uno nuevo. Pedíselo otra vez."
              />
            )}
            {estado.tipo === 'vencido' && (
              <Aviso
                titulo="Este enlace ya venció"
                detalle="Los enlaces de preregistro caducan con la estancia. Si tu reserva sigue en pie, tu anfitrión puede mandarte uno nuevo."
              />
            )}
            {estado.tipo === 'completado' && (
              <Aviso
                titulo="Tu preregistro ya está hecho"
                detalle={`Te esperamos en ${estado.datos.condominio}, vivienda ${estado.datos.unidad}. No hace falta que hagas nada más: al llegar, la portería te recibe con esto ya listo.`}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Aviso({ titulo, detalle }: { titulo: string; detalle: string }) {
  return (
    <>
      <h1 className="font-display text-3xl font-extrabold text-ink sm:text-[34px]">
        {titulo}
      </h1>
      <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-ink/80">
        {detalle}
      </p>
    </>
  )
}
