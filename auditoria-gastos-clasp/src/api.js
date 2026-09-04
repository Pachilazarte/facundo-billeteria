/**
 * Retorna todos los movimientos para que el frontend pueda filtrar
 */
function getDashboardData() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) {
    return { allData: [] };
  }
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { allData: [] }; // Solo headers o vacío
  }
  
  // Headers esperados: ID, Fecha, Monto, Concepto, Método, Categoría, Origen
  // saltamos la primera fila (headers)
  const rows = data.slice(1);
  const allData = [];
  
  // Ordenar desde el más reciente al más antiguo
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    const fecha = row[1];
    const monto = parseFloat(row[2]) || 0;
    const concepto = row[3];
    const categoria = row[4] || "Sin clasificar";
    const metodo = row[5] || "Desconocido";
    
    // Parse fecha para poder filtrar por mes en el frontend
    let isoDate = "";
    let displayDate = "";
    if (fecha) {
      const d = new Date(fecha);
      isoDate = Utilities.formatDate(d, "America/Argentina/Buenos_Aires", "yyyy-MM");
      displayDate = Utilities.formatDate(d, "America/Argentina/Buenos_Aires", "dd/MM HH:mm");
    }

    allData.push({
      fechaDisplay: displayDate,
      mesIso: isoDate,
      monto: monto,
      concepto: concepto,
      categoria: categoria,
      metodo: metodo
    });
  }
  
  return {
    allData: allData
  };
}
