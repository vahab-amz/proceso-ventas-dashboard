"use client"

import type { LucideIcon } from "lucide-react"
import { Euro, Package, ShoppingCart, TriangleAlert } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { formatearEntero, formatearEuros } from "../lib/formato"
import type { Calidad, Resumen } from "../types"

type Props = {
  resumen: Resumen
  calidad: Calidad
  // Totales de la selección; null cuando no hay filtros y se muestran los valores de resumen.json.
  filtrado: { operaciones: number; unidades: number; ingresos: number } | null
}

function porcentaje(parte: number, total: number) {
  return total === 0 ? "0 %" : `${Math.round((parte / total) * 100)} %`
}

export function KpiCards({ resumen, calidad, filtrado }: Props) {
  const fuente = filtrado ? "Filtrado" : "Total"
  const tarjetas: {
    titulo: string
    icono: LucideIcon
    valor: string
    pie: string
  }[] = [
    {
      titulo: `Ingresos totales (${resumen.moneda})`,
      icono: Euro,
      valor: formatearEuros(filtrado?.ingresos ?? resumen.ingresos_totales),
      pie: filtrado
        ? `${porcentaje(filtrado.ingresos, resumen.ingresos_totales)} de ${formatearEuros(resumen.ingresos_totales)}`
        : "Unidades × precio histórico",
    },
    {
      titulo: "Operaciones válidas",
      icono: ShoppingCart,
      valor: formatearEntero(
        filtrado?.operaciones ?? resumen.operaciones_validas
      ),
      pie: filtrado
        ? `de ${resumen.operaciones_validas} operaciones válidas`
        : `de ${calidad.entrada.filas_ventas} filas de entrada`,
    },
    {
      titulo: "Unidades totales",
      icono: Package,
      valor: formatearEntero(filtrado?.unidades ?? resumen.unidades_totales),
      pie: filtrado
        ? `de ${resumen.unidades_totales} unidades`
        : "Suma de unidades vendidas",
    },
  ]

  return (
    <section
      aria-label="Indicadores"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {tarjetas.map(({ titulo, icono: Icono, valor, pie }) => (
        <Card key={titulo} size="sm">
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <Icono className="size-4" />
              {titulo}
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums group-data-[size=sm]/card:text-2xl">
              {valor}
            </CardTitle>
            <CardAction>
              <Badge variant={filtrado ? "default" : "outline"}>{fuente}</Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="text-xs text-muted-foreground">
            {pie}
          </CardFooter>
        </Card>
      ))}
      <Card size="sm">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <TriangleAlert className="size-4" />
            Registros excluidos
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums group-data-[size=sm]/card:text-2xl">
            {calidad.duplicados_excluidos + calidad.incidencias_excluidas}
          </CardTitle>
        </CardHeader>
        <CardFooter className="gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">
            {calidad.duplicados_excluidos} por duplicación
          </Badge>
          <Badge variant="secondary">
            {calidad.incidencias_excluidas} por incidencias
          </Badge>
        </CardFooter>
      </Card>
    </section>
  )
}
