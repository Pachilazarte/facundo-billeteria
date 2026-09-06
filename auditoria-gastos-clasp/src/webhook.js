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

    // SI LA PWA PIDE ACTUALIZAR LA CATEGORÍA DE UN GASTO
    if (payload.action === "updateCategory" && payload.id && payload.categoria) {
      const result = updateGastoCategoria(payload.id, payload.categoria);
      if (result) {
        return responseJson({ success: true }, 200);
      } else {
        return responseJson({ error: 'Gasto no encontrado' }, 404);
      }
    }

    // SI ES UNA IMAGEN DESDE LA PWA (PROCESAR CON IA)
    if (payload.origen === "pwa_scanner_image" && payload.image) {
      const geminiApiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
      if (!geminiApiKey) {
        return responseJson({ error: 'No hay GEMINI_API_KEY configurada en Apps Script' }, 500);
      }

      const prompt = `Analiza la imagen. Puede ser un comprobante de pago/transferencia o una planilla de sueldos semanal. Extrae los datos en formato JSON estricto, sin markdown:
{
  "monto": numero (si es comprobante, el monto pagado. Si es planilla de sueldo, el Total final a cobrar),
  "concepto": "A quien se le pagó o el motivo resumido. Si es planilla de sueldo, pon 'Liquidación Semanal'",
  "metodo_pago": "El banco o billetera desde donde se hizo el pago, ej: BNA, Naranja, Personal Pay, BIND. Si es planilla, pon 'Planilla'",
  "fecha": "Fecha en formato YYYY-MM-DD o null si no se encuentra",
  "is_own_transfer": booleano,
  "is_salary": booleano
}
Reglas:
- is_own_transfer debe ser true SI Y SÓLO SI el remitente y el destinatario son la misma persona (ej: "Facundo Maximiliano Lazarte").
- is_salary debe ser true si la imagen es claramente una tabla o planilla de liquidación de horas/sueldo.`;

      const imageParts = [{
        inlineData: {
          data: payload.image.split(',')[1] || payload.image,
          mimeType: payload.mimeType || "image/jpeg"
        }
      }];

      const modelsToTry = [
        "gemini-3.8-flash",
        "gemini-3.7-flash",
        "gemini-3.6-flash"
      ];
      
      let aiResponse;
      let usedModel = "";

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

      for (let model of modelsToTry) {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
        aiResponse = UrlFetchApp.fetch(geminiUrl, geminiOptions);
        if (aiResponse.getResponseCode() === 200) {
          usedModel = model;
          break;
        }
      }

      if (aiResponse.getResponseCode() !== 200) {
        return responseJson({ error: 'Fallo la IA con todos los modelos: ' + aiResponse.getContentText() }, 500);
      }

      const aiData = JSON.parse(aiResponse.getContentText());
      const textResult = aiData.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(textResult);

      let registro;
      if (parsedData.is_salary) {
        // Planilla de sueldo
        registro = registrarSueldoEsperado(parsedData.monto, aiData.fecha);
      } else if (parsedData.is_own_transfer) {
        // Transferencia entre cuentas propias = Movimiento de Efectivo (Extracción/Disponibilidad)
        registro = registrarMovimientoEfectivo(parsedData.monto, "Ingreso", "Transf. propia de " + parsedData.metodo_pago, payload.origen);
      } else if (payload.accion === "pendiente") {
        // El atajo pidió guardarlo para revisar luego
        registro = registrarPendiente(parsedData.monto, parsedData.concepto, parsedData.metodo_pago, payload.origen);
      } else {
        // Gasto normal
        registro = registrarGasto(parsedData.monto, parsedData.concepto, parsedData.metodo_pago, payload.origen);
      }

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
  if (e.parameter.action === 'getData') {
    const data = getDashboardData();
    return responseJson(data, 200);
  }
  
  // Retornamos la interfaz web del Dashboard
  const html = HtmlService.createHtmlOutputFromFile('Index');
  html.setTitle("Auditoría de Gastos");
  html.addMetaTag('viewport', 'width=device-width, initial-scale=1');
  return html;
}
