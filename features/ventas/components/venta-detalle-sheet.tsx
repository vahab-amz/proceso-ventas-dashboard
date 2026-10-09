"use client"

import { FileText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import { formatearDia, formatearEuros } from "../lib/formato"
import type { VentaLimpia } from "../types"

type Props = {
  venta: VentaLimpia | null
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
}

function Dato({
  etiqueta,
  children,
}: {
  etiqueta: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{etiqueta}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  )
}

export function VentaDetalleSheet({ venta, abierto, onAbiertoChange }: Props) {
  return (
    <Sheet open={abierto} onOpenChange={onAbiertoChange}>
      <SheetContent>
        {venta && (
          <>
            <SheetHeader>
              <SheetTitle>Operación {venta.venta_id}</SheetTitle>
              <SheetDescription>
                Venta válida incluida en las métricas del dashboard.
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-5 px-4">
              <dl className="flex flex-col gap-2">
                <Dato etiqueta="Fecha">
                  {formatearDia(venta.fecha)} ({venta.fecha})
                </Dato>
                <Dato etiqueta="Producto">
                  {venta.nombre} ({venta.producto_id})
                </Dato>
                <Dato etiqueta="Categoría">
                  <Badge variant="secondary">{venta.categoria}</Badge>
                </Dato>
              </dl>

              <Separator />

              <div className="flex flex-col gap-2">
                <h3 className="font-medium">Cálculo del ingreso</h3>
                <p className="rounded-lg bg-muted p-3 font-mono text-sm tabular-nums">
                  {venta.unidades} uds. ×{" "}
                  {formatearEuros(venta.precio_unitario)} ={" "}
                  <strong>{formatearEuros(venta.ingreso)}</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  Precio histórico de la venta. Sin impuestos, descuentos ni
                  devoluciones.
                </p>
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <h3 className="font-medium">Trazabilidad</h3>
                <p className="flex items-center gap-2 text-sm">
                  <FileText className="size-4 text-muted-foreground" />
                  Fila {venta.fila_csv} de las ventas originales
                </p>
                <p className="text-sm text-muted-foreground">
                  Nombre y categoría proceden del catálogo de productos mediante{" "}
                  <code>producto_id</code>.
                </p>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
