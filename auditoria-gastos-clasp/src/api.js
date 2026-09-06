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
