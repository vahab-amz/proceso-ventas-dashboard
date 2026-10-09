"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import { MousePointerClick, TrendingDown, TrendingUp } from "lucide-react"
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

type Metrica = "unidades" | "ingresos"

export type ProductoVendido = {
  producto_id: string
  nombre: string
  categoria: string
  unidades: number
  ingresos: number
  operaciones: number
}

const config = {
  unidades: { label: "Unidades", color: "var(--chart-2)" },
  ingresos: { label: "Ingresos (EUR)", color: "var(--chart-2)" },
} satisfies ChartConfig

const formatear = (metrica: Metrica, valor: number) =>
  metrica === "ingresos"
    ? formatearEuros(valor)
    : `${formatearEntero(valor)} uds.`

type Props = {
  productos: ProductoVendido[]
  seleccionado: string | null
  onToggle: (productoId: string) => void
  fuente: string
}

function Destacado({
  titulo,
  icono: Icono,
  productos,
  metrica,
}: {
  titulo: string
  icono: LucideIcon
  productos: ProductoVendido[]
  metrica: Metrica
}) {
  const [primero] = productos
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border p-3">
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Icono className="size-4" />
        {titulo}
        {productos.length > 1 && <Badge variant="outline">Empate</Badge>}
      </span>
      {primero ? (
        <>
          <span className="text-lg leading-tight font-semibold">
            {productos.map((producto) => producto.nombre).join(" · ")}
          </span>
          <span className="text-2xl font-semibold tabular-nums">
            {formatear(metrica, primero[metrica])}
          </span>
          <span className="text-xs text-muted-foreground">
            {productos
              .map(
                (producto) => `${producto.categoria} (${producto.producto_id})`
              )
              .join(" · ")}
          </span>
        </>
      ) : (
        <span className="text-sm text-muted-foreground">
          Sin otro producto con el que comparar
        </span>
      )}
    </div>
  )
}

export function ProductosRanking({
  productos,
  seleccionado,
  onToggle,
  fuente,
}: Props) {
  const [metrica, setMetrica] = useState<Metrica>("unidades")

  // Orden descendente por la métrica elegida; a igualdad, por nombre para que sea estable.
  const ordenados = [...productos].sort(
    (a, b) => b[metrica] - a[metrica] || a.nombre.localeCompare(b.nombre, "es")
  )
  const maximo = ordenados[0]?.[metrica]
  const minimo = ordenados.at(-1)?.[metrica]
  const masVendidos = ordenados.filter((p) => p[metrica] === maximo)
  const menosVendidos =
    ordenados.length > 1 && maximo !== minimo
      ? ordenados.filter((p) => p[metrica] === minimo)
      : []

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Productos más y menos vendidos</CardTitle>
        <CardDescription>
          Ranking de productos según{" "}
          {metrica === "unidades" ? "unidades vendidas" : "ingresos"} en la
          selección actual.
        </CardDescription>
        <CardAction>
          <ToggleGroup
            variant="outline"
            size="sm"
            value={[metrica]}
            onValueChange={(valor) =>
              valor[0] && setMetrica(valor[0] as Metrica)
            }
            aria-label="Métrica del ranking"
          >
            <ToggleGroupItem value="unidades">Uds.</ToggleGroupItem>
            <ToggleGroupItem value="ingresos">EUR</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-[minmax(0,16rem)_1fr]">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-1">
          <Destacado
            titulo="Más vendido"
            icono={TrendingUp}
            productos={masVendidos}
            metrica={metrica}
          />
          <Destacado
            titulo="Menos vendido"
            icono={TrendingDown}
            productos={menosVendidos}
            metrica={metrica}
          />
        </div>
        <ChartContainer
          config={config}
          className="aspect-auto w-full"
          style={{ height: Math.max(160, ordenados.length * 36 + 16) }}
        >
          <BarChart
            accessibilityLayer
            layout="vertical"
            data={ordenados}
            margin={{ left: 4, right: 72 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="nombre"
              tickLine={false}
              axisLine={false}
              width={84}
            />
            <ChartTooltip
              cursor={{ fillOpacity: 0.4 }}
              content={
                <ChartTooltipContent
                  formatter={(valor, _nombre, item) => {
                    const producto = item.payload as ProductoVendido
                    return (
                      <div className="flex w-full flex-col gap-0.5">
                        <span className="font-medium tabular-nums">
                          {formatear(metrica, Number(valor))}
                        </span>
                        <span className="text-muted-foreground">
                          {producto.categoria} · {producto.operaciones}{" "}
                          operaciones
                        </span>
                      </div>
                    )
                  }}
                />
              }
            />
            <Bar
              dataKey={metrica}
              fill={`var(--color-${metrica})`}
              radius={4}
              isAnimationActive={false}
              className="cursor-pointer"
              onClick={(_dato, indice) =>
                onToggle(ordenados[indice].producto_id)
              }
            >
              {ordenados.map((producto) => (
                <Cell
                  key={producto.producto_id}
                  fillOpacity={
                    seleccionado === null ||
                    seleccionado === producto.producto_id
                      ? 1
                      : 0.25
                  }
                />
              ))}
              <LabelList
                dataKey={metrica}
                position="right"
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
          Pulsa un producto para filtrar sus ventas
        </span>
        <Badge variant="outline">{fuente}</Badge>
      </CardFooter>
    </Card>
  )
}
