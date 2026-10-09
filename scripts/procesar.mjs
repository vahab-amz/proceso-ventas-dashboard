import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const raiz = new URL('../', import.meta.url);
const texto = await readFile(new URL('public/data/ventas.csv', raiz), 'utf8');
const productos = JSON.parse(await readFile(new URL('public/data/productos.json', raiz), 'utf8'));

const PERIODO = { desde: '2026-10-01', hasta: '2026-10-07' };
const MONEDA = 'EUR';

// Lector válido SOLO para el CSV controlado de esta práctica:
// separador coma, sin campos entrecomillados, comas internas ni saltos en campos.
// En un proyecto con CSV arbitrarios, usa un parser que soporte esas características.
const lineas = texto.trim().split(/\r?\n/);
const columnas = lineas.shift().split(',');
const ventas = lineas.map((linea, indice) => {
  const campos = linea.split(',');
  if (campos.length !== columnas.length) throw new Error(`Fila ${indice + 2}: número de campos incorrecto`);
  return Object.fromEntries(columnas.map((columna, i) => [columna, campos[i]]));
});

console.log(`Entrada: ${ventas.length} filas de ventas y ${productos.length} productos.`);

// La fila 1 del CSV es la cabecera: el primer registro está en la fila 2.
const filas = ventas.map((venta, indice) => ({ fila_csv: indice + 2, venta }));

// 1. Índice por producto_id. Un ID repetido en el catálogo haría ambigua la relación, así que se detiene el proceso.
const indiceProductos = new Map();
for (const producto of productos) {
  if (!producto.producto_id || !producto.nombre || !producto.categoria) {
    throw new Error(`Catálogo: producto incompleto ${JSON.stringify(producto)}`);
  }
  if (indiceProductos.has(producto.producto_id)) {
    throw new Error(`Catálogo: producto_id repetido ${producto.producto_id}`);
  }
  indiceProductos.set(producto.producto_id, producto);
}
console.log(`Catálogo: ${indiceProductos.size} producto_id únicos.`);

// 2. Copias exactas y conflictos. Se agrupan las filas por venta_id:
//    - todas las versiones idénticas: se conserva la primera fila y el resto son copias excluidas;
//    - versiones distintas con el mismo ID: conflicto, todas las filas van a revisión (no se elige ninguna).
const duplicados = [];
const incidencias = [];
const candidatas = [];
const firma = (venta) => columnas.map((columna) => venta[columna]).join(',');

const filasPorId = new Map();
for (const fila of filas) {
  const id = fila.venta.venta_id.trim();
  if (id === '') {
    incidencias.push({ venta_id: '', fila_csv: fila.fila_csv, motivo: 'venta_id vacío' });
    continue;
  }
  if (!filasPorId.has(id)) filasPorId.set(id, []);
  filasPorId.get(id).push(fila);
}

for (const [id, grupo] of filasPorId) {
  const versiones = new Set(grupo.map((fila) => firma(fila.venta)));
  if (versiones.size > 1) {
    const filasGrupo = grupo.map((fila) => fila.fila_csv).join(', ');
    for (const fila of grupo) {
      incidencias.push({
        venta_id: id,
        fila_csv: fila.fila_csv,
        motivo: `conflicto: mismo venta_id con datos distintos (filas ${filasGrupo})`,
      });
    }
    continue;
  }
  const [original, ...copias] = grupo;
  candidatas.push(original);
  for (const copia of copias) {
    duplicados.push({
      venta_id: id,
      fila_csv: copia.fila_csv,
      motivo: `copia exacta de la fila ${original.fila_csv}`,
    });
  }
}

// 3. Validación de campos obligatorios, fecha, unidades, precio y referencia al catálogo.
//    Los vacíos se revisan antes de convertir: un vacío nunca se trata como cero.
function esFechaReal(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const [anio, mes, dia] = texto.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
}

function validar(venta) {
  const motivos = [];
  for (const columna of columnas) {
    if (venta[columna].trim() === '') motivos.push(`${columna} vacío`);
  }
  const fecha = venta.fecha.trim();
  const productoId = venta.producto_id.trim();
  const unidades = venta.unidades.trim();
  const precio = venta.precio_unitario.trim();

  if (fecha !== '') {
    if (!esFechaReal(fecha)) motivos.push(`fecha no válida (${fecha})`);
    else if (fecha < PERIODO.desde || fecha > PERIODO.hasta) motivos.push(`fecha fuera del periodo (${fecha})`);
  }
  if (unidades !== '' && !(/^\d+$/.test(unidades) && Number(unidades) > 0)) {
    motivos.push(`unidades no es un entero mayor que cero (${unidades})`);
  }
  if (precio !== '') {
    const valor = Number(precio);
    if (!/^-?\d+(\.\d+)?$/.test(precio) || !Number.isFinite(valor)) motivos.push(`precio_unitario no numérico (${precio})`);
    else if (valor < 0) motivos.push(`precio_unitario negativo (${precio})`);
  }
  if (productoId !== '' && !indiceProductos.has(productoId)) {
    motivos.push(`producto_id inexistente en el catálogo (${productoId})`);
  }
  return motivos;
}

// 4. Separar incidencias (venta_id, fila del CSV y motivo) de las operaciones válidas.
const validas = [];
for (const fila of candidatas) {
  const motivos = validar(fila.venta);
  if (motivos.length > 0) {
    incidencias.push({ venta_id: fila.venta.venta_id.trim(), fila_csv: fila.fila_csv, motivo: motivos.join('; ') });
  } else {
    validas.push(fila);
  }
}
duplicados.sort((a, b) => a.fila_csv - b.fila_csv);
incidencias.sort((a, b) => a.fila_csv - b.fila_csv);

