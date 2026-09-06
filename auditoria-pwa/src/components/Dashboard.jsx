import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import MovementItem from './MovementItem';
import { Wallet } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const PREDEFINED_CATEGORIES = [
  "Supermercado",
  "Suscripciones",
  "Transporte",
  "Comida / Delivery",
  "Kiosco / Farmacia",
  "Varios",
  "Ingreso",
  "Ignorar"
];

function formatearDinero(monto) {
  const decimals = (monto % 1 !== 0) ? 2 : 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS',
    minimumFractionDigits: decimals,
    maximumFractionDigits: 2
  }).format(monto);
}

export default function Dashboard({ allData = [], efectivoData = [], saldoEfectivo = 0, onUpdateCategory, onMovementClick, apodos = [] }) {
  // Default to current month ISO (YYYY-MM)
  const currentMonthIso = new Date().toISOString().substring(0, 7);

  const [filters, setFilters] = useState({
    mes: 'ALL', dia: 'ALL', metodo: 'ALL', categoria: 'ALL', search: ''
  });

  const [filterOptions, setFilterOptions] = useState({
    meses: [], dias: [], metodos: [], categorias: []
  });

  useEffect(() => {
    if (allData.length > 0) {
      populateOptions(allData);
      
      // Auto-select current month if it exists in data
      const m = new Set(allData.map(i => i.mesIso));
      if (m.has(currentMonthIso)) {
        setFilters(f => ({ ...f, mes: currentMonthIso }));
      }
    }
  }, [allData]);

  const populateOptions = (data) => {
    const m = new Set(), d = new Set(), mt = new Set(), c = new Set();
    data.forEach(i => {
      if(i.mesIso) m.add(i.mesIso);
      if(i.fechaDisplay) d.add(i.fechaDisplay.split(' ')[0]);
      if(i.metodo) mt.add(i.metodo);
      if(i.categoria) c.add(i.categoria);
    });
    setFilterOptions({
      meses: Array.from(m).sort().reverse(),
      dias: Array.from(d).sort().reverse(),
      metodos: Array.from(mt).sort(),
      categorias: Array.from(c).sort()
    });
  };

  const handleCategoryClick = (mov) => {
    if (!onUpdateCategory) return;
    const cat = window.prompt("Elegí una categoría o escribí una nueva:\n" + PREDEFINED_CATEGORIES.join(", "), mov.categoria || "");
    if (cat && cat !== mov.categoria) {
      onUpdateCategory(mov.id, cat);
    }
  };

  // --- CÁLCULO DE SALDO ACUMULADO (TODO EL HISTORIAL) ---
  let saldoDigitalAcumulado = 0;
  allData.forEach(item => {
    if (item.categoria === 'Ignorar' || item.categoria === 'Traspaso') return;
    const isIngreso = item.categoria === 'Ingreso' || item.tipo === 'Ingreso' || (item.monto > 0 && item.concepto && item.concepto.toLowerCase().startsWith('ingreso'));
    if (isIngreso) saldoDigitalAcumulado += item.monto;
    else saldoDigitalAcumulado -= item.monto;
  });

  // --- MAIN DASHBOARD (FILTRADO) ---
  const filtered = allData.filter(item => {
    // Buscar apodo si existe para que aplique en la búsqueda
    let rawName = item.concepto || '';
    if (rawName.startsWith('Transf: ')) rawName = rawName.replace('Transf: ', '');
    else if (rawName.startsWith('Ingreso de: ')) rawName = rawName.replace('Ingreso de: ', '');
    
    const apodoMatch = apodos.find(a => a.nombreOriginal.toLowerCase() === rawName.toLowerCase());
    const aliasText = apodoMatch ? apodoMatch.apodo.toLowerCase() : '';
    
    const searchMatch = filters.search === '' || 
                        (item.concepto || '').toLowerCase().includes(filters.search.toLowerCase()) || 
                        aliasText.includes(filters.search.toLowerCase());

    return searchMatch &&
           (filters.mes === 'ALL' || item.mesIso === filters.mes) &&
           (filters.dia === 'ALL' || item.fechaDisplay.startsWith(filters.dia)) &&
           (filters.metodo === 'ALL' || item.metodo === filters.metodo) &&
           (filters.categoria === 'ALL' || item.categoria === filters.categoria);
  });

  let totalIngresos = 0;
  let totalEgresos = 0;
  const porBanco = {};
  const pedidosList = [];
  const movimientosList = [];

  filtered.forEach(item => {
    if (item.concepto && (item.concepto.toLowerCase().includes("pedido de pago") || item.concepto.toLowerCase().includes("próxima cuota"))) {
      pedidosList.push(item);
      return;
    }
    
    movimientosList.push(item);
    
    if (item.categoria === 'Ignorar' || item.categoria === 'Traspaso') return;

    const isIngreso = item.categoria === 'Ingreso' || item.tipo === 'Ingreso' || (item.monto > 0 && item.concepto && item.concepto.toLowerCase().startsWith('ingreso'));
    const monto = item.monto;
    
    if (isIngreso) {
      totalIngresos += monto;
    } else {
      totalEgresos += monto;
      let bk = item.metodo;
      if (bk === 'Naranja') bk = 'Naranja X'; // Unify Naranja in chart
      porBanco[bk] = (porBanco[bk] || 0) + monto;
    }
  });

  const chartData = {
    labels: Object.keys(porBanco),
    datasets: [{
      data: Object.values(porBanco),
      backgroundColor: Object.keys(porBanco).map(k => {
        if(k === 'BNA') return '#3b82f6';
        if(k === 'Personal Pay') return '#0ea5e9';
        if(k === 'Naranja' || k === 'Naranja X') return '#f97316';
        if(k === 'BIND') return '#eab308';
        if(k === 'Efectivo') return '#34d399';
        return '#94a3b8';
      }),
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const chartOptions = {
    maintainAspectRatio: false, 
    cutout: '75%', 
    plugins: {
      legend: {
        position: 'right', 
        labels: { color: '#f8fafc', font: { family: 'Inter', size: 12 } }
      },
      tooltip: {
        backgroundColor: 'rgba(10, 10, 10, 0.95)',
        padding: 12,
        cornerRadius: 12,
        titleFont: { size: 13, family: 'Inter' },
        bodyFont: { size: 13, family: 'Inter' },
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1
      }
    }
  };

  return (
    <div>
      {/* SALDO ACUMULADO */}
      <div className="glass-card" style={{ borderColor: 'var(--bank-bna)', background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(15,23,42,0.8) 100%)', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Saldo Digital Acumulado
        </h2>
        <div style={{ color: saldoDigitalAcumulado >= 0 ? 'var(--text-main)' : 'var(--negative)', fontSize: '2.2rem', fontWeight: 800 }}>
          {formatearDinero(saldoDigitalAcumulado)}
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Balance total de tus bancos y billeteras virtuales a la fecha.</p>
      </div>

      {/* FILTROS Y GASTOS DEL MES */}
      <div className="glass-card" style={{ padding: '24px 20px', background: 'linear-gradient(145deg, rgba(30,41,59,0.4) 0%, rgba(15,23,42,0.8) 100%)' }}>
        
        <div style={{ marginBottom: '16px' }}>
          <input 
            type="text" 
            placeholder="Buscar por nombre, apodo, concepto..." 
            value={filters.search}
            onChange={e => setFilters({...filters, search: e.target.value})}
            style={{
              width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.95rem', boxSizing: 'border-box'
            }}
          />
        </div>

        <div className="filters-row">
          <select value={filters.mes} onChange={e => setFilters({...filters, mes: e.target.value})} className="filter-select">
            <option value="ALL">Meses</option>
            {filterOptions.meses.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={filters.metodo} onChange={e => setFilters({...filters, metodo: e.target.value})} className="filter-select">
            <option value="ALL">Bancos</option>
            {filterOptions.metodos.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={filters.categoria} onChange={e => setFilters({...filters, categoria: e.target.value})} className="filter-select">
            <option value="ALL">Categorías</option>
            {filterOptions.categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <div className="total-label">Egresos del Periodo</div>
            <div className="total-amount" style={{color: 'var(--negative)', fontSize: '1.5rem'}}>
              {formatearDinero(Math.abs(totalEgresos))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <div className="total-label">Ingresos del Periodo</div>
            <div className="total-amount" style={{color: 'var(--positive)', fontSize: '1.5rem'}}>
              {formatearDinero(Math.abs(totalIngresos))}
            </div>
          </div>
        </div>
      </div>

      {/* EFECTIVO DISPONIBLE */}
      <div className="glass-card" style={{ borderColor: 'rgba(52, 211, 153, 0.3)', background: 'rgba(52, 211, 153, 0.05)' }}>
        <h2 style={{ color: 'var(--bank-efectivo)', display: 'flex', alignItems: 'center', fontSize: '1rem', marginBottom: '8px' }}>
          <Wallet size={18} style={{ marginRight: '8px' }} /> Efectivo Físico
        </h2>
        <div className="total-amount" style={{ color: 'var(--text-main)', fontSize: '1.8rem' }}>
          {formatearDinero(saldoEfectivo)}
        </div>
      </div>
      
      {/* ELIMINADO EL GRÁFICO A PETICIÓN */}

      {/* PEDIDOS */}
      {pedidosList.length > 0 && (
        <div className="glass-card" style={{borderColor: 'rgba(251, 191, 36, 0.4)', background: 'rgba(251, 191, 36, 0.05)'}}>
          <h2 style={{color: 'var(--warning)', fontSize: '1rem'}}>Próximos Vencimientos</h2>
          <div className="movement-list">
            {pedidosList.map((mov, idx) => (
              <MovementItem key={idx} mov={mov} />
            ))}
          </div>
        </div>
      )}

      {/* HISTORIAL */}
      <div className="glass-card" style={{ border: 'none', background: 'transparent', padding: '0', boxShadow: 'none' }}>
        <h2 style={{ paddingLeft: '4px' }}>Movimientos</h2>
        <div className="movement-list">
          {movimientosList.length === 0 && <div className="total-label" style={{marginTop: '16px'}}>No hay movimientos.</div>}
          {movimientosList.map((mov, idx) => (
            <MovementItem 
              key={idx} 
              mov={mov} 
              onCategoryClick={handleCategoryClick} 
              onMovementClick={onMovementClick}
              apodos={apodos}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
