import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import BackgroundCarousel from '../components/BackgroundCarousel'
import Tiendas from '../components/Tiendas'
import {
  consultarInvitacion,
  ETIQUETA_ROL,
  formatearFecha,
  hayBackend,
  type InvitacionConsultada,
} from '../lib/supabase'

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

/** Dónde vive la aplicación. Se puede cambiar por entorno sin tocar código. */
const URL_DE_LA_APP = (
  (import.meta.env.VITE_APP_URL as string | undefined) ??
  'https://veciyo-app.vercel.app'
).replace(/\/$/, '')

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'sin-token' }
  | { tipo: 'invalida' }
  | { tipo: 'vencida'; datos: InvitacionConsultada }
  | { tipo: 'lista'; datos: InvitacionConsultada }

/**
 * Lo primero que ve quien recibe una invitación.
 *
 * Estaba entera escrita a mano: "Carlos Balazo", "Apartamento acogedor en el
 * centro histórico", 3 huéspedes, 2 vehículos y unas fechas de agosto. Y no
 * leía el `?token=` del enlace, así que la aplicación generaba una invitación
 * con nombre, vivienda y fechas reales y esta página mostraba a otra persona.
 *
 * Ahora pregunta por el token. `consultar_invitacion` responde sin sesión
 * —quien llega aquí todavía no tiene cuenta— y solo a quien trae el token.
 */
export default function Invitation() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' })

  useEffect(() => {
    if (!token) {
      setEstado({ tipo: 'sin-token' })
      return
    }
    if (!hayBackend) {
      setEstado({ tipo: 'invalida' })
      return
    }
    let vigente = true
    consultarInvitacion(token)
      .then((datos) => {
        if (!vigente) return
        if (!datos) setEstado({ tipo: 'invalida' })
        else if (!datos.vigente) setEstado({ tipo: 'vencida', datos })
        else setEstado({ tipo: 'lista', datos })
      })
      .catch(() => vigente && setEstado({ tipo: 'invalida' }))
    return () => {
      vigente = false
    }
  }, [token])

  return (
    /*
      Era `h-dvh overflow-hidden`: en el celular la tarjeta no cabía y no se
      podía desplazar, así que el botón para aceptar quedaba fuera de la
      pantalla (Para Claude, 20/10/2026). El fondo es fijo; la página crece.
    */
    <div className="relative flex min-h-dvh flex-col">
      <BackgroundCarousel images={TRAVEL_IMAGES} />

      <div className="flex flex-1 items-center justify-center px-4 py-6">
        <div className="w-full max-w-[640px] rounded-2xl border border-white/30 bg-white/40 px-5 py-8 shadow-2xl shadow-black/10 backdrop-blur-2xl sm:px-14 sm:py-14">
          {estado.tipo === 'cargando' && (
            <p className="text-center text-base text-ink/80">
              Buscando tu invitación…
            </p>
          )}

          {estado.tipo === 'sin-token' && (
            <Mensaje
              titulo="Este enlace está incompleto"
              detalle="Abre el enlace tal como te llegó, sin recortarlo. Si lo copiaste a mano, puede haberse perdido un trozo."
            />
          )}

          {estado.tipo === 'invalida' && (
            <Mensaje
              titulo="No encontramos esta invitación"
              detalle="Puede que se haya revocado o que el enlace no sea correcto. Pídele a quien te invitó que te mande uno nuevo."
            />
          )}

          {estado.tipo === 'vencida' && (
            <Mensaje
              titulo="Esta invitación ya venció"
              detalle={`Se emitió para ${estado.datos.correo}. Pídele a quien te invitó que te mande una nueva.`}
            />
          )}

          {estado.tipo === 'lista' && <Detalle datos={estado.datos} token={token} />}
        </div>
      </div>
    </div>
  )
}

function Mensaje({ titulo, detalle }: { titulo: string; detalle: string }) {
  return (
    <>
      <h1 className="text-center font-display text-3xl font-extrabold text-ink sm:text-[34px]">
        {titulo}
      </h1>
      <p className="mx-auto mt-4 max-w-md text-center text-base leading-relaxed text-ink/80">
        {detalle}
      </p>
    </>
  )
}

