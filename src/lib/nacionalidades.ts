import { PAISES } from './paises'

/**
 * Los países entre los que se elige la nacionalidad.
 *
 * `PAISES` son veintiocho porque es la lista de prefijos telefónicos; para la
 * nacionalidad hacen falta todos --un huésped puede ser de cualquier sitio, y
 * el reporte de extranjeros existe justo para los que no son de aquí--. Los
 * nombres los pone el navegador (`Intl.DisplayNames`), así que no hay una
 * segunda lista de doscientos nombres que mantener.
 *
 * Lo que viaja es el código ISO de dos letras, que es lo que guarda la base.
 */
const CODIGOS =
  'AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ ' +
  'CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ ' +
  'FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP ' +
  'KE KG KH KI KM KN KP KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML ' +
  'MM MN MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PR PS PT ' +
  'PW PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ ' +
  'TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VN VU WS YE ZA ZM ZW'

function nombreDe(codigo: string): string {
  const conocido = PAISES.find((p) => p.codigo === codigo)
  if (conocido) return conocido.nombre
  try {
    return new Intl.DisplayNames(['es'], { type: 'region' }).of(codigo) ?? codigo
  } catch {
    return codigo
  }
}

export const NACIONALIDADES: { value: string; label: string }[] = CODIGOS.split(' ')
  .map((codigo) => ({ value: codigo, label: nombreDe(codigo) }))
  .sort((a, b) => a.label.localeCompare(b.label, 'es'))
