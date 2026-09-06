import React, { useState } from 'react';
import { X, Building, CreditCard, Smartphone, Wallet, FileText } from 'lucide-react';

const BANK_COLORS = {
  'BNA': 'var(--bank-bna)',
  'Naranja': 'var(--bank-naranja)',
  'Naranja X': 'var(--bank-naranja)',
  'Personal Pay': 'var(--bank-personal)',
  'BIND': 'var(--bank-bind)',
  'Efectivo': 'var(--bank-efectivo)'
};

const BANK_ICONS = {
  'BNA': Building,
  'Naranja': CreditCard,
  'Naranja X': CreditCard,
  'Personal Pay': Smartphone,
  'BIND': Building,
  'Efectivo': Wallet
};

const BANK_IMAGES = {
  'BNA': '/img/LOGOBNA.webp',
  'Naranja': '/img/NaranjaX-logo.svg.webp',
  'Naranja X': '/img/NaranjaX-logo.svg.webp',
  'Personal Pay': '/img/personalpay.webp',
  'BIND': '/img/logoactualizado-bi.webp'
};

function formatearDinero(monto) {
  const decimals = (monto % 1 !== 0) ? 2 : 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS',
    minimumFractionDigits: decimals,
    maximumFractionDigits: 2
  }).format(monto);
}

export default function MovementDetail({ mov, onClose, onSaveApodo, onUpdateCategory, apodos = [] }) {
  const isIncome = mov.categoria === 'Ingreso' || mov.tipo === 'Ingreso' || (mov.monto && mov.monto > 0 && mov.concepto && mov.concepto.toLowerCase().startsWith('ingreso'));
  const amountColor = isIncome ? 'var(--positive)' : 'var(--negative)';
  const bgStyle = { backgroundColor: BANK_COLORS[mov.metodo] || 'rgba(255,255,255,0.1)' };
  
  const IconComponent = BANK_ICONS[mov.metodo] || FileText;
  const imageSrc = BANK_IMAGES[mov.metodo];

  let title = mov.concepto || 'Desconocido';
  let rawName = title;
  
  if (title.startsWith('Transf: ')) {
    rawName = title.replace('Transf: ', '');
    title = 'Transferencia Enviada';
  } else if (title.startsWith('Ingreso de: ')) {
    rawName = title.replace('Ingreso de: ', '');
    title = 'Transferencia Recibida';
  }

  // Buscar apodo si existe (por seguridad, aunque el padre debería pasarlo ya procesado, lo buscamos acá para el input inicial)
  const apodoData = apodos.find(a => a.nombreOriginal.toLowerCase() === rawName.toLowerCase());
  const [apodo, setApodo] = useState(apodoData ? apodoData.apodo : '');

  const handleSaveApodo = () => {
    if (apodo.trim() === '') return;
    onSaveApodo(rawName, apodo.trim());
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: '#000', zIndex: 1000, overflowY: 'auto',
      display: 'flex', flexDirection: 'column'
    }}>
      {/* Header Modal */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px', borderBottom: `2px solid ${amountColor}`,
        backgroundColor: '#0a0a0a'
      }}>
        <h2 style={{ fontSize: '1.2rem', margin: 0, color: amountColor }}>
          {isIncome ? 'Detalle de Ingreso' : 'Detalle de Egreso'}
        </h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff' }}>
          <X size={28} />
        </button>
      </div>

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Banner principal */}
        <div className="glass-card" style={{
          textAlign: 'center', padding: '30px 20px',
          borderColor: amountColor, background: `linear-gradient(180deg, rgba(20,20,20,0.8) 0%, rgba(10,10,10,1) 100%)`
        }}>
          <div style={{ 
            width: '100px', height: '100px', borderRadius: '20px', margin: '0 auto 16px auto',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            backgroundColor: imageSrc ? 'transparent' : bgStyle.backgroundColor
          }}>
            {imageSrc ? (
              <img src={imageSrc} alt={mov.metodo} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '20px' }} />
            ) : (
              <IconComponent size={40} color="#fff" />
            )}
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: amountColor, lineHeight: 1.2 }}>
            {isIncome ? '+' : '-'}{formatearDinero(Math.abs(mov.monto))}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '8px' }}>
            {title}
          </div>
        </div>

        {/* Info */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--text-muted)' }}>Información de la Operación</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Fecha</span>
            <span style={{ fontWeight: 500 }}>{mov.fechaDisplay}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Método / Banco</span>
            <span style={{ fontWeight: 500, color: bgStyle.backgroundColor }}>{mov.metodo}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Categoría</span>
            <span 
              style={{ fontWeight: 500, cursor: 'pointer', textDecoration: 'underline' }} 
              className="badge"
              onClick={() => {
                const cat = window.prompt("Elegí una categoría (ej: Supermercado, Transporte, Ingreso):", mov.categoria || "");
                if (cat && cat !== mov.categoria) {
                  if (onUpdateCategory) {
                    onUpdateCategory(mov.id, cat);
                    // Actualizamos optimísticamente el local del modal
                    mov.categoria = cat;
                  }
                }
              }}
            >
              {mov.categoria || 'Sin clasificar'} ✎
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Destino / Origen</span>
            <span style={{ fontWeight: 500, textAlign: 'right' }}>{rawName}</span>
          </div>
        </div>

        {/* Toggle Ingreso */}
        {!isIncome && (
          <button 
            onClick={() => {
              if (onUpdateCategory) {
                onUpdateCategory(mov.id, 'Ingreso');
                onClose();
              }
            }}
            style={{
              width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(52, 211, 153, 0.1)',
              border: '1px solid var(--positive)', color: 'var(--positive)', fontWeight: 600, cursor: 'pointer'
            }}
          >
            Marcar como Ingreso
          </button>
        )}

        {/* Apodos */}
        {(title === 'Transferencia Enviada' || title === 'Transferencia Recibida') && (
          <div className="glass-card" style={{ borderColor: 'var(--bank-bna)', background: 'rgba(59, 130, 246, 0.05)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '8px', color: 'var(--bank-bna)' }}>Alias / Apodo</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Ponle un apodo a <strong>{rawName}</strong> para identificarlo más fácil la próxima vez (ej: "Kiosco de la esquina").
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Escribí un apodo..." 
                value={apodo} 
                onChange={e => setApodo(e.target.value)}
                style={{
                  flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '1rem'
                }}
              />
              <button 
                onClick={handleSaveApodo}
                style={{
                  background: 'var(--bank-bna)', color: '#fff', border: 'none', borderRadius: '8px',
                  padding: '0 16px', fontWeight: 600
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
