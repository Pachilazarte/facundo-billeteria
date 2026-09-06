import React from 'react';

function formatearDinero(monto) {
  const decimals = (monto % 1 !== 0) ? 2 : 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS',
    minimumFractionDigits: decimals,
    maximumFractionDigits: 2
  }).format(monto);
}

export default function Pendientes({ pendientes = [] }) {
  if (pendientes.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <h2 style={{ color: 'var(--positive)' }}>¡Todo al día!</h2>
        <p style={{ color: 'var(--text-muted)' }}>No hay comprobantes pendientes de clasificar.</p>
      </div>
    );
  }

  return (
    <div>
      <header>
        <h1>Pendientes</h1>
      </header>

      <div className="glass-card">
        <h2>Bandeja de Entrada ({pendientes.length})</h2>
        <p style={{ color: 'var(--warning)', fontSize: '0.85rem', marginBottom: '16px' }}>
          Estos gastos fueron guardados para revisar más tarde.
        </p>

        <div className="movement-list">
          {pendientes.map((mov, idx) => (
            <div key={idx} className="movement-item" style={{ borderLeft: '3px solid var(--warning)' }}>
              <div className="movement-details">
                <div className="movement-title">{mov.concepto}</div>
                <div className="movement-subtitle">Sugerencia: {mov.categoria_propuesta}</div>
              </div>
              <div className="movement-right">
                <div className="movement-amount" style={{ color: 'var(--warning)' }}>
                  {formatearDinero(mov.monto)}
                </div>
                <div style={{ marginTop: '8px' }}>
                  <button style={{
                    background: 'var(--positive)', border: 'none', borderRadius: '4px', padding: '4px 8px', color: '#fff', fontSize: '0.75rem', marginRight: '4px'
                  }}>Aprobar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