// 5. Enriquecer cada venta válida con nombre, categoría e ingreso (unidades × precio histórico).
//    Los importes se acumulan en céntimos para evitar errores de coma flotante.
const enriquecidas = validas.map(({ fila_csv, venta }) => {
  const producto = indiceProductos.get(venta.producto_id.trim());
  const unidades = Number(venta.unidades);
  const precio = Number(venta.precio_unitario);
  const ingresoCentimos = Math.round(unidades * precio * 100);
  return {
    venta_id: venta.venta_id.trim(),
    fila_csv,
    fecha: venta.fecha.trim(),
    producto_id: producto.producto_id,
    nombre: producto.nombre,
    categoria: producto.categoria,
    unidades,
    precio_unitario: precio,
    ingreso: ingresoCentimos / 100,
    ingresoCentimos,
  };
});

// 6. Totales y agrupación de ingresos por categoría (todas las categorías del catálogo, aunque sumen 0).
let unidadesTotales = 0;
let ingresosTotalesCentimos = 0;
const centimosPorCategoria = new Map(productos.map((producto) => [producto.categoria, 0]));
for (const venta of enriquecidas) {
  unidadesTotales += venta.unidades;
  ingresosTotalesCentimos += venta.ingresoCentimos;
  centimosPorCategoria.set(venta.categoria, centimosPorCategoria.get(venta.categoria) + venta.ingresoCentimos);
}
const ingresosPorCategoria = [...centimosPorCategoria]
  .map(([categoria, centimos]) => ({ categoria, ingresos: centimos / 100 }))
  .sort((a, b) => b.ingresos - a.ingresos || a.categoria.localeCompare(b.categoria));

const sumaCategoriasCentimos = [...centimosPorCategoria.values()].reduce((suma, c) => suma + c, 0);
if (sumaCategoriasCentimos !== ingresosTotalesCentimos) {
  throw new Error('La suma de categorías no coincide con el ingreso total');
}

// 7. Resultado para el dashboard.
const generadoEn = new Date().toISOString();
const resultado = {
  periodo: PERIODO,
  moneda: MONEDA,
  generado_en: generadoEn,
  operaciones_validas: enriquecidas.length,
  unidades_totales: unidadesTotales,
  ingresos_totales: ingresosTotalesCentimos / 100,
  ingresos_por_categoria: ingresosPorCategoria,
};
await guardarResultado(resultado);

// Copia limpia de las ventas: solo operaciones válidas, una por venta_id, enriquecidas.
// La fuente original no se modifica; fila_csv permite rastrear cada línea hasta ella.
const columnasLimpias = ['venta_id', 'fila_csv', 'fecha', 'producto_id', 'nombre', 'categoria', 'unidades', 'precio_unitario', 'ingreso'];
await guardarVentasLimpias(
  [columnasLimpias.join(','), ...enriquecidas.map((venta) => columnasLimpias.map((columna) => venta[columna]).join(','))].join('\n'),
);

// 8. Informe de calidad. Cada fila de entrada pertenece a una sola categoría de recuento.
const sumaRecuentos = enriquecidas.length + duplicados.length + incidencias.length;
if (sumaRecuentos !== ventas.length) {
  throw new Error(`Recuentos descuadrados: ${ventas.length} filas de entrada y ${sumaRecuentos} clasificadas`);
}
const informe = {
  generado_en: generadoEn,
  entrada: { filas_ventas: ventas.length, productos_catalogo: productos.length },
  operaciones_validas: enriquecidas.length,
  duplicados_excluidos: duplicados.length,
  incidencias_excluidas: incidencias.length,
  comprobacion: `${ventas.length} filas = ${enriquecidas.length} válidas + ${duplicados.length} duplicados + ${incidencias.length} incidencias`,
  duplicados,
  incidencias,
};
await guardarCalidad(informe);

async function guardarResultado(resultado) {
  await mkdir(new URL('salida/', raiz), { recursive: true });
  await writeFile(new URL('salida/resumen.json', raiz), JSON.stringify(resultado, null, 2) + '\n');
}

async function guardarCalidad(informe) {
  await mkdir(new URL('salida/', raiz), { recursive: true });
  await writeFile(new URL('salida/calidad.json', raiz), JSON.stringify(informe, null, 2) + '\n');
}

async function guardarVentasLimpias(csv) {
  await mkdir(new URL('salida/', raiz), { recursive: true });
  await writeFile(new URL('salida/ventas_limpias.csv', raiz), csv + '\n');
}

console.log(informe.comprobacion);
console.log(`Ingresos totales: ${resultado.ingresos_totales} ${MONEDA} · Unidades: ${unidadesTotales}`);
const control = enriquecidas.filter((venta) => ['V001', 'V002', 'V003', 'V004'].includes(venta.venta_id));
console.log(
  `Control V001–V004: ${control.map((v) => `${v.venta_id}=${v.unidades}×${v.precio_unitario}=${v.ingreso}`).join(', ')}` +
    ` · suma ${control.reduce((s, v) => s + v.ingresoCentimos, 0) / 100} ${MONEDA}`,
);
console.log(`Salidas guardadas en ${fileURLToPath(new URL('salida/', raiz))}`);
