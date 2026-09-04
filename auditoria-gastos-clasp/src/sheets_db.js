/**
 * Lógica de conexión a Google Sheets y Auto-categorización
 */

// COMPLETAR CON EL ID DE TU GOOGLE SHEET (lo sacas de la URL de tu hoja de cálculo)
const SPREADSHEET_ID = "1pniNkPkC7X_tn2isYos5fp56YIEdKozvptJHtCsYLro";
const SHEET_NAME = "Gastos";

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

function registrarGasto(monto, concepto, metodo_pago, origen, fechaCustom) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  // Si no existe la hoja, la creamos y le ponemos encabezados
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["ID", "Fecha", "Monto", "Concepto", "Categoría", "Método de Pago", "Origen"]);
    // Dar formato a los encabezados
    sheet.getRange("A1:G1").setFontWeight("bold").setBackground("#d9d9d9");
    sheet.setFrozenRows(1);
  }
  
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

function registrarGastosBulk(gastosArray) {
  if (!gastosArray || gastosArray.length === 0) return;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["ID", "Fecha", "Monto", "Concepto", "Categoría", "Método de Pago", "Origen"]);
    sheet.getRange("A1:G1").setFontWeight("bold").setBackground("#d9d9d9");
    sheet.setFrozenRows(1);
  }
  
  const rows = gastosArray.map(g => {
    const cat = categorizarGasto(g.concepto);
    const fecha = g.fecha || new Date();
    return [Utilities.getUuid(), fecha, parseFloat(g.monto), g.concepto, cat, g.metodo_pago, g.origen];
  });
  
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}
