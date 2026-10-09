import { readFile } from "node:fs/promises"
import { join } from "node:path"

import type { Calidad, DatosVentas, Resumen, VentaLimpia } from "../types"

// Solo servidor: lee las salidas del proceso en tiempo de build.
// Para actualizar el dashboard hay que regenerar salida/ y publicar una nueva versión.
const carpetaSalida = join(process.cwd(), "salida")

async function leerJson<T>(archivo: string): Promise<T> {
  return JSON.parse(await readFile(join(carpetaSalida, archivo), "utf8")) as T
}

// Mismo formato restringido que el CSV de origen: sin comillas ni comas internas.
async function leerVentasLimpias(): Promise<VentaLimpia[]> {
  const texto = await readFile(
    join(carpetaSalida, "ventas_limpias.csv"),
    "utf8"
  )
  const [cabecera, ...lineas] = texto.trim().split(/\r?\n/)
  const columnas = cabecera.split(",")
  return lineas.map((linea) => {
    const campos = Object.fromEntries(
      linea.split(",").map((valor, i) => [columnas[i], valor])
    )
    return {
      venta_id: campos.venta_id,
      fila_csv: Number(campos.fila_csv),
      fecha: campos.fecha,
      producto_id: campos.producto_id,
      nombre: campos.nombre,
      categoria: campos.categoria,
      unidades: Number(campos.unidades),
      precio_unitario: Number(campos.precio_unitario),
      ingreso: Number(campos.ingreso),
    }
  })
}

export async function cargarDatosVentas(): Promise<DatosVentas> {
  const [resumen, calidad, ventas] = await Promise.all([
    leerJson<Resumen>("resumen.json"),
    leerJson<Calidad>("calidad.json"),
    leerVentasLimpias(),
  ])
  return { resumen, calidad, ventas }
}
