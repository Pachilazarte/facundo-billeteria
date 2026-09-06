import React from 'react';

function formatearDinero(monto) {
  const decimals = (monto % 1 !== 0) ? 2 : 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS',
    minimumFractionDigits: decimals,
    maximumFractionDigits: 2
  }).format(monto);
}

export default function Sueldos({ sueldos = [] }) {
  if (sueldos.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px', marginTop: '20px' }}>
        <h2 style={{ color: 'var(--positive)' }}>Módulo Sueldos</h2>
        <p style={{ color: 'var(--text-muted)' }}>Subí una liquidación semanal para llevar el control.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="glass-card" style={{ marginTop: '20px' }}>
        <h2>Liquidaciones Semanales</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
          Control de sueldos esperados vs cobrados.
        </p>

        <div className="movement-list">
          {sueldos.map((s, idx) => (
            <div key={idx} className="movement-item" style={{ borderLeft: s.diferencia > 0 ? '3px solid var(--negative)' : '3px solid var(--positive)' }}>
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
        </div>
      </div>
    </div>
  );
}
