import { CalendarDays, Clock } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"

import { formatearDia, formatearFechaHora } from "../lib/formato"
import type { Resumen } from "../types"

export function DashboardHeader({ resumen }: { resumen: Resumen }) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight">
          Ingresos por categoría
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          ¿Qué categorías generan más ingresos? Ingreso = unidades × precio
          histórico de la venta, en {resumen.moneda}, sin impuestos, descuentos
          ni devoluciones.
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            <CalendarDays />
            {formatearDia(resumen.periodo.desde)} –{" "}
            {formatearDia(resumen.periodo.hasta)} 2026
          </Badge>
          <Badge variant="outline" className="h-auto whitespace-normal">
            <Clock />
            Generado el {formatearFechaHora(resumen.generado_en)}
          </Badge>
        </div>
      </div>
      <ThemeToggle />
    </header>
  )
}
