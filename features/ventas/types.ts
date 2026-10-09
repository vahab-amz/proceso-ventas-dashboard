// Estructuras de los archivos generados por `node scripts/procesar.mjs` en salida/.

export type Resumen = {
  periodo: { desde: string; hasta: string }
  moneda: string
  generado_en: string
  operaciones_validas: number
  unidades_totales: number
  ingresos_totales: number
  ingresos_por_categoria: { categoria: string; ingresos: number }[]
}

export type RegistroExcluido = {
  venta_id: string
  fila_csv: number
  motivo: string
}

export type Calidad = {
  generado_en: string
  entrada: { filas_ventas: number; productos_catalogo: number }
  operaciones_validas: number
  duplicados_excluidos: number
  incidencias_excluidas: number
  comprobacion: string
  duplicados: RegistroExcluido[]
  incidencias: RegistroExcluido[]
}

export type VentaLimpia = {
  venta_id: string
  fila_csv: number
  fecha: string
  producto_id: string
  nombre: string
  categoria: string
  unidades: number
  precio_unitario: number
  ingreso: number
}

export type DatosVentas = {
  resumen: Resumen
  calidad: Calidad
  ventas: VentaLimpia[]
}
