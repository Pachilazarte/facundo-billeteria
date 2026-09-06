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
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: '#050505', zIndex: 1000, overflowY: 'auto',
      display: 'flex', flexDirection: 'column', padding: '20px'
    }}>
      <h2 style={{ textAlign: 'center', margin: '20px 0', fontSize: '1.5rem', color: 'var(--positive)' }}>Nuevo Comprobante</h2>
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '24px' }}>
        Verificá que la imagen sea legible antes de enviarla a la inteligencia artificial.
      </p>
      
      {preview && (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '24px' }}>
          <img 
            src={preview} 
            alt="Comprobante" 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '50vh', 
              borderRadius: '20px',
              border: '2px solid rgba(52, 211, 153, 0.3)',
              boxShadow: '0 10px 30px rgba(52, 211, 153, 0.1)'
            }} 
          />
        </div>
      )}

      {error && (
        <div style={{ color: 'var(--negative)', marginBottom: '20px', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', borderLeft: '4px solid var(--negative)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: 'auto', paddingBottom: '20px' }}>
        <button 
          onClick={onCancel}
          disabled={isScanning}
          style={{
            flex: 1,
            padding: '16px',
            background: 'rgba(255,255,255,0.05)',
            border: 'none',
            color: 'var(--text-main)',
            borderRadius: '16px',
            fontSize: '1rem',
            fontWeight: 600
          }}
        >
          Cancelar
        </button>
        
        <button 
          onClick={handleScan}
          disabled={isScanning}
          style={{
            flex: 2,
            padding: '16px',
            background: 'var(--positive)',
            border: 'none',
            color: '#000',
            borderRadius: '16px',
            fontSize: '1rem',
            fontWeight: 700,
            opacity: isScanning ? 0.7 : 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {isScanning ? (
            <>
              <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '3px', borderColor: '#000', borderTopColor: 'transparent' }}></div>
              Analizando...
            </>
          ) : 'Procesar Gasto'}
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
