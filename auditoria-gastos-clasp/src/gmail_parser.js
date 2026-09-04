/**
 * Script de parseo de Gmail
 * Se debe ejecutar con un Trigger de GAS cada 10 minutos.
 */

function procesarCorreosBancarios() {
  // Buscar correos no leídos de los bancos (usamos bna.com.ar en general para agarrar bnanet.bna.com.ar)
  const query = "is:unread (from:bna.com.ar OR from:naranja OR from:personalpay OR from:bancoindustrial.com.ar)";
  const threads = GmailApp.search(query);
  
  if (threads.length === 0) return;

  threads.forEach(thread => {
    const messages = thread.getMessages();
    messages.forEach(msg => {
      if (msg.isUnread()) {
        const body = msg.getPlainBody();
        const sender = msg.getFrom();
        const date = msg.getDate();
        // const subject = msg.getSubject();
        
        let monto = null;
        let concepto = "Compra desconocida";
        let metodo_pago = "Desconocido";

        // Función auxiliar para parsear montos "118.943,29" -> 118943.29
        const parseMonto = (montoStr) => {
          return parseFloat(montoStr.replace(/\./g, '').replace(',', '.'));
        };

        // Lógica para BNA
        if (sender.toLowerCase().includes("bna.com.ar")) {
          metodo_pago = "BNA";
          const montoMatch = body.match(/\$\s?([0-9.,]+)/);
          if (montoMatch) monto = parseMonto(montoMatch[1]);
          
          const transferenciaMatch = body.match(/transferencia a (.*?) por/i);
          const comercioMatch = body.match(/en\s+(.*?)\s+el\s+d[íi]a/i);
          
          if (transferenciaMatch) concepto = "Transf: " + transferenciaMatch[1].trim();
          else if (comercioMatch) concepto = comercioMatch[1].trim();
        } 
        // Lógica para Naranja
        else if (sender.toLowerCase().includes("naranja")) {
          metodo_pago = "Naranja";
          const montoMatch = body.match(/\$\s?([0-9.,]+)/);
          if (montoMatch) monto = parseMonto(montoMatch[1]);
          
          const comercioMatch = body.match(/en\s+(.*?)\s+a\s+las/i);
          if (comercioMatch) concepto = comercioMatch[1].trim();
        }
        // Lógica para Personal Pay
        else if (sender.toLowerCase().includes("personalpay")) {
          metodo_pago = "Personal Pay";
          const subject = msg.getSubject() || "";
          if (subject.toLowerCase().includes("pagar tu próxima cuota") || body.toLowerCase().includes("adelantá el pago")) {
            const montoMatch = body.match(/saldo es:\s*\$\s*([0-9.,]+)/i) || body.match(/\$\s?([0-9.,]+)/);
            if (montoMatch) monto = parseMonto(montoMatch[1]);
            concepto = "Pedido de pago: Cuota Personal Pay";
          } else {
            const montoMatch = body.match(/\$\s?([0-9.,]+)/);
            if (montoMatch) monto = parseMonto(montoMatch[1]);
            const comercioMatch = body.match(/en\s+(.*?)\s+por/i);
            if (comercioMatch) concepto = comercioMatch[1].trim();
          }
        }
        // Lógica para BIND
        else if (sender.toLowerCase().includes("bancoindustrial.com.ar")) {
          metodo_pago = "BIND";
          const montoMatch = body.match(/Importe:\s*([0-9.,]+)\s*ARS/i);
          if (montoMatch) monto = parseMonto(montoMatch[1]);
          
          const originanteMatch = body.match(/Originante:\s*(.*)/i);
          if (originanteMatch) concepto = "Ingreso de: " + originanteMatch[1].trim();
        }

        if (monto) {
          registrarGasto(monto, concepto, metodo_pago, "gas_parser", date);
        }
        
        msg.markRead();
      }
    });
  });
}

// Función especial para correr a mano 1 sola vez y traer todo lo de agosto en adelante
function importarHistorico() {
  const query = "(from:bna.com.ar OR from:naranja OR from:personalpay OR from:bancoindustrial.com.ar) after:2026/08/01";
  const threads = GmailApp.search(query, 0, 500);
  
  if (threads.length === 0) return;

  const gastosBulk = [];

  threads.forEach(thread => {
    const messages = thread.getMessages();
    messages.forEach(msg => {
      const body = msg.getPlainBody();
      const sender = msg.getFrom();
      const date = msg.getDate();
      
      let monto = null;
      let concepto = "Compra desconocida";
      let metodo_pago = "Desconocido";

      const parseMonto = (montoStr) => parseFloat(montoStr.replace(/\./g, '').replace(',', '.'));

      if (sender.toLowerCase().includes("bna.com.ar")) {
        metodo_pago = "BNA";
        const montoMatch = body.match(/\$\s?([0-9.,]+)/);
        if (montoMatch) monto = parseMonto(montoMatch[1]);
        const transferenciaMatch = body.match(/transferencia a (.*?) por/i);
        const comercioMatch = body.match(/en\s+(.*?)\s+el\s+d[íi]a/i);
        if (transferenciaMatch) concepto = "Transf: " + transferenciaMatch[1].trim();
        else if (comercioMatch) concepto = comercioMatch[1].trim();
      } else if (sender.toLowerCase().includes("naranja")) {
        metodo_pago = "Naranja";
        const montoMatch = body.match(/\$\s?([0-9.,]+)/);
        if (montoMatch) monto = parseMonto(montoMatch[1]);
        const comercioMatch = body.match(/en\s+(.*?)\s+a\s+las/i);
        if (comercioMatch) concepto = comercioMatch[1].trim();
      } else if (sender.toLowerCase().includes("personalpay")) {
        metodo_pago = "Personal Pay";
        const subject = msg.getSubject() || "";
        if (subject.toLowerCase().includes("pagar tu próxima cuota") || body.toLowerCase().includes("adelantá el pago")) {
          const montoMatch = body.match(/saldo es:\s*\$\s*([0-9.,]+)/i) || body.match(/\$\s?([0-9.,]+)/);
          if (montoMatch) monto = parseMonto(montoMatch[1]);
          concepto = "Pedido de pago: Cuota Personal Pay";
        } else {
          const montoMatch = body.match(/\$\s?([0-9.,]+)/);
          if (montoMatch) monto = parseMonto(montoMatch[1]);
          const comercioMatch = body.match(/en\s+(.*?)\s+por/i);
          if (comercioMatch) concepto = comercioMatch[1].trim();
        }
      } else if (sender.toLowerCase().includes("bancoindustrial.com.ar")) {
        metodo_pago = "BIND";
        const montoMatch = body.match(/Importe:\s*([0-9.,]+)\s*ARS/i);
        if (montoMatch) monto = parseMonto(montoMatch[1]);
        const originanteMatch = body.match(/Originante:\s*(.*)/i);
        if (originanteMatch) concepto = "Ingreso de: " + originanteMatch[1].trim();
      }

      if (monto) {
        gastosBulk.push({
          monto: monto, concepto: concepto, metodo_pago: metodo_pago, origen: "historico", fecha: date
        });
      }
    });
  });

  if (gastosBulk.length > 0) {
    registrarGastosBulk(gastosBulk);
  }
}
