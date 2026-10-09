import type { DatosVentas } from "../types"
import { formatearEuros } from "./formato"
import { agruparPor, totales } from "./filtros"

// Cálculo hecho a mano sobre public/data/ventas.csv (una sola copia por operación),
// documentado en el README. Es la referencia con la que se contrasta el proceso.
export const CONTROL_MANUAL = [
  { venta_id: "V001", unidades: 1, precio_unitario: 5, ingreso: 5 },
  { venta_id: "V002", unidades: 2, precio_unitario: 2, ingreso: 4 },
  { venta_id: "V003", unidades: 3, precio_unitario: 12, ingreso: 36 },
  { venta_id: "V004", unidades: 4, precio_unitario: 25, ingreso: 100 },
]

export type Comprobacion = {
  titulo: string
  detalle: string
  correcta: boolean
}

const sumar = (valores: number[]) =>
  valores.reduce((suma, valor) => suma + Math.round(valor * 100), 0) / 100

export function controlManual({ ventas }: DatosVentas) {
  return CONTROL_MANUAL.map((manual) => {
    const proceso = ventas.find((venta) => venta.venta_id === manual.venta_id)
    return {
      ...manual,
      ingresoProceso: proceso?.ingreso ?? null,
      correcta: proceso?.ingreso === manual.ingreso,
    }
  })
}

export function comprobaciones(datos: DatosVentas): Comprobacion[] {
  const { resumen, calidad, ventas } = datos
  const control = controlManual(datos)
  const sumaManual = sumar(control.map((fila) => fila.ingreso))
  const sumaProceso = sumar(control.map((fila) => fila.ingresoProceso ?? 0))
  const sumaCategorias = sumar(
    resumen.ingresos_por_categoria.map((fila) => fila.ingresos)
  )
  const filas = totales(ventas)
  const clasificadas =
    calidad.operaciones_validas +
    calidad.duplicados_excluidos +
    calidad.incidencias_excluidas
  const categoriasDesdeFilas = agruparPor(
    ventas,
    "categoria",
    resumen.ingresos_por_categoria.map((fila) => fila.categoria)
  )
  const categoriasCoinciden = resumen.ingresos_por_categoria.every(
    (fila) =>
      categoriasDesdeFilas.find((grupo) => grupo.clave === fila.categoria)
        ?.ingresos === fila.ingresos
  )
  const idsUnicos = new Set(ventas.map((venta) => venta.venta_id)).size

  return [
    {
      titulo: "Control manual V001–V004",
      detalle: `Manual ${formatearEuros(sumaManual)} · proceso ${formatearEuros(sumaProceso)}`,
      correcta:
        control.every((fila) => fila.correcta) && sumaManual === sumaProceso,
    },
    {
      titulo: "Suma de categorías = ingreso total",
      detalle: `${formatearEuros(sumaCategorias)} = ${formatearEuros(resumen.ingresos_totales)}`,
      correcta: sumaCategorias === resumen.ingresos_totales,
    },
    {
      titulo: "Cuadre de filas de entrada",
      detalle: `${calidad.entrada.filas_ventas} = ${calidad.operaciones_validas} válidas + ${calidad.duplicados_excluidos} duplicados + ${calidad.incidencias_excluidas} incidencias`,
      correcta: clasificadas === calidad.entrada.filas_ventas,
    },
    {
      titulo: "Las ventas válidas coinciden con el resumen",
      detalle: `${filas.operaciones} operaciones · ${filas.unidades} unidades · ${formatearEuros(filas.ingresos)}`,
      correcta:
        filas.operaciones === resumen.operaciones_validas &&
        filas.unidades === resumen.unidades_totales &&
        filas.ingresos === resumen.ingresos_totales &&
        categoriasCoinciden,
    },
    {
      titulo: "Un venta_id por operación válida",
      detalle: `${idsUnicos} IDs únicos en ${ventas.length} filas limpias`,
      correcta: idsUnicos === ventas.length,
    },
    {
      titulo: "Resumen e informe de calidad de la misma ejecución",
      detalle: resumen.generado_en,
      correcta: resumen.generado_en === calidad.generado_en,
    },
  ]
}
