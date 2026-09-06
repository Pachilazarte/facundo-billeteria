/**
 * Retorna todos los datos necesarios para el frontend
 */
function getDashboardData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // Función auxiliar para leer hojas
  const leerHoja = (nombreHoja) => {
    const sheet = ss.getSheetByName(nombreHoja);
    if (!sheet) return [];
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    return data.slice(1);
  };

  const gastos = leerHoja(SHEET_GASTOS).map(r => ({
    id: r[0], fecha: r[1], monto: r[2], concepto: r[3], categoria: r[4], metodo: r[5], origen: r[6]
  })).reverse();

  const pendientes = leerHoja(SHEET_PENDIENTES).map(r => ({
    id: r[0], fecha: r[1], monto: r[2], concepto: r[3], categoria_propuesta: r[4], metodo: r[5], origen: r[6]
  })).reverse();

  const efectivo = leerHoja(SHEET_EFECTIVO).map(r => ({
    id: r[0], fecha: r[1], monto: r[2], tipo: r[3], concepto: r[4], origen: r[5]
  })).reverse();

  // Calcular saldo en efectivo
  let saldoEfectivo = 0;
  efectivo.forEach(mov => {
    if (mov.tipo === "Ingreso") saldoEfectivo += parseFloat(mov.monto) || 0;
    else if (mov.tipo === "Egreso") saldoEfectivo -= parseFloat(mov.monto) || 0;
  });

  return {
    gastos: gastos,
    pendientes: pendientes,
    efectivo: efectivo,
    saldoEfectivo: saldoEfectivo
  };
}

function updateGastoCategoria(id, nuevaCategoria) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_GASTOS);
  if (!sheet) return false;
  
  const data = sheet.getDataRange().getValues();
  // Asumiendo columnas: 1:ID, 2:Fecha, 3:Monto, 4:Concepto, 5:Categoría
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.getRange(i + 1, 5).setValue(nuevaCategoria);
      return true;
    }
  }
  return false;
}

