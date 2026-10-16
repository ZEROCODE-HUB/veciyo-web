import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import MainLayout from '../layouts/MainLayout'
import Card from '../components/Card'

/**
 * El QR de la estancia, al que lleva el correo de «ingreso aprobado»
 * (16/10/2026).
 *
 * El código es el de la estancia (`visita.codigo_acceso`): sirve para que la
 * portería la encuentre al escanearlo, no abre nada. Por eso esta página no
 * pregunta nada a la base: pinta lo que trae la dirección.
 */
export default function CodigoQr() {
  const { codigo } = useParams<{ codigo: string }>()
  const [imagen, setImagen] = useState<string | null>(null)
  const valido = Boolean(codigo && /^[A-F0-9]{8,32}$/i.test(codigo))

  useEffect(() => {
    if (!valido || !codigo) return
    QRCode.toDataURL(codigo.toUpperCase(), { width: 320, margin: 2 })
      .then(setImagen)
      .catch(() => setImagen(null))
  }, [codigo, valido])

  return (
    <MainLayout header="default" bg="page" center>
      <div className="w-full px-4 py-10">
        <Card className="mx-auto max-w-[420px] px-6 py-10 text-center">
          {valido ? (
            <>
              <h1 className="font-display text-2xl font-extrabold text-ink">
                Tu QR de ingreso
              </h1>
              <p className="mt-3 text-sm text-ink/70">
                Muéstralo en recepción al llegar para agilizar tu registro
                físico. Lleva tus documentos.
              </p>
              {imagen ? (
                <img
                  src={imagen}
                  alt={`Código QR ${codigo}`}
                  className="mx-auto mt-6 h-64 w-64"
                />
              ) : null}
              <p className="mt-4 font-mono text-lg font-bold tracking-widest text-ink">
                {codigo?.toUpperCase()}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-ink">Este código no vale</h1>
              <p className="mt-3 text-sm text-ink/70">
                Puede que el enlace esté incompleto. Ábrelo otra vez desde el
                correo.
              </p>
            </>
          )}
        </Card>
      </div>
    </MainLayout>
  )
}
