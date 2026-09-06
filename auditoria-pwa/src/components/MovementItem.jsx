import React from 'react';
import { CreditCard, Building, Smartphone, FileText, Wallet } from 'lucide-react';

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

export default function MovementItem({ mov, onCategoryClick, onMovementClick, apodos = [] }) {
  // Parsing and extraction
  const isIncome = mov.categoria === 'Ingreso' || mov.tipo === 'Ingreso' || (mov.monto && mov.monto > 0 && mov.concepto && mov.concepto.toLowerCase().startsWith('ingreso'));
  let amountColor = isIncome ? 'var(--positive)' : 'var(--negative)';
  if (mov.categoria === 'Sin clasificar' || !mov.categoria) amountColor = 'var(--warning)';

  const bgStyle = { backgroundColor: BANK_COLORS[mov.metodo] || 'rgba(255,255,255,0.1)' };
  
  const IconComponent = BANK_ICONS[mov.metodo] || FileText;
  const imageSrc = BANK_IMAGES[mov.metodo];

  // Enhance concepts
  let title = mov.concepto || 'Desconocido';
  let subtitle = mov.categoria || mov.origen || '';
  let rawName = title;
  
  if (title.startsWith('Transf: ')) {
    rawName = title.replace('Transf: ', '');
    title = 'Transferencia Enviada';
  } else if (title.startsWith('Ingreso de: ')) {
    rawName = title.replace('Ingreso de: ', '');
    title = 'Transferencia Recibida';
  }

  // Map Alias (Apodo)
  const apodoMatch = apodos.find(a => a.nombreOriginal.toLowerCase() === rawName.toLowerCase());
  if (apodoMatch) {
    rawName = apodoMatch.apodo;
  }

  if (title === 'Transferencia Enviada') subtitle = `Dest: ${rawName}`;
  else if (title === 'Transferencia Recibida') subtitle = `De: ${rawName}`;

  return (
    <div className="movement-item" onClick={() => onMovementClick && onMovementClick(mov)}>
      <div className="movement-icon" style={imageSrc ? { backgroundColor: 'transparent' } : bgStyle}>
        {imageSrc ? (
          <img src={imageSrc} alt={mov.metodo} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px' }} />
        ) : (
          <IconComponent size={20} color="#fff" />
        )}
      </div>
      <div className="movement-details">
        <div className="movement-title">{title}</div>
        <div className="movement-subtitle" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {subtitle && (
            <span 
              onClick={(e) => {
                if (onCategoryClick) {
                  e.stopPropagation();
                  onCategoryClick(mov);
                }
              }}
              style={{ cursor: onCategoryClick ? 'pointer' : 'default', textDecoration: onCategoryClick ? 'underline' : 'none', opacity: 0.8 }}
            >
              • {subtitle}
            </span>
          )}
        </div>
      </div>
      <div className="movement-right">
        <div className="movement-amount" style={{ color: amountColor }}>
          {isIncome ? '+' : '-'}{formatearDinero(Math.abs(mov.monto))}
        </div>
        <div className="movement-date">{mov.fechaDisplay || ''}</div>
      </div>
    </div>
  );
}
