import React from 'react';
import { Gift, Wallet } from 'lucide-react';

function formatearDinero(monto) {
  const decimals = (monto % 1 !== 0) ? 2 : 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS',
    minimumFractionDigits: decimals,
    maximumFractionDigits: 2
  }).format(monto);
}

export default function Sueldos({ sueldos = [], bonos = [] }) {
  if (sueldos.length === 0 && bonos.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px', marginTop: '20px' }}>
        <h2 style={{ color: 'var(--positive)' }}>Módulo Sueldos y Bonos</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Subí una liquidación semanal o bono para llevar el control.</p>
        <label htmlFor="manual-scan" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'var(--positive)',
          color: '#000', borderRadius: '24px', fontWeight: 600, cursor: 'pointer'
        }}>
          <Wallet size={18} /> Cargar Planilla
        </label>
      </div>
    );
  }

  return (
    <div>
      <div className="glass-card" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Liquidaciones y Bonos</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            Control de sueldos esperados y pagos extra.
          </p>
        </div>
        <label htmlFor="manual-scan" style={{
          padding: '8px 16px', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid var(--positive)',
          color: 'var(--positive)', borderRadius: '16px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
          display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <Wallet size={14} /> + Cargar
        </label>
      </div>

      <div className="glass-card" style={{ marginTop: '16px', padding: 0, background: 'transparent', border: 'none', boxShadow: 'none' }}>
        
        {/* SUELDOS */}
        {sueldos.length > 0 && <h3 style={{ marginBottom: '12px', color: 'var(--text-main)', fontSize: '1rem' }}>Semanas</h3>}
        {sueldos.map((s, idx) => (
          <div key={`sueldo-${idx}`} className="movement-item" style={{ borderLeft: s.diferencia > 0 ? '3px solid var(--negative)' : '3px solid var(--positive)' }}>
            <div className="movement-details">
              <div className="movement-title">Semana del {new Date(s.fecha).toLocaleDateString()}</div>
              <div className="movement-subtitle">
                Esperado: {formatearDinero(s.monto_esperado)} | Cobrado: {formatearDinero(s.monto_cobrado)}
              </div>
            </div>
            <div className="movement-right">
              <div className="movement-amount" style={{ color: s.diferencia > 0 ? 'var(--negative)' : 'var(--positive)' }}>
                {s.diferencia > 0 ? `Deben: ${formatearDinero(s.diferencia)}` : 'Pagado'}
              </div>
            </div>
          </div>
        ))}

        {/* BONOS */}
        {bonos.length > 0 && <h3 style={{ marginTop: '24px', marginBottom: '12px', color: 'var(--text-main)', fontSize: '1rem' }}>Ingresos Extra / Bonos</h3>}
        {bonos.map((b, idx) => (
          <div key={`bono-${idx}`} className="movement-item" style={{ borderLeft: '3px solid var(--positive)' }}>
            <div className="movement-icon" style={{ backgroundColor: 'rgba(52, 211, 153, 0.1)', color: 'var(--positive)' }}>
              <Gift size={20} />
            </div>
            <div className="movement-details">
              <div className="movement-title">{b.concepto || 'Bono'}</div>
              <div className="movement-subtitle">
                {new Date(b.fecha).toLocaleDateString()} | Estado: {b.estado || 'Recibido'}
              </div>
            </div>
            <div className="movement-right">
              <div className="movement-amount" style={{ color: 'var(--positive)' }}>
                +{formatearDinero(b.monto)}
              </div>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
