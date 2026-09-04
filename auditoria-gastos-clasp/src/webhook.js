/**
 * Webhook (doPost)
 * Recibe las llamadas HTTP POST desde el Atajo de iOS.
 */

const API_SECRET_TOKEN = "facu_gastos_2026"; // Mismo token que en el Atajo

function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return responseJson({ error: 'No se enviaron datos' }, 400);
    }

    let payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (err) {
      return responseJson({ error: 'Payload no es JSON válido' }, 400);
    }
    
    if (payload.token !== API_SECRET_TOKEN) {
      return responseJson({ error: 'Unauthorized' }, 401);
    }

    // SI ES UNA IMAGEN DESDE LA PWA (PROCESAR CON IA)
    if (payload.origen === "pwa_scanner_image" && payload.image) {
      const geminiApiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
      if (!geminiApiKey) {
        return responseJson({ error: 'No hay GEMINI_API_KEY configurada en Apps Script' }, 500);
      }

      const prompt = `Analiza este comprobante de pago o transferencia. Extrae los siguientes datos en formato JSON estricto, sin markdown:
{
  "monto": numero,
  "concepto": "A quien se le pagó o el motivo resumido",
  "metodo_pago": "El banco o billetera desde donde se hizo el pago, ej: Mercado Pago, BNA, Naranja",
  "fecha": "Fecha en formato YYYY-MM-DD o null"
}`;

      const imageParts = [{
        inlineData: {
          data: payload.image.split(',')[1] || payload.image,
          mimeType: payload.mimeType || "image/jpeg"
        }
      }];

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
      
      const geminiOptions = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify({
          contents: [{
            parts: [{text: prompt}, ...imageParts]
          }]
        }),
        muteHttpExceptions: true
      };

      const aiResponse = UrlFetchApp.fetch(geminiUrl, geminiOptions);
      if (aiResponse.getResponseCode() !== 200) {
        return responseJson({ error: 'Fallo la IA: ' + aiResponse.getContentText() }, 500);
      }

      const aiData = JSON.parse(aiResponse.getContentText());
      const textResult = aiData.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(textResult);

      const registro = registrarGasto(parsedData.monto, parsedData.concepto, parsedData.metodo_pago, "pwa_scanner_image");
      return responseJson({ success: true, data: registro }, 200);
    }
    
    // FLUJO NORMAL (Atajo de iOS)
    let monto = payload.monto;
    let concepto = payload.concepto;
    const metodo_pago = payload.metodo_pago || "Efectivo";
    const origen = payload.origen || "ios_shortcut";

    // Si viene desde el celular como un solo texto "1500 cafe"
    if (payload.texto_crudo) {
      const partes = payload.texto_crudo.trim().split(" ");
      monto = partes[0]; // El primer elemento es el monto
      concepto = partes.slice(1).join(" "); // El resto es el concepto
    }
    
    if (!monto || !concepto) {
      return responseJson({ error: 'Monto y concepto son requeridos' }, 400);
    }
    
    const registro = registrarGasto(monto, concepto, metodo_pago, origen);
    
    return responseJson({ success: true, data: registro }, 200);

  } catch (error) {
    return responseJson({ error: error.message }, 500);
  }
}

// Función auxiliar para responder JSON
function responseJson(data, status) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Responde si alguien entra por GET al webapp
function doGet(e) {
  // Retornamos la interfaz web del Dashboard
  const html = HtmlService.createHtmlOutputFromFile('Index');
  html.setTitle("Auditoría de Gastos");
  html.addMetaTag('viewport', 'width=device-width, initial-scale=1');
  return html;
}
