import type { VentaLimpia } from "../types"

export type Filtros = {
  categoria: string | null
  dias: string[]
  busqueda: string
}

export const filtrosVacios: Filtros = {
  categoria: null,
  dias: [],
  busqueda: "",
}

export const hayFiltros = (filtros: Filtros) =>
  filtros.categoria !== null ||
  filtros.dias.length > 0 ||
  filtros.busqueda.trim() !== ""

export function aplicarFiltros(
  ventas: VentaLimpia[],
  filtros: Filtros,
  { ignorarCategoria = false, ignorarDias = false } = {}
) {
  const texto = filtros.busqueda.trim().toLowerCase()
  return ventas.filter(
    (venta) =>
      (ignorarCategoria ||
        filtros.categoria === null ||
        venta.categoria === filtros.categoria) &&
      (ignorarDias ||
        filtros.dias.length === 0 ||
        filtros.dias.includes(venta.fecha)) &&
      (texto === "" ||
        venta.venta_id.toLowerCase().includes(texto) ||
        venta.producto_id.toLowerCase().includes(texto) ||
        venta.nombre.toLowerCase().includes(texto))
  )
}

// Los importes se suman en céntimos, igual que en el script, para evitar errores de coma flotante.
const aCentimos = (euros: number) => Math.round(euros * 100)

export function totales(ventas: VentaLimpia[]) {
  let centimos = 0
  let unidades = 0
  for (const venta of ventas) {
    centimos += aCentimos(venta.ingreso)
    unidades += venta.unidades
  }
  return { operaciones: ventas.length, unidades, ingresos: centimos / 100 }
}

export function agruparPor(
  ventas: VentaLimpia[],
  clave: "categoria" | "fecha" | "producto_id",
  claves: string[]
) {
  const grupos = new Map(
    claves.map((valor) => [valor, { centimos: 0, unidades: 0, operaciones: 0 }])
  )
  for (const venta of ventas) {
    const grupo = grupos.get(venta[clave])
    if (!grupo) continue
    grupo.centimos += aCentimos(venta.ingreso)
    grupo.unidades += venta.unidades
    grupo.operaciones += 1
  }
  return [...grupos].map(([valor, grupo]) => ({
    clave: valor,
    ingresos: grupo.centimos / 100,
    unidades: grupo.unidades,
    operaciones: grupo.operaciones,
  }))
}

// Días del periodo, ambos extremos incluidos (YYYY-MM-DD).
export function diasDelPeriodo(desde: string, hasta: string) {
  const dias: string[] = []
  for (
    let dia = new Date(`${desde}T00:00:00Z`);
    dia <= new Date(`${hasta}T00:00:00Z`);
    dia.setUTCDate(dia.getUTCDate() + 1)
  ) {
    dias.push(dia.toISOString().slice(0, 10))
  }
  return dias
}
