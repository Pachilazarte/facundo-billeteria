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
    <div className="glass-card" style={{ textAlign: 'center', marginTop: '20px' }}>
      <h2 style={{ marginBottom: '16px' }}>Analizar Comprobante</h2>
      
      {preview && (
        <div style={{ marginBottom: '24px' }}>
          <img 
            src={preview} 
            alt="Comprobante" 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '300px', 
              borderRadius: '16px',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--glass-shadow)'
            }} 
          />
        </div>
      )}

      {error && (
        <div style={{ color: 'var(--negative)', marginBottom: '20px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button 
          onClick={onCancel}
          disabled={isScanning}
          style={{
            padding: '12px 24px',
            background: 'transparent',
            border: '1px solid var(--text-muted)',
            color: 'var(--text-main)',
            borderRadius: '24px',
            cursor: 'pointer',
            fontFamily: 'var(--font-family)',
            fontWeight: 500
          }}
        >
          Cancelar
        </button>
        
        <button 
          onClick={handleScan}
          disabled={isScanning}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, #d946ef 100%)',
            border: 'none',
            color: 'white',
            borderRadius: '24px',
            cursor: isScanning ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontFamily: 'var(--font-family)',
            boxShadow: '0 4px 15px var(--accent-glow)',
            opacity: isScanning ? 0.7 : 1,
            transition: 'transform 0.2s ease'
          }}
        >
          {isScanning ? 'Analizando con IA...' : 'Analizar y Guardar'}
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
