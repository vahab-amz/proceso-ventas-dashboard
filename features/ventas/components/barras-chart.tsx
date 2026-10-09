"use client"

import { useState } from "react"
import { MousePointerClick } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  XAxis,
  YAxis,
} from "recharts"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { formatearEntero, formatearEuros } from "../lib/formato"

type Metrica = "ingresos" | "unidades"

export type Barra = {
  clave: string
  etiqueta: string
  ingresos: number
  unidades: number
  operaciones: number
}

const config = {
  ingresos: { label: "Ingresos (EUR)", color: "var(--chart-2)" },
  unidades: { label: "Unidades", color: "var(--chart-2)" },
} satisfies ChartConfig

const formatear = (metrica: Metrica, valor: number) =>
  metrica === "ingresos" ? formatearEuros(valor) : formatearEntero(valor)

type Props = {
  titulo: string
  descripcion: string
  datos: Barra[]
  seleccion: string[]
  onToggle: (clave: string) => void
  fuente: string
  pie?: string
}

export function BarrasChart({
  titulo,
  descripcion,
  datos,
  seleccion,
  onToggle,
  fuente,
  pie,
}: Props) {
  const [metrica, setMetrica] = useState<Metrica>("ingresos")
  const total = datos.reduce((suma, barra) => suma + barra[metrica], 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
        <CardDescription>{descripcion}</CardDescription>
        <CardAction>
          <ToggleGroup
            variant="outline"
            size="sm"
            value={[metrica]}
            onValueChange={(valor) =>
              valor[0] && setMetrica(valor[0] as Metrica)
            }
            aria-label="Métrica"
          >
            <ToggleGroupItem value="ingresos">EUR</ToggleGroupItem>
            <ToggleGroupItem value="unidades">Uds.</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <BarChart
            accessibilityLayer
            data={datos}
            margin={{ top: 24, left: 4, right: 4 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="etiqueta"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(valor: number) => formatearEntero(valor)}
            />
            <ChartTooltip
              cursor={{ fillOpacity: 0.4 }}
              content={
                <ChartTooltipContent
                  formatter={(valor, _nombre, item) => (
                    <div className="flex w-full flex-col gap-0.5">
                      <span className="font-medium tabular-nums">
                        {formatear(metrica, Number(valor))}
                      </span>
                      <span className="text-muted-foreground">
                        {(item.payload as Barra).operaciones} operaciones ·{" "}
                        {total === 0
                          ? 0
                          : Math.round((Number(valor) / total) * 100)}{" "}
                        % del total
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Bar
              dataKey={metrica}
              fill={`var(--color-${metrica})`}
              radius={6}
              isAnimationActive={false}
              className="cursor-pointer"
              onClick={(_dato, indice) => onToggle(datos[indice].clave)}
            >
              {datos.map((barra) => (
                <Cell
                  key={barra.clave}
                  fillOpacity={
                    seleccion.length === 0 || seleccion.includes(barra.clave)
                      ? 1
                      : 0.25
                  }
                />
              ))}
              <LabelList
                dataKey={metrica}
                position="top"
                className="fill-foreground"
                fontSize={11}
                formatter={(valor) => formatear(metrica, Number(valor))}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-wrap justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MousePointerClick className="size-3.5" />
          {pie ?? "Pulsa una barra para filtrar"}
        </span>
        <Badge variant="outline">{fuente}</Badge>
      </CardFooter>
    </Card>
  )
}
