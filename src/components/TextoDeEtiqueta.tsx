/**
 * El texto de la etiqueta de un campo. Si termina en «*», el asterisco sale en
 * rojo: el cliente pidió ver de un vistazo qué es obligatorio (Para Claude
 * 115 y 116, 27/10/2026). Es la misma regla que `EtiquetaDelCampo` en la app.
 *
 * El asterisco va con `aria-hidden`: un lector de pantalla diría «asterisco»;
 * lo que es obligatorio lo dice la lista de «Para continuar falta».
 */
export default function TextoDeEtiqueta({ texto }: { texto: string }) {
  const obligatorio = texto.trimEnd().endsWith('*')
  if (!obligatorio) return <>{texto}</>
  return (
    <>
      {texto.trimEnd().replace(/\s*\*$/, '')}
      <span aria-hidden="true" className="text-danger">
        {' *'}
      </span>
    </>
  )
}
