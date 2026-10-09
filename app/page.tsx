import { VentasDashboard } from "@/features/ventas/components/ventas-dashboard"
import { cargarDatosVentas } from "@/features/ventas/lib/cargar-datos"

export default async function Page() {
  const datos = await cargarDatosVentas()
  return <VentasDashboard {...datos} />
}
