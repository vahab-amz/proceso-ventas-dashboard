"use client"

import { RotateCcw, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { type Filtros, filtrosVacios, hayFiltros } from "../lib/filtros"
import { formatearDia } from "../lib/formato"

const TODAS = "todas"

type Props = {
  filtros: Filtros
  onChange: (filtros: Filtros) => void
  categorias: string[]
  dias: string[]
  resultados: number
  total: number
}

export function FiltrosBar({
  filtros,
  onChange,
  categorias,
  dias,
  resultados,
  total,
}: Props) {
  const opcionesCategoria = [
    { value: TODAS, label: "Todas las categorías" },
    ...categorias.map((categoria) => ({ value: categoria, label: categoria })),
  ]

  return (
    <section
      aria-label="Filtros"
      className="flex flex-col gap-3 rounded-xl border bg-card p-3"
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="relative md:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filtros.busqueda}
            onChange={(evento) =>
              onChange({ ...filtros, busqueda: evento.target.value })
            }
            placeholder="Buscar ID, producto o código"
            aria-label="Buscar ventas"
            className="pl-8"
          />
        </div>
        <Select
          items={opcionesCategoria}
          value={filtros.categoria ?? TODAS}
          onValueChange={(valor) =>
            onChange({
              ...filtros,
              categoria: valor === TODAS || valor === null ? null : valor,
            })
          }
        >
          <SelectTrigger aria-label="Categoría" className="md:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {opcionesCategoria.map((opcion) => (
              <SelectItem key={opcion.value} value={opcion.value}>
                {opcion.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 md:ml-auto">
          <span className="text-sm text-muted-foreground tabular-nums">
            {resultados} de {total} operaciones
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={!hayFiltros(filtros)}
            onClick={() => onChange(filtrosVacios)}
          >
            <RotateCcw data-icon="inline-start" />
            Limpiar
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">
          Días (sin selección = todo el periodo)
        </span>
        <ToggleGroup
          multiple
          variant="outline"
          size="sm"
          value={filtros.dias}
          onValueChange={(seleccion) =>
            onChange({ ...filtros, dias: [...seleccion].sort() })
          }
          className="flex-wrap"
        >
          {dias.map((dia) => (
            <ToggleGroupItem key={dia} value={dia} aria-label={dia}>
              {formatearDia(dia)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </section>
  )
}
