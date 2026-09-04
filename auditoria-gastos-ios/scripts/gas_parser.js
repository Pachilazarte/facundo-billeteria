/**
 * Script de Google Apps Script (GAS)
 * Lee correos de BNA, Naranja y Personal Pay.
 * Se debe ejecutar con un Trigger cada 5 o 10 minutos.
 */

const API_URL = "https://TU_DOMINIO_VERCEL.vercel.app/api/webhooks/gastos";
const API_TOKEN = "TU_TOKEN_SECRETO"; // Debe coincidir con el de Vercel/Next.js

function processEmails() {
  // Buscar correos no leídos de los bancos
  const query = "is:unread (from:notificaciones@bna.com.ar OR from:naranja OR from:personalpay)";
  const threads = GmailApp.search(query);
  
  if (threads.length === 0) return;

  threads.forEach(thread => {
    const messages = thread.getMessages();
    messages.forEach(msg => {
      if (msg.isUnread()) {
        const body = msg.getPlainBody();
        const sender = msg.getFrom();
        const subject = msg.getSubject();
        
        let monto = null;
        let concepto = "Compra desconocida";
        let metodo_pago = "Desconocido";

        // Lógica para BNA
        if (sender.toLowerCase().includes("bna.com.ar")) {
          metodo_pago = "BNA";
          // Ejemplo regex: $ 15.000,50
          const montoMatch = body.match(/\$ ?([0-9.,]+)/);
          if (montoMatch) monto = parseFloat(montoMatch[1].replace('.', '').replace(',', '.'));
          // Comercio: "en COMERCIO EJEMPLO el dia"
          const comercioMatch = body.match(/en\s+(.*?)\s+el\s+d[íi]a/i);
          if (comercioMatch) concepto = comercioMatch[1].trim();
        } 
        // Lógica para Naranja
        else if (sender.toLowerCase().includes("naranja")) {
          metodo_pago = "Naranja";
          const montoMatch = body.match(/\$ ?([0-9.,]+)/);
          if (montoMatch) monto = parseFloat(montoMatch[1].replace('.', '').replace(',', '.'));
          const comercioMatch = body.match(/en\s+(.*?)\s+a\s+las/i);
          if (comercioMatch) concepto = comercioMatch[1].trim();
        }
        // Lógica para Personal Pay
        else if (sender.toLowerCase().includes("personalpay")) {
          metodo_pago = "Personal Pay";
          const montoMatch = body.match(/\$ ?([0-9.,]+)/);
          if (montoMatch) monto = parseFloat(montoMatch[1].replace('.', '').replace(',', '.'));
          const comercioMatch = body.match(/en\s+(.*?)\s+por/i);
          if (comercioMatch) concepto = comercioMatch[1].trim();
        }

        if (monto) {
          enviarAlWebhook(monto, concepto, metodo_pago);
        }
        
        // Marcar como procesado (leído)
        msg.markRead();
      }
    });
  });
}

function enviarAlWebhook(monto, concepto, metodo_pago) {
  const payload = {
    monto: monto,
    concepto: concepto,
    metodo_pago: metodo_pago,
    origen: "gas_parser"
  };

  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "Authorization": "Bearer " + API_TOKEN
    },
    payload: JSON.stringify(payload)
  };

  try {
    UrlFetchApp.fetch(API_URL, options);
  } catch (e) {
    console.error("Error al enviar a webhook", e);
  }
}
