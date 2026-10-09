"use client"

import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { comprobaciones, controlManual } from "../lib/comprobaciones"
import {
  type Filtros,
  agruparPor,
  aplicarFiltros,
  diasDelPeriodo,
  filtrosVacios,
  hayFiltros,
  totales,
} from "../lib/filtros"
import { formatearDia } from "../lib/formato"
import type { DatosVentas } from "../types"
import { BarrasChart } from "./barras-chart"
import { ComprobacionesPanel } from "./comprobaciones-panel"
import { DashboardHeader } from "./dashboard-header"
import { FiltrosBar } from "./filtros-bar"
import { KpiCards } from "./kpi-cards"
import { ProductosRanking } from "./productos-ranking"
import { VentaDetalleSheet } from "./venta-detalle-sheet"
import { VentasTable } from "./ventas-table"

const alternar = (lista: string[], valor: string) =>
  lista.includes(valor)
    ? lista.filter((v) => v !== valor)
    : [...lista, valor].sort()

export function VentasDashboard(datos: DatosVentas) {
  const { resumen, calidad, ventas } = datos
  const [filtros, setFiltros] = useState<Filtros>(filtrosVacios)
  const [ventaId, setVentaId] = useState<string | null>(null)
  const [detalleAbierto, setDetalleAbierto] = useState(false)

  const categorias = resumen.ingresos_por_categoria.map(
    (fila) => fila.categoria
  )
  const dias = useMemo(
    () => diasDelPeriodo(resumen.periodo.desde, resumen.periodo.hasta),
    [resumen.periodo.desde, resumen.periodo.hasta]
  )
  const filtradas = aplicarFiltros(ventas, filtros)
  const conFiltros = hayFiltros(filtros)

  // Gráfica por categoría: aplica día y búsqueda, y resalta la categoría elegida.
  // Sin esos filtros, los ingresos se toman directamente de resumen.json.
  const sinFiltrosSecundarios =
    filtros.dias.length === 0 && filtros.busqueda.trim() === ""
  const barrasCategoria = agruparPor(
    aplicarFiltros(ventas, filtros, { ignorarCategoria: true }),
    "categoria",
    categorias
  ).map((grupo) => ({
    ...grupo,
    etiqueta: grupo.clave,
    ingresos: sinFiltrosSecundarios
      ? resumen.ingresos_por_categoria.find(
          (fila) => fila.categoria === grupo.clave
        )!.ingresos
      : grupo.ingresos,
  }))

  const barrasDia = agruparPor(
    aplicarFiltros(ventas, filtros, { ignorarDias: true }),
    "fecha",
    dias
  ).map((grupo) => ({ ...grupo, etiqueta: formatearDia(grupo.clave) }))

  // Ranking de productos: categoría y búsqueda deciden qué productos entran;
  // los días solo cambian sus cantidades (un producto sin ventas ese día cuenta como 0).
  const catalogoVisible = new Map(
    aplicarFiltros(ventas, filtros, { ignorarDias: true }).map((venta) => [
      venta.producto_id,
      { nombre: venta.nombre, categoria: venta.categoria },
    ])
  )
  const productos = agruparPor(filtradas, "producto_id", [
    ...catalogoVisible.keys(),
  ]).map((grupo) => ({
    ...grupo,
    producto_id: grupo.clave,
    ...catalogoVisible.get(grupo.clave)!,
  }))
  const productoSeleccionado =
    productos.find(
      (producto) =>
        producto.producto_id.toLowerCase() ===
        filtros.busqueda.trim().toLowerCase()
    )?.producto_id ?? null

  const comprobacionesDatos = comprobaciones(datos)
  const correctas = comprobacionesDatos.filter((c) => c.correcta).length

  function verVenta(id: string) {
    setVentaId(id)
    setDetalleAbierto(true)
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6">
      <DashboardHeader resumen={resumen} />

      <FiltrosBar
        filtros={filtros}
        onChange={setFiltros}
        categorias={categorias}
        dias={dias}
        resultados={filtradas.length}
        total={ventas.length}
      />

      <KpiCards
        resumen={resumen}
        calidad={calidad}
        filtrado={conFiltros ? totales(filtradas) : null}
      />

      <Tabs defaultValue="resumen">
        <TabsList className="w-full overflow-x-auto sm:w-fit">
          <TabsTrigger value="resumen">Gráficas</TabsTrigger>
          <TabsTrigger value="ventas">
            Ventas
            <Badge variant="secondary">{filtradas.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="comprobaciones">
            Comprobaciones
            <Badge
              variant={
                correctas === comprobacionesDatos.length
                  ? "secondary"
                  : "destructive"
              }
            >
              {correctas}/{comprobacionesDatos.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="grid gap-4 pt-2 lg:grid-cols-2">
          <BarrasChart
            titulo="Ingresos por categoría"
            descripcion="Barras: comparan una misma magnitud entre categorías independientes sobre una base común en cero."
            datos={barrasCategoria}
            seleccion={filtros.categoria ? [filtros.categoria] : []}
            onToggle={(categoria) =>
              setFiltros({
                ...filtros,
                categoria: filtros.categoria === categoria ? null : categoria,
              })
            }
            fuente={sinFiltrosSecundarios ? "Total" : "Filtrado"}
            pie="Pulsa una barra para filtrar por categoría"
          />
          <BarrasChart
            titulo="Ingresos por día"
            descripcion="Reparto diario dentro del periodo analizado, con los filtros de categoría y búsqueda aplicados."
            datos={barrasDia}
            seleccion={filtros.dias}
            onToggle={(dia) =>
              setFiltros({ ...filtros, dias: alternar(filtros.dias, dia) })
            }
            fuente={
              filtros.categoria !== null || filtros.busqueda.trim() !== ""
                ? "Filtrado"
                : "Total"
            }
            pie="Pulsa una barra para filtrar por día"
          />
          <ProductosRanking
            productos={productos}
            seleccionado={productoSeleccionado}
            onToggle={(productoId) =>
              setFiltros({
                ...filtros,
                busqueda: productoSeleccionado === productoId ? "" : productoId,
              })
            }
            fuente={conFiltros ? "Filtrado" : "Total"}
          />
        </TabsContent>

        <TabsContent value="ventas" className="pt-2">
          <VentasTable ventas={filtradas} onSeleccionar={verVenta} />
        </TabsContent>

        <TabsContent value="comprobaciones" className="pt-2">
          <ComprobacionesPanel
            comprobaciones={comprobacionesDatos}
            control={controlManual(datos)}
          />
        </TabsContent>
      </Tabs>

      <VentaDetalleSheet
        venta={ventas.find((venta) => venta.venta_id === ventaId) ?? null}
        abierto={detalleAbierto}
        onAbiertoChange={setDetalleAbierto}
      />
    </main>
  )
}
