/**
 * Lógica de conexión a Google Sheets y Auto-categorización
 */

// COMPLETAR CON EL ID DE TU GOOGLE SHEET (lo sacas de la URL de tu hoja de cálculo)
const SPREADSHEET_ID = "1pniNkPkC7X_tn2isYos5fp56YIEdKozvptJHtCsYLro";
const SHEET_GASTOS = "Gastos";
const SHEET_PENDIENTES = "Pendientes";
const SHEET_EFECTIVO = "Caja_Efectivo";
const SHEET_DEUDAS = "Deudas";
const SHEET_SUELDOS = "Sueldos";

// Categorías por defecto con palabras clave
const CATEGORIAS = [
  { nombre: 'Supermercado', keywords: ['coto', 'carrefour', 'vea', 'dia', 'jumbo', 'disco'] },
  { nombre: 'Suscripciones', keywords: ['netflix', 'spotify', 'apple', 'icloud', 'youtube', 'amazon', 'prime'] },
  { nombre: 'Transporte', keywords: ['sube', 'uber', 'cabify', 'didi', 'estacionamiento', 'peaje', 'nafta', 'ypf', 'shell', 'axion'] },
  { nombre: 'Comida / Delivery', keywords: ['pedidosya', 'rappi', 'mcdonalds', 'burger king', 'mostaza', 'starbucks', 'cafe', 'bar', 'pizzeria'] },
  { nombre: 'Kiosco / Farmacia', keywords: ['farmacity', 'kiosco', 'open25', 'farmacia'] }
];

function categorizarGasto(concepto) {
  if (!concepto) return "Sin clasificar";
  const textoNormalized = concepto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  for (let i = 0; i < CATEGORIAS.length; i++) {
    const cat = CATEGORIAS[i];
    for (let j = 0; j < cat.keywords.length; j++) {
      if (textoNormalized.indexOf(cat.keywords[j].toLowerCase()) !== -1) {
        return cat.nombre;
      }
    }
  }
  
  return "Sin clasificar";
}

function initSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  const ensureSheet = (sheetName, headers) => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#d9d9d9");
      sheet.setFrozenRows(1);
    }
    return sheet;
  };

  ensureSheet(SHEET_GASTOS, ["ID", "Fecha", "Monto", "Concepto", "Categoría", "Método de Pago", "Origen"]);
  ensureSheet(SHEET_PENDIENTES, ["ID", "Fecha", "Monto", "Concepto", "Categoría Propuesta", "Método de Pago", "Origen"]);
  ensureSheet(SHEET_EFECTIVO, ["ID", "Fecha", "Monto", "Tipo (Ingreso/Egreso)", "Concepto", "Origen"]);
  ensureSheet(SHEET_DEUDAS, ["ID", "Fecha Compra", "Monto Total", "Cuotas Totales", "Cuota Actual", "Monto Cuota", "Tarjeta", "Concepto"]);
  ensureSheet(SHEET_SUELDOS, ["ID", "Semana", "Monto Esperado", "Monto Cobrado", "Diferencia", "Estado"]);
}

function registrarGasto(monto, concepto, metodo_pago, origen, fechaCustom) {
  initSheets();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_GASTOS);
  
  const categoria = categorizarGasto(concepto);
  const fecha = fechaCustom || new Date();
  // UUID generico en GAS
  const idGasto = Utilities.getUuid(); 
  
  sheet.appendRow([
    idGasto,
    fecha,
    parseFloat(monto),
    concepto,
    categoria,
    metodo_pago,
    origen
  ]);
  
  // Retornamos el objeto insertado para el webhook
  return {
    id: idGasto,
    monto: monto,
    concepto: concepto,
    categoria: categoria
  };
}

// Función de utilidad para testear desde el editor
function testRegistro() {
  registrarGasto(1500, "Cafe Martinez", "Efectivo", "test");
}

function registrarPendiente(monto, concepto, metodo_pago, origen, categoriaPropuesta) {
  initSheets();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_PENDIENTES);
  
  const idGasto = Utilities.getUuid(); 
  sheet.appendRow([
    idGasto,
    new Date(),
    parseFloat(monto),
    concepto,
    categoriaPropuesta || "Sin clasificar",
    metodo_pago,
    origen
  ]);
  
  return { id: idGasto, monto, concepto, estado: "pendiente" };
}

function registrarMovimientoEfectivo(monto, tipo, concepto, origen) {
  initSheets();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_EFECTIVO);
  
  const idMov = Utilities.getUuid(); 
  sheet.appendRow([
    idMov,
    new Date(),
    parseFloat(monto),
    tipo, // "Ingreso" (ej. extraccion de cajero) o "Egreso" (gasto real)
    concepto,
    origen
  ]);
  
  return { id: idMov, monto, tipo, concepto };
}

function registrarSueldoEsperado(monto_esperado, fecha) {
  initSheets();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_SUELDOS);
  
  const idSueldo = Utilities.getUuid();
  const weekStart = new Date();
  
  sheet.appendRow([
    idSueldo,
    weekStart, // Semana
    parseFloat(monto_esperado),
    0, // Monto Cobrado
    parseFloat(monto_esperado), // Diferencia inicial
    "Pendiente" // Estado
  ]);
  
  return { id: idSueldo, monto_esperado: monto_esperado, estado: "Sueldo registrado" };
}

function registrarGastosBulk(gastosArray) {
  if (!gastosArray || gastosArray.length === 0) return;
  initSheets();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_GASTOS);
  
  const rows = gastosArray.map(g => {
    const cat = categorizarGasto(g.concepto);
    const fecha = g.fecha || new Date();
    return [Utilities.getUuid(), fecha, parseFloat(g.monto), g.concepto, cat, g.metodo_pago, g.origen];
  });
  
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}
