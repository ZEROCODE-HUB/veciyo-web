/**
 * La edad que tendrá alguien **el día que llegue**, no hoy.
 *
 * Es la misma cuenta que hace `edad_al_llegar` en la base, y tiene que serlo:
 * si la pantalla dijera que sí y la base que no, el huésped llenaría el
 * formulario entero para que se lo rechacen al final —que es exactamente lo
 * que pasaba—.
 *
 * Por qué al llegar y no hoy: alguien que cumple años entre la reserva y el
 * check-in entra siendo adulto. La estancia es lo que se declara ante la
 * autoridad, así que la fecha que cuenta es la de la estancia.
 *
 * Las dos fechas son `yyyy-MM-dd` y se parten en vez de construir un `Date`
 * con ellas: `new Date('2026-10-12')` se lee como UTC y al oeste de Greenwich
 * cae en el día anterior.
 */
export function edadAlLlegar(
  nacimiento: string,
  llegada: string | null,
): number | null {
  const nace = partes(nacimiento)
  if (!nace) return null

  // Sin llegada se cuenta contra hoy, que es lo prudente: la base lo vuelve a
  // mirar con la fecha de verdad.
  const llega = (llegada ? partes(llegada) : null) ?? hoy()

  let edad = llega.anio - nace.anio
  const cumpleYa =
    llega.mes > nace.mes || (llega.mes === nace.mes && llega.dia >= nace.dia)
  if (!cumpleYa) edad -= 1

  return edad
}

/** Mayor de dieciocho el día de la llegada. `null` mientras no haya fecha. */
export function esMayorDeEdadAlLlegar(
  nacimiento: string,
  llegada: string | null,
): boolean | null {
  const edad = edadAlLlegar(nacimiento, llegada)
  if (edad === null) return null
  return edad >= 18
}

/** Si la fecha de nacimiento cae **después** de la llegada. */
export function naceDespuesDeLlegar(
  nacimiento: string,
  llegada: string | null,
): boolean {
  const edad = edadAlLlegar(nacimiento, llegada)
  return edad !== null && edad < 0
}

/**
 * Hoy, en `yyyy-MM-dd`, para el `max` de un campo de fecha de nacimiento.
 *
 * El selector del navegador ofrecía el calendario entero, años adelante
 * incluidos: se podía elegir una fecha posterior a hoy y el formulario la
 * daba por buena hasta que la base la rechazaba. Lo vio el cliente el
 * 09/10/2026, probando su propio enlace.
 *
 * Cerrar el calendario es mejor que avisar después: un dato que no se puede
 * elegir no hay que explicar por qué está mal.
 */
export function hoyEnIso(): string {
  const { anio, mes, dia } = hoy()
  const dos = (n: number) => String(n).padStart(2, '0')
  return `${anio}-${dos(mes)}-${dos(dia)}`
}

function partes(iso: string) {
  const [anio, mes, dia] = iso.slice(0, 10).split('-').map(Number)
  if (!anio || !mes || !dia) return null
  return { anio, mes, dia }
}

function hoy() {
  const ahora = new Date()
  return {
    anio: ahora.getFullYear(),
    mes: ahora.getMonth() + 1,
    dia: ahora.getDate(),
  }
}
