# Ventas 01 · Auditoría de ventas, del dato al dashboard

Práctica 5074. Proceso reproducible que lee dos fuentes, detecta incidencias, relaciona ventas con productos y publica métricas verificadas en un dashboard Next.js.

- **Dashboard publicado:** https://proceso-ventas-dashboard.vercel.app/
- **Salidas del proceso:** [`salida/resumen.json`](salida/resumen.json), [`salida/calidad.json`](salida/calidad.json) y [`salida/ventas_limpias.csv`](salida/ventas_limpias.csv)

## Pregunta

¿Qué categorías de producto generan más ingresos entre el **1 y el 7 de octubre de 2026** (ambos incluidos)?

**Ingreso de una operación = unidades × precio_unitario**, con el precio histórico de la venta, en **EUR**. No es beneficio: el modelo no incluye impuestos, descuentos, costes ni devoluciones.

## Cómo ejecutarlo

```bash
node --version          # Node.js 20 o superior
npm run procesar        # equivale a: node scripts/procesar.mjs
npm run dev             # dashboard en http://localhost:3000
```

El script no necesita paquetes externos.

## Estructura

```
public/data/ventas.csv        fuente original (no se modifica)
public/data/productos.json    fuente original (no se modifica)
scripts/procesar.mjs          proceso por lotes: validación, integración y métricas
salida/                       resultados generados (separados de las fuentes)
  resumen.json                métricas para el dashboard
  calidad.json                recuentos, duplicados e incidencias
  ventas_limpias.csv          operaciones válidas enriquecidas, con su fila de origen
features/ventas/              todo lo de la funcionalidad "ventas" (organización por feature)
  types.ts                    tipos de las salidas
  lib/cargar-datos.ts         lectura de salida/ en el servidor (en tiempo de build)
  lib/filtros.ts              filtros y agregaciones (en céntimos)
  lib/comprobaciones.ts       comprobaciones mostradas en el dashboard
  lib/formato.ts              formato de euros y fechas
  components/                 cabecera, filtros, KPIs, gráficas, tabla, calidad, comprobaciones
components/ui/                componentes shadcn/ui
app/page.tsx                  carga los datos y monta el dashboard
```

## Fuentes y campos utilizados

| Fuente | Campos | Uso |
| --- | --- | --- |
| `ventas.csv` (70 filas + cabecera) | `venta_id`, `fecha`, `producto_id`, `unidades`, `precio_unitario` | Operaciones, periodo y cálculo del ingreso |
| `productos.json` (8 productos) | `producto_id`, `nombre`, `categoria` | Enriquecer cada venta con nombre y categoría |

La relación se hace por `producto_id` con un índice (`Map`). Cada venta busca un único producto, así que las filas no se multiplican. El proceso se detiene si el catálogo tiene un `producto_id` repetido o un producto incompleto.

## Reglas de limpieza

Se aplican en este orden. Cada fila de entrada acaba en **una sola** categoría: válida, copia duplicada o incidencia.

1. **`venta_id` vacío:** es una incidencia, porque la fila no se puede identificar.
2. **Agrupación por `venta_id`:**
   - Si todas las filas con ese ID son idénticas en todos sus campos, se conserva la primera. Las demás se excluyen como *copia exacta de la fila N*.
   - Si el mismo ID tiene datos distintos, hay un **conflicto**. Todas sus filas pasan a incidencias para revisión y no se elige ninguna versión.
   - Dos IDs distintos con el mismo producto, unidades y precio **no** son duplicados.
3. **Validación**, solo sobre la copia conservada:
   - Un campo obligatorio vacío es una incidencia. Nunca se convierte en 0.
   - `fecha` debe tener el formato `YYYY-MM-DD` y ser un día real (2026-02-30 no lo es). Además, debe estar dentro del periodo.
   - `unidades` debe ser un entero mayor que 0.
   - `precio_unitario` debe ser un número finito mayor o igual que 0.
   - `producto_id` debe existir en el catálogo. No se inventan nombres ni categorías.
4. Los importes se acumulan en **céntimos enteros** para evitar errores de coma flotante.

## Incidencias encontradas

| Tipo | venta_id | Fila CSV | Motivo | Tratamiento |
| --- | --- | --- | --- | --- |
| Duplicado | V003 | 62 | Copia exacta de la fila 4 | Excluida y contada una vez |
| Duplicado | V011 | 63 | Copia exacta de la fila 12 | Excluida y contada una vez |
| Duplicado | V021 | 64 | Copia exacta de la fila 22 | Excluida y contada una vez |
| Duplicado | V036 | 65 | Copia exacta de la fila 37 | Excluida y contada una vez |
| Duplicado | V049 | 66 | Copia exacta de la fila 50 | Excluida y contada una vez |
| Incidencia | V061 | 67 | `unidades` vacío | Excluida (no se trata como 0) |
| Incidencia | V062 | 68 | `precio_unitario` vacío | Excluida (no se trata como 0) |
| Incidencia | V063 | 69 | `producto_id` inexistente (P99) | Excluida (no se inventa categoría) |
| Incidencia | V064 | 70 | `unidades` = -2 | Excluida |
| Incidencia | V065 | 71 | `precio_unitario` = "gratis" | Excluida |

**Cuadre: 70 filas = 60 válidas + 5 duplicados + 5 incidencias.**

## Resultado

| Categoría | Ingresos (EUR) |
| --- | --- |
| Hogar | 1088,00 |
| Deporte | 875,00 |
| Tecnología | 308,00 |
| Papelería | 72,00 |
| **Total** | **2343,00** |

