/**
 * Por qué falló algo, en palabras que se le puedan enseñar a quien lo sufre.
 *
 * Las siete pantallas del preregistro hacían lo mismo:
 *
 *     catch (e) { setError(e instanceof Error ? e.message : 'No pudimos …') }
 *
 * Y las catorce funciones de `precheckin.ts` hacen `throw error` con el error
 * de Supabase, que es un **objeto plano** --`{ message, details, hint, code }`,
 * ni una `Error` ni nada que herede de ella--. O sea que `instanceof Error` era
 * **siempre falso** y el motivo real se tiraba sin excepción: el huésped veía
 * «No pudimos guardar tus datos» pasara lo que pasara.
 *
 * Lo caro no es el mensaje feo. Es que la base se esfuerza en explicarse
 * --«Falta que acepten los terminos: Diego Ortiz. A cada uno le llega su propio
 * enlace»-- y esa frase existe para que el titular sepa a quién llamar. Tirarla
 * convierte un problema con solución en una pared.
 *
 * Salió recorriendo el preregistro a mano el 03/10/2026, y es el mismo síntoma
 * que vio el cliente el 02/10 con el 409: el motivo estaba y la pantalla lo
 * tapaba.
 *
 * Lo comprueba `npm run motivos`, con la marca en cero.
 */
export function porQueFallo(error: unknown, porDefecto: string): string {
  if (typeof error === 'string' && error.trim() !== '') return error

  const texto = (error as { message?: unknown } | null)?.message
  if (typeof texto === 'string' && texto.trim() !== '') return texto

  return porDefecto
}
