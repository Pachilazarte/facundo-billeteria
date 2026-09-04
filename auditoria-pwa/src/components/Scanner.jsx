import React, { useEffect, useState } from 'react';
import { APPS_SCRIPT_URL } from '../config';

export default function Scanner({ file, onScanComplete, onCancel }) {
  const [preview, setPreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleScan = async () => {
    setIsScanning(true);
    setError(null);
    try {
      const base64 = await toBase64(file);
      // Enviar directamente a Google Apps Script usando text/plain para evitar CORS preflight
      const gasResponse = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          token: "facu_gastos_2026",
          origen: "pwa_scanner_image",
          image: base64,
          mimeType: file.type
        })
      });

      if (!gasResponse.ok) throw new Error('Error de red al contactar Google Apps Script');
      
      const responseText = await gasResponse.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Apps Script devolvió algo inesperado: ' + responseText);
      }

      if (data.error) throw new Error(data.error);
      
      onScanComplete(data.data || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="glass-card scanner-card">
      <h2 style={{color: '#38bdf8'}}>📷 Comprobante Recibido</h2>
      
      {preview && (
        <div style={{ margin: '20px 0', textAlign: 'center' }}>
          <img src={preview} alt="Comprobante" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }} />
        </div>
      )}

      {error && <div style={{ color: '#f87171', marginBottom: '15px' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={handleScan} 
          disabled={isScanning}
          style={{ flex: 1, padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}
        >
          {isScanning ? 'Analizando con IA...' : 'Extraer y Guardar'}
        </button>
        <button 
          onClick={onCancel} 
          disabled={isScanning}
          style={{ padding: '12px', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}
