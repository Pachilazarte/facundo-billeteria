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
  "Ingreso"
];

function formatearDinero(monto) {
  const decimals = (monto % 1 !== 0) ? 2 : 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS',
    minimumFractionDigits: decimals,
    maximumFractionDigits: 2
  }).format(monto);
}

export default function Dashboard({ allData = [], efectivoData = [], saldoEfectivo = 0, onUpdateCategory }) {
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

  const handleCategoryClick = (mov) => {
    if (!onUpdateCategory) return;
    const cat = window.prompt("Elegí una categoría o escribí una nueva:\n" + PREDEFINED_CATEGORIES.join(", "), mov.categoria || "");
    if (cat && cat !== mov.categoria) {
      onUpdateCategory(mov.id, cat);
    }
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
    if (item.concepto.toLowerCase().includes("pedido de pago") || item.concepto.toLowerCase().includes("próxima cuota")) {
      pedidosList.push(item);
      return;
    }
    const isIngreso = item.concepto.toLowerCase().includes("ingreso") || item.monto > 0 && item.concepto.toLowerCase().startsWith('ingreso');
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
      {/* FILTROS Y TOTAL */}
      <div className="glass-card" style={{ padding: '24px 20px', background: 'linear-gradient(145deg, rgba(30,41,59,0.4) 0%, rgba(15,23,42,0.8) 100%)' }}>
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
        <div className="total-label">Gasto Acumulado</div>
        <div className="total-amount" style={{color: total >= 0 ? 'var(--text-main)' : 'var(--negative)'}}>
          {formatearDinero(Math.abs(total))}
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
      
      {/* GRAFICO */}
      {Object.keys(porBanco).length > 0 && (
        <div className="glass-card" style={{height: '240px'}}>
          <h2 style={{fontSize: '1rem'}}>Distribución</h2>
          <div style={{ height: '180px' }}>
            <Doughnut data={chartData} options={chartOptions} />
          </div>
        </div>
      )}

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
            <MovementItem key={idx} mov={mov} onCategoryClick={handleCategoryClick} />
          ))}
        </div>
      </div>

    </div>
  );
}
