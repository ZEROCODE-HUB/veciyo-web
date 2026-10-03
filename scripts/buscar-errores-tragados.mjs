/**
 * Ningun `catch` tira el motivo de lo que fallo.
 *
 * El patron era este, en siete sitios:
 *
 *     catch (e) { setError(e instanceof Error ? e.message : 'No pudimos ...') }
 *
 * Y las funciones de `lib/precheckin.ts` hacen `throw error` con el error de
 * Supabase, que es un **objeto plano** --`{ message, details, hint, code }`--.
 * No hereda de `Error`, asi que `instanceof Error` era siempre falso y el
 * motivo real se tiraba **siempre**.
 *
 * Lo caro: la base se esfuerza en explicarse --«Falta que acepten los terminos:
 * Diego Ortiz»-- justamente para que el titular sepa a quien llamar, y la
 * pantalla lo cambiaba por «No pudimos cerrar el registro». Lo mismo le paso al
 * cliente el 02/10/2026 con el 409 del preregistro: el motivo estaba.
 *
 * Es la segunda vez que aparece con la misma forma, asi que deja de buscarse y
 * se cuenta. Lo que hay que usar es `motivo(e, 'texto por defecto')`.
 *
 *   node scripts/buscar-errores-tragados.mjs
 *
 * Tope: 0.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const RAIZ = resolve(import.meta.dirname, "..", "src");
const TOPE = 0;

/** Todos los `.ts`/`.tsx` de `src/`, recursivamente. */
function archivos(carpeta) {
  const salida = [];
  for (const nombre of readdirSync(carpeta)) {
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) {
      salida.push(...archivos(ruta));
    } else if (/\.tsx?$/.test(nombre)) {
      salida.push(ruta);
    }
  }
  return salida;
}

/*
  `instanceof Error` sobre lo que caza un `catch`. El salto de linea cuenta:
  prettier parte la ternaria en tres lineas en cuanto el mensaje es largo, y la
  primera version de esta busqueda --sin `\s`-- no veia dos de los siete.
*/
const SENAL = /\binstanceof\s+Error\b/;

/*
  Los comentarios no. `lib/motivo.ts` explica el defecto citandolo, y un guarda
  que se dispara con la explicacion de su propio motivo obliga a no escribirla.
*/
const COMENTARIO = /^\s*(\*|\/\/|\/\*)/;

const hallazgos = [];
for (const ruta of archivos(RAIZ)) {
  const lineas = readFileSync(ruta, "utf-8").split("\n");
  lineas.forEach((linea, i) => {
    if (SENAL.test(linea) && !COMENTARIO.test(linea)) {
      hallazgos.push(`${ruta.slice(RAIZ.length + 1)}:${i + 1}  ${linea.trim()}`);
    }
  });
}

for (const h of hallazgos) console.log(h);
console.log(`\n${hallazgos.length} (tope ${TOPE})`);

if (hallazgos.length > TOPE) {
  console.error(
    "\nUn `catch` que comprueba `instanceof Error` tira el motivo: el error de\n" +
      "Supabase es un objeto plano y nunca pasa esa prueba. Usar\n" +
      "`motivo(e, 'texto por defecto')` de `lib/motivo.ts`.",
  );
  process.exit(1);
}
