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

function formatearDinero(monto) {
  const decimals = (monto % 1 !== 0) ? 2 : 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS',
    minimumFractionDigits: decimals,
    maximumFractionDigits: 2
  }).format(monto);
}

export default function MovementItem({ mov, onCategoryClick }) {
  // Parsing and extraction
  const isIncome = mov.tipo === 'Ingreso' || (mov.monto && mov.monto > 0 && mov.concepto && mov.concepto.toLowerCase().startsWith('ingreso'));
  const amountColor = isIncome ? 'var(--positive)' : 'var(--text-main)';
  const bgStyle = { backgroundColor: BANK_COLORS[mov.metodo] || 'rgba(255,255,255,0.1)' };
  
  const IconComponent = BANK_ICONS[mov.metodo] || FileText;

  // Enhance concepts
  let title = mov.concepto || 'Desconocido';
  let subtitle = mov.categoria || mov.origen || '';
  
  if (title.startsWith('Transf: ')) {
    subtitle = `Dest: ${title.replace('Transf: ', '')}`;
    title = 'Transferencia Enviada';
  } else if (title.startsWith('Ingreso de: ')) {
    subtitle = `De: ${title.replace('Ingreso de: ', '')}`;
    title = 'Transferencia Recibida';
  }

  return (
    <div className="movement-item">
      <div className="movement-icon" style={bgStyle}>
        <IconComponent size={20} color="#fff" />
      </div>
      <div className="movement-details">
        <div className="movement-title">{title}</div>
        <div className="movement-subtitle" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {mov.metodo && <span style={{ color: bgStyle.backgroundColor, fontWeight: 600 }}>{mov.metodo}</span>}
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
