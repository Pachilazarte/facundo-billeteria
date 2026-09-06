import React from 'react';
import { User, Tag, ArrowLeft } from 'lucide-react';

export default function Settings({ apodos = [], onBack }) {
  return (
    <div>
      <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-main)' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Configuración</h2>
      </div>

      <div className="glass-card" style={{ marginTop: '20px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--bank-bna)', marginBottom: '16px' }}>
          <User size={20} /> Apodos Guardados
        </h3>
        
        {apodos.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Aún no has guardado ningún apodo. Puedes agregarlos haciendo clic en un movimiento de transferencia.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {apodos.map((a, idx) => (
              <div key={idx} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px'
              }}>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>{a.apodo}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.nombreOriginal}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card" style={{ marginTop: '20px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--positive)', marginBottom: '16px' }}>
          <Tag size={20} /> Tipos de Ingresos
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '12px' }}>
          Categorías exclusivas para tus entradas de dinero:
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span className="badge" style={{ background: 'rgba(52, 211, 153, 0.2)', color: 'var(--positive)' }}>Sueldo</span>
          <span className="badge" style={{ background: 'rgba(52, 211, 153, 0.2)', color: 'var(--positive)' }}>Bono</span>
          <span className="badge" style={{ background: 'rgba(52, 211, 153, 0.2)', color: 'var(--positive)' }}>Dinero Extra</span>
        </div>
      </div>
    </div>
  );
}
