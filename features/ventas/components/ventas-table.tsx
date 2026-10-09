"use client"

import { useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { totales } from "../lib/filtros"
import { formatearDia, formatearEntero, formatearEuros } from "../lib/formato"
import type { VentaLimpia } from "../types"

type Columna =
  | "venta_id"
  | "fecha"
  | "nombre"
  | "categoria"
  | "unidades"
  | "precio_unitario"
  | "ingreso"
type Orden = { columna: Columna; direccion: "asc" | "desc" }

const COLUMNAS: { columna: Columna; titulo: string; numerica?: boolean }[] = [
  { columna: "venta_id", titulo: "ID" },
  { columna: "fecha", titulo: "Fecha" },
  { columna: "nombre", titulo: "Producto" },
  { columna: "categoria", titulo: "Categoría" },
  { columna: "unidades", titulo: "Unidades", numerica: true },
  { columna: "precio_unitario", titulo: "Precio unitario", numerica: true },
  { columna: "ingreso", titulo: "Ingreso", numerica: true },
]

const POR_PAGINA = 10

function ordenar(ventas: VentaLimpia[], { columna, direccion }: Orden) {
  const signo = direccion === "asc" ? 1 : -1
  return [...ventas].sort((a, b) => {
    const x = a[columna]
    const y = b[columna]
    const comparacion =
      typeof x === "number" && typeof y === "number"
        ? x - y
        : String(x).localeCompare(String(y), "es")
    return comparacion * signo || a.venta_id.localeCompare(b.venta_id)
  })
}

type Props = {
  ventas: VentaLimpia[]
  onSeleccionar: (ventaId: string) => void
}

export function VentasTable({ ventas, onSeleccionar }: Props) {
  const [orden, setOrden] = useState<Orden>({
    columna: "venta_id",
    direccion: "asc",
  })
  const [pagina, setPagina] = useState(0)

  const paginas = Math.max(1, Math.ceil(ventas.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, paginas - 1)
  const visibles = ordenar(ventas, orden).slice(
    paginaActual * POR_PAGINA,
    (paginaActual + 1) * POR_PAGINA
  )
  const suma = totales(ventas)

  function cambiarOrden(columna: Columna) {
    setOrden((actual) => ({
      columna,
      direccion:
        actual.columna === columna && actual.direccion === "asc"
          ? "desc"
          : "asc",
    }))
    setPagina(0)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNAS.map(({ columna, titulo, numerica }) => {
                const Icono =
                  orden.columna !== columna
                    ? ArrowUpDown
                    : orden.direccion === "asc"
                      ? ArrowUp
                      : ArrowDown
                return (
                  <TableHead
                    key={columna}
                    className={numerica ? "text-right" : undefined}
                    aria-sort={
                      orden.columna === columna
                        ? orden.direccion === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-mx-2"
                      onClick={() => cambiarOrden(columna)}
                    >
                      {titulo}
                      <Icono
                        data-icon="inline-end"
                        className={
                          orden.columna === columna ? undefined : "opacity-40"
                        }
                      />
                    </Button>
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibles.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={COLUMNAS.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Ninguna operación coincide con los filtros.
                </TableCell>
              </TableRow>
            )}
            {visibles.map((venta) => (
              <TableRow
                key={venta.venta_id}
                tabIndex={0}
                className="cursor-pointer"
                onClick={() => onSeleccionar(venta.venta_id)}
                onKeyDown={(evento) => {
                  if (evento.key === "Enter" || evento.key === " ") {
                    evento.preventDefault()
                    onSeleccionar(venta.venta_id)
                  }
                }}
              >
                <TableCell className="font-medium">{venta.venta_id}</TableCell>
                <TableCell>{formatearDia(venta.fecha)}</TableCell>
                <TableCell>
                  {venta.nombre}{" "}
                  <span className="text-muted-foreground">
                    ({venta.producto_id})
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{venta.categoria}</Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {venta.unidades}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatearEuros(venta.precio_unitario)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatearEuros(venta.ingreso)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4}>
                Total selección ({suma.operaciones} operaciones)
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatearEntero(suma.unidades)}
              </TableCell>
              <TableCell />
              <TableCell className="text-right tabular-nums">
                {formatearEuros(suma.ingresos)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>Pulsa una fila para ver el cálculo y su origen.</span>
        <div className="flex items-center gap-2">
          <span className="tabular-nums">
            Página {paginaActual + 1} de {paginas}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Página anterior"
            disabled={paginaActual === 0}
            onClick={() => setPagina(paginaActual - 1)}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Página siguiente"
            disabled={paginaActual >= paginas - 1}
            onClick={() => setPagina(paginaActual + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  )
}
