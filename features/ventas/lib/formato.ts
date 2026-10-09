const euros = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
})

const enteros = new Intl.NumberFormat("es-ES")

// Los textos de fechas se componen a mano: el ICU de Node y el del navegador
// no siempre coinciden ("18:58" frente a "a las 18:58") y eso rompe la hidratación.
const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"]
const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
]

// Solo se piden partes numéricas, que son estables entre entornos.
const partesMadrid = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Madrid",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
})

export const formatearEuros = (valor: number) => euros.format(valor)
export const formatearEntero = (valor: number) => enteros.format(valor)

// Las fechas del caso son días sin hora (YYYY-MM-DD): se interpretan en UTC.
export function formatearDia(fecha: string) {
  const dia = new Date(`${fecha}T00:00:00Z`)
  return `${DIAS[dia.getUTCDay()]}, ${dia.getUTCDate()} ${MESES[dia.getUTCMonth()].slice(0, 3)}`
}

export function formatearFechaHora(iso: string) {
  const partes = Object.fromEntries(
    partesMadrid
      .formatToParts(new Date(iso))
      .map((parte) => [parte.type, parte.value])
  )
  return `${Number(partes.day)} de ${MESES[Number(partes.month) - 1]} de ${partes.year}, ${partes.hour}:${partes.minute}:${partes.second} (hora de Madrid)`
}
