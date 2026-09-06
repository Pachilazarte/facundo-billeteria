import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { APPS_SCRIPT_URL } from '../config';

ChartJS.register(ArcElement, Tooltip, Legend);

const BANK_COLORS = {
  'BNA': 'var(--bank-bna)',
  'Personal Pay': 'var(--bank-personal)',
  'Naranja': 'var(--bank-naranja)',
  'BIND': 'var(--bank-bind)',
  'Efectivo': 'var(--bank-efectivo)',
  'Desconocido': '#94a3b8'
};

const BANK_INITIALS = {
  'BNA': 'BN',
  'Personal Pay': 'PP',
  'Naranja': 'NX',
  'BIND': 'BD',
  'Efectivo': '💵',
  'Desconocido': '?'
};

function formatearDinero(monto) {
  const decimals = (monto % 1 !== 0) ? 2 : 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS',
    minimumFractionDigits: decimals,
    maximumFractionDigits: 2
  }).format(monto);
}

export default function Dashboard({ allData = [], efectivoData = [], saldoEfectivo = 0 }) {
  const [filters, setFilters] = useState({
    mes: 'ALL', dia: 'ALL', metodo: 'ALL', categoria: 'ALL'
  });

  const [filterOptions, setFilterOptions] = useState({
    meses: [], dias: [], metodos: [], categorias: []
  });

  useEffect(() => {
    if (allData.length > 0) {
      populateOptions(allData);
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

  // --- MAIN DASHBOARD ---
  const filtered = allData.filter(item => {
    return (filters.mes === 'ALL' || item.mesIso === filters.mes) &&
           (filters.dia === 'ALL' || item.fechaDisplay.startsWith(filters.dia)) &&
           (filters.metodo === 'ALL' || item.metodo === filters.metodo) &&
           (filters.categoria === 'ALL' || item.categoria === filters.categoria);
  });

  let total = 0;
  const porBanco = {};
  const pedidosList = [];
  const movimientosList = [];

  filtered.forEach(item => {
    if (item.concepto.toLowerCase().includes("pedido de pago")) {
      pedidosList.push(item);
      return;
    }
    const isIngreso = item.concepto.toLowerCase().includes("ingreso de");
    const monto = item.monto;
    total += isIngreso ? monto : -monto;
    if (!isIngreso) porBanco[item.metodo] = (porBanco[item.metodo] || 0) + monto;
    movimientosList.push(item);
  });

  const chartData = {
    labels: Object.keys(porBanco),
    datasets: [{
      data: Object.values(porBanco),
      backgroundColor: Object.keys(porBanco).map(k => {
        // Obtenemos el color crudo de la variable CSS para chartjs
        if(k === 'BNA') return '#3b82f6';
        if(k === 'Personal Pay') return '#0ea5e9';
        if(k === 'Naranja') return '#f97316';
        if(k === 'BIND') return '#eab308';
        if(k === 'Efectivo') return '#22c55e';
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
        labels: { color: '#f8fafc', font: { family: 'Inter', size: 13 } }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 14, family: 'Inter' },
        bodyFont: { size: 14, family: 'Inter' }
      }
    }
  };

  return (
    <div>
      <header>
        <h1>Auditoría</h1>
      </header>

      {/* FILTROS Y TOTAL */}
      <div className="glass-card">
        <div className="filters-row">
          <select value={filters.mes} onChange={e => setFilters({...filters, mes: e.target.value})} className="filter-select">
            <option value="ALL">Meses</option>
            {filterOptions.meses.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={filters.dia} onChange={e => setFilters({...filters, dia: e.target.value})} className="filter-select">
            <option value="ALL">Días</option>
            {filterOptions.dias.map(d => <option key={d} value={d}>{d}</option>)}
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
        <div className="total-label">Gasto Total (Filtros)</div>
        <div className="total-amount" style={{color: total >= 0 ? 'var(--text-main)' : 'var(--negative)'}}>
          {formatearDinero(Math.abs(total))}
        </div>
      </div>

      {/* EFECTIVO DISPONIBLE */}
      <div className="glass-card" style={{ borderColor: 'var(--bank-efectivo)' }}>
        <h2 style={{ color: 'var(--bank-efectivo)', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '1.5rem', marginRight: '8px' }}>💵</span> Efectivo Físico
        </h2>
        <div className="total-amount" style={{ color: 'var(--text-main)' }}>
          {formatearDinero(saldoEfectivo)}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
          Calculado en base a extracciones y transferencias propias.
        </p>
      </div>
      
      {/* GRAFICO */}
      {Object.keys(porBanco).length > 0 && (
        <div className="glass-card" style={{height: '280px'}}>
          <h2>Distribución</h2>
          <Doughnut data={chartData} options={chartOptions} />
        </div>
      )}

      {/* PEDIDOS */}
      {pedidosList.length > 0 && (
        <div className="glass-card" style={{borderColor: 'rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.05)'}}>
          <h2 style={{color: 'var(--warning)'}}>Próximos Vencimientos</h2>
          <div className="movement-list">
            {pedidosList.map((mov, idx) => (
              <div key={idx} className="movement-item">
                <div className="movement-icon" style={{background: 'var(--warning)', color: '#000'}}>⚠️</div>
                <div className="movement-details">
                  <div className="movement-title">{mov.concepto}</div>
                  <div className="movement-subtitle">{mov.categoria} • {mov.metodo}</div>
                </div>
                <div className="movement-right">
                  <div className="movement-amount" style={{color: 'var(--warning)'}}>
                    {formatearDinero(mov.monto)}
                  </div>
                  <div className="movement-date">{mov.fechaDisplay}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HISTORIAL */}
      <div className="glass-card">
        <h2>Historial de Movimientos</h2>
        <div className="movement-list">
          {movimientosList.length === 0 && <div className="total-label" style={{marginTop: '16px'}}>No hay movimientos.</div>}
          {movimientosList.map((mov, idx) => {
            const isIngreso = mov.concepto.toLowerCase().includes("ingreso");
            const bankColor = BANK_COLORS[mov.metodo] || BANK_COLORS['Desconocido'];
            const initials = BANK_INITIALS[mov.metodo] || BANK_INITIALS['Desconocido'];

            return (
              <div key={idx} className="movement-item">
                <div className="movement-icon" style={{background: bankColor}}>
                  {initials}
                </div>
                <div className="movement-details">
                  <div className="movement-title">{mov.concepto}</div>
                  <div className="movement-subtitle">
                    <span className="badge">{mov.categoria}</span>
                    {mov.metodo}
                  </div>
                </div>
                <div className="movement-right">
                  <div className="movement-amount" style={{color: isIngreso ? 'var(--positive)' : 'var(--text-main)'}}>
                    {isIngreso ? '+' : '-'}{formatearDinero(mov.monto)}
                  </div>
                  <div className="movement-date">{mov.fechaDisplay}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