En total son 60 operaciones válidas y 150 unidades.

## Cálculos comprobados

1. **Cálculo manual de V001–V004**, con una sola copia por operación (V003 aparece dos veces en el CSV):

   | ID | Cálculo | Ingreso |
   | --- | --- | --- |
   | V001 | 1 × 5 | 5 € |
   | V002 | 2 × 2 | 4 € |
   | V003 | 3 × 12 | 36 € |
   | V004 | 4 × 25 | 100 € |
   | **Suma** | | **145 €** |

   El proceso da 145 €, el mismo resultado. Se puede ver en la consola del script y en la pestaña *Comprobaciones*.
2. **La suma de categorías coincide con el total:** 1088 + 875 + 308 + 72 = 2343 €. El script se detiene si no coinciden.
3. **El cuadre de filas es correcto:** 70 = 60 + 5 + 5. El script se detiene si no cuadra.
4. **`ventas_limpias.csv` coincide con `resumen.json`:** 60 operaciones, 150 unidades, 2343 € y el mismo reparto por categoría.
5. **El proceso es reproducible:** se ejecutó dos veces seguidas y `resumen.json`, `calidad.json` y `ventas_limpias.csv` salieron idénticos, salvo `generado_en`.
6. **Casos que no están en el CSV:** se probaron sobre una copia de los datos. Un ID repetido con datos distintos genera un conflicto en sus dos filas. `2026-02-30` se marca como fecha no válida, `2026-10-08` como fuera del periodo y `1.5` unidades como no entero.
7. **URL publicada:** la web muestra «Generado el 9 de octubre de 2026, 19:48:35 (hora de Madrid)» y el `generado_en` de `salida/resumen.json` es `2026-10-09T17:48:35.690Z`. Son el mismo instante: la `Z` indica hora UTC y en octubre Madrid está en UTC+2 (17:48 + 2 h = 19:48). La web muestra además 2343,00 € de ingresos totales, igual que `resumen.json`. Por tanto, la URL sirve el último resultado incorporado.

La pestaña *Comprobaciones* del dashboard recalcula los puntos 1 a 4 con los archivos de salida en cada build.

## Dashboard

Todas las cifras proceden de `salida/`. Ninguna está escrita a mano en las cards.

- **KPIs:** ingresos totales (EUR), operaciones válidas, unidades totales y número de registros excluidos por duplicación y por incidencias. Sin filtros (etiqueta *Total*), los valores vienen de `resumen.json` y `calidad.json`. Con filtros (etiqueta *Filtrado*), se recalculan desde `ventas_limpias.csv` y muestran qué parte del total representan. El detalle de duplicados e incidencias está en `calidad.json` y en este README.
- **Gráfica de barras de ingresos por categoría.** Se usan barras porque las categorías son grupos independientes, sin orden ni continuidad, y lo que interesa es comparar sus magnitudes. Las barras comparten una base en cero, así que la longitud es proporcional al valor y se ordenan de mayor a menor. Un gráfico circular haría más difícil comparar valores parecidos, y uno de líneas sugeriría una continuidad que no existe.
- **Gráfica de ingresos por día**, como contexto del periodo.
- **Productos más y menos vendidos:** destaca el producto con más y con menos unidades vendidas (o ingresos, a elegir) e incluye el ranking completo en barras horizontales. Sin filtros, el más vendido es Lámpara (32 uds., 800 €) y el menos vendido es Cable USB (7 uds.). Por ingresos, el menos vendido es Bolígrafo (32 €). Si hay empate, se muestran todos los productos empatados.
- **Periodo analizado y fecha de generación** del resumen, en la cabecera.
- **Interactividad:**
  - Búsqueda por ID o producto, selector de categoría y filtro de días.
  - Un clic en una barra filtra por esa categoría, ese día o ese producto.
  - Las gráficas pueden mostrar EUR o unidades.
  - La tabla se puede ordenar y paginar.
  - Al pulsar una venta se abre su detalle: cálculo y fila de origen.
  - Hay tema claro y oscuro.

## Mecanismo de actualización

Es un proceso **por lotes y manual**. No hay ingestión continua ni streaming.

1. Sustituir `public/data/ventas.csv` y, si cambia, `public/data/productos.json`.
2. Ejecutar `npm run procesar`. Se regenera `salida/`.
3. Revisar `salida/calidad.json` (cuadre e incidencias).
4. `git add salida public/data && git commit && git push`.
5. Vercel detecta el push y hace un nuevo build. La página es estática y lee `salida/` **durante el build**, así que las nuevas ventas aparecen en la URL pública cuando termina ese despliegue, no antes.
6. Comprobar en la URL que la fecha de generación coincide con la del nuevo `resumen.json`.

## Limitaciones

- Datos sintéticos y pequeños, cargados en memoria. No permiten conclusiones sobre comercios reales.
- El lector CSV solo sirve para este formato controlado: sin comillas, comas internas ni saltos dentro de campos. Para CSV arbitrarios habría que usar un parser adecuado.
- Las fuentes están en `public/data/`, así que Vercel también las sirve públicamente. Aquí no es un problema porque son sintéticas y no contienen datos personales, pero con datos reales irían fuera de `public/`.
- Sin impuestos, descuentos, costes, devoluciones ni conversión de moneda: el ingreso no es beneficio.
- La actualización depende de ejecutar el script y publicar. El dashboard no detecta cambios por sí solo.
- Con más volumen habría que medir antes los requisitos y revisar la lectura por partes, la memoria, las particiones y la deduplicación entre procesos.
