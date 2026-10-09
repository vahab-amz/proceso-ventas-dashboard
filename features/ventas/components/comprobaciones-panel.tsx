import { CircleCheck, CircleX } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { Comprobacion } from "../lib/comprobaciones"
import { formatearEuros } from "../lib/formato"

type FilaControl = {
  venta_id: string
  unidades: number
  precio_unitario: number
  ingreso: number
  ingresoProceso: number | null
  correcta: boolean
}

type Props = {
  comprobaciones: Comprobacion[]
  control: FilaControl[]
}

function Estado({ correcta }: { correcta: boolean }) {
  return correcta ? (
    <CircleCheck
      className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
      aria-label="Correcta"
    />
  ) : (
    <CircleX className="size-5 shrink-0 text-destructive" aria-label="Error" />
  )
}

export function ComprobacionesPanel({ comprobaciones, control }: Props) {
  const sumaManual = control.reduce((suma, fila) => suma + fila.ingreso, 0)
  const sumaProceso = control.reduce(
    (suma, fila) => suma + (fila.ingresoProceso ?? 0),
    0
  )

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Comprobaciones automáticas</CardTitle>
          <CardDescription>
            Se recalculan con los resultados del proceso en cada build.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-3">
            {comprobaciones.map((comprobacion) => (
              <li key={comprobacion.titulo} className="flex gap-3">
                <Estado correcta={comprobacion.correcta} />
                <div className="flex min-w-0 flex-col">
                  <span className="font-medium">{comprobacion.titulo}</span>
                  <span className="text-sm break-words text-muted-foreground">
                    {comprobacion.detalle}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contraste manual V001–V004</CardTitle>
          <CardDescription>
            Cálculo a mano sobre las ventas originales con una sola copia por
            operación, comparado con el ingreso del proceso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cálculo manual</TableHead>
                <TableHead className="text-right">Proceso</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {control.map((fila) => (
                <TableRow key={fila.venta_id}>
                  <TableCell className="font-medium">{fila.venta_id}</TableCell>
                  <TableCell className="font-mono text-xs tabular-nums">
                    {fila.unidades} × {formatearEuros(fila.precio_unitario)} ={" "}
                    {formatearEuros(fila.ingreso)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fila.ingresoProceso === null
                      ? "—"
                      : formatearEuros(fila.ingresoProceso)}
                  </TableCell>
                  <TableCell>
                    <Estado correcta={fila.correcta} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell>Suma</TableCell>
                <TableCell className="tabular-nums">
                  {formatearEuros(sumaManual)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatearEuros(sumaProceso)}
                </TableCell>
                <TableCell>
                  <Estado correcta={sumaManual === sumaProceso} />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
