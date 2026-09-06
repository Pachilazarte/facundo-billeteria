import React from 'react';
import MovementItem from './MovementItem';

export default function Pendientes({ pendientes = [], onMovementClick, apodos = [] }) {
  if (pendientes.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px', marginTop: '20px' }}>
        <h2 style={{ color: 'var(--positive)' }}>¡Todo al día!</h2>
        <p style={{ color: 'var(--text-muted)' }}>No hay comprobantes pendientes de clasificar.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="glass-card" style={{ marginTop: '20px' }}>
        <h2>Bandeja de Entrada ({pendientes.length})</h2>
        <p style={{ color: 'var(--warning)', fontSize: '0.85rem', marginBottom: '16px' }}>
          Estos gastos fueron guardados para revisar más tarde.
        </p>

        <div className="movement-list">
          {pendientes.map((mov, idx) => (
            <MovementItem 
              key={idx} 
              mov={mov} 
              onMovementClick={onMovementClick}
              apodos={apodos}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