function Detalle({
  datos,
  token,
}: {
  datos: InvitacionConsultada
  token: string | null
}) {
  const esHuesped = datos.rol === 'huesped_temporal'

  return (
    <>
      <h1 className="text-center font-display text-3xl font-extrabold text-ink sm:text-[34px]">
        {esHuesped ? 'Te esperan en ' : 'Te invitaron a '}
        {datos.condominio}
      </h1>
      {/*
        A esta página se llega **después** del preregistro: es el enlace que la
        última pantalla del precheckin entrega para crear la cuenta. Decía
        «Completá tu preregistro de seguridad», o sea pedirle a alguien que haga
        lo que acaba de terminar.
      */}
      <p className="mx-auto mt-4 max-w-md text-center text-base leading-relaxed text-ink/80">
        {esHuesped
          ? 'Crea tu cuenta para ver tu alojamiento durante la estadía.'
          : datos.unidad
            ? 'Crea tu cuenta para entrar a la vivienda que te asignaron.'
            : 'Crea tu cuenta para entrar a tu edificio.'}
      </p>

      <div className="mt-8 rounded-xl border border-white/30 bg-white/40 px-4 py-5 sm:px-6 shadow-lg backdrop-blur-md">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Dato etiqueta="Nombre" valor={datos.nombre} ancho />
          <Dato etiqueta="Correo" valor={datos.correo} ancho />
          {datos.unidad && <Dato etiqueta="Vivienda" valor={datos.unidad} />}
          <Dato
            etiqueta="Rol"
            valor={ETIQUETA_ROL[datos.rol] ?? datos.rol}
          />
          {esHuesped && datos.vigente_hasta && (
            <Dato
              etiqueta="Tu estadía"
              ancho
              valor={
                datos.vigente_desde
                  ? `Entrada: ${formatearFecha(datos.vigente_desde)}  Salida: ${formatearFecha(datos.vigente_hasta)}`
                  : `Hasta el ${formatearFecha(datos.vigente_hasta)}`
              }
            />
          )}
        </div>
      </div>

      {/*
        Aquí había un «Continuar» que llevaba a `/login`, una maqueta que pide
        un «código de acceso» inexistente, acepta cualquier cosa y sigue sin
        token. Era un callejón sin salida: quien llegaba ahí no tenía forma de
        volver, y no lo descubrimos hasta intentar recorrer el flujo entero.

        Lo que de verdad hay que hacer es abrir este mismo enlace desde la
        aplicación, que sí sabe leerlo --`RootNavigator` tiene el deep link de
        `/invitacion`--. Así que se dice, en vez de fingir un botón.
      */}
      <div className="mt-8 rounded-xl border border-white/30 bg-white/40 px-4 py-4 sm:mt-10 sm:px-5 text-left backdrop-blur-md">
        <p className="text-sm font-bold text-ink">Cómo entrar</p>
        <ol className="mt-2 space-y-1.5 text-sm leading-relaxed text-ink/80">
          <li>1. Abre Veciyo con el botón de abajo.</li>
          <li>
            2. Crea tu cuenta con <strong className="break-all">{datos.correo}</strong>, el mismo
            correo al que se emitió esta invitación.
          </li>
        </ol>
        <p className="mt-3 text-xs text-ink/60">
          Tiene que ser ese correo exacto. Con otro, la invitación no se puede
          aceptar.
        </p>
        {/*
          Decía «instala la aplicación y vuelve a abrir este enlace» y no había
          ni un botón: quien terminaba su preregistro y pulsaba «Crear mi
          cuenta» llegaba aquí y no tenía a dónde ir (12/10/2026). La
          aplicación abre este mismo camino --`/invitacion?token=`--.
        */}
        {token && (
          <a
            href={`${URL_DE_LA_APP}/invitacion?token=${encodeURIComponent(token)}`}
            className="mt-4 block rounded-xl bg-brand px-4 py-3 text-center text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Abrir Veciyo y crear mi cuenta
          </a>
        )}
        {/*
          Las tiendas, aquí y no al final del preregistro: se enseñan cuando
          ya decidió crear su cuenta (16/10/2026).
        */}
        <p className="mt-5 text-center text-xs font-semibold text-ink/70">
          También puedes descargar la aplicación
        </p>
        <div className="mt-2">
          <Tiendas />
        </div>
      </div>
    </>
  )
}

function Dato({
  etiqueta,
  valor,
  ancho = false,
}: {
  etiqueta: string
  valor: string
  ancho?: boolean
}) {
  return (
    <div className={ancho ? 'col-span-2' : undefined}>
      <p className="text-xs font-semibold uppercase tracking-widest text-ink/70">
        {etiqueta}
      </p>
      {/* Sin `nowrap`: un correo largo se salía de la tarjeta en el celular. */}
      <p className="break-words text-sm font-bold text-ink">{valor}</p>
    </div>
  )
}
