import { useEffect, useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import Card from '../components/Card'
import Tiendas from '../components/Tiendas'
import { parametrosPublicos } from '../lib/parametros'

/**
 * «Abrir Veciyo» desde un correo (13/11/2026, cliente: «debería ir un botón
 * para llevarle a la tienda si no tiene la app instalada, y si la tiene pues
 * abrirle la app»).
 *
 * Intenta abrir la app instalada con su enlace propio (`veciyo://`). Si en un
 * momento la página sigue a la vista --no la tiene, o el navegador no dejó
 * abrirla sola--, manda a la tienda de su celular: App Store en un iPhone,
 * Google Play en Android. Los enlaces de las tiendas son parámetros de la base
 * (`tienda_app_store_url`, `tienda_google_play_url`). En una computadora no
 * redirige: enseña los dos botones.
 */
const ENLACE_DE_LA_APP = 'veciyo://'

function sistema(): 'ios' | 'android' | 'otro' {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'otro'
}

export default function AbrirApp() {
  const [tienda, setTienda] = useState<string | null>(null)

  useEffect(() => {
    let vigente = true
    const cual = sistema()
    if (cual === 'otro') return
    parametrosPublicos()
      .then((p) => {
        if (!vigente) return
        try {
          const url = p
            .texto(cual === 'ios' ? 'tienda_app_store_url' : 'tienda_google_play_url')
            .trim()
          if (/^https:\/\//.test(url)) setTienda(url)
        } catch {
          // Sin enlace, se queda en esta página con los botones.
        }
      })
      .catch(() => {})
    return () => {
      vigente = false
    }
  }, [])

  const abrir = (destinoSiNoAbre: string | null) => {
    window.location.href = ENLACE_DE_LA_APP
    if (!destinoSiNoAbre) return
    window.setTimeout(() => {
      if (document.visibilityState !== 'hidden') window.location.href = destinoSiNoAbre
    }, 1500)
  }

  // En el celular se intenta sola al llegar.
  useEffect(() => {
    if (sistema() === 'otro' || !tienda) return
    abrir(tienda)
  }, [tienda])

  return (
    <MainLayout header="default" bg="page" center>
      <Card className="mx-auto max-w-[520px] px-6 py-10 text-center sm:px-10">
        <h1 className="text-xl font-bold text-ink">Abrir Veciyo</h1>
        <p className="mt-3 text-sm text-ink/70">
          Si ya tienes la app, se abre sola. Si no, descárgala desde la tienda de tu celular y
          entra con el correo al que te llegó la invitación.
        </p>
        <button
          type="button"
          onClick={() => abrir(tienda)}
          className="mt-6 block w-full rounded-xl bg-brand px-4 py-3 text-center text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Abrir la app
        </button>
        <p className="mt-6 text-xs font-semibold text-ink/70">¿No la tienes? Descárgala</p>
        <div className="mt-2">
          <Tiendas />
        </div>
      </Card>
    </MainLayout>
  )
}
