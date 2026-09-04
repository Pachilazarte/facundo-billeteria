import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const BANK_COLORS = {
  'BNA': '#3b82f6',
  'Personal Pay': '#7dd3fc',
  'Naranja': '#f97316',
  'BIND': '#eab308',
  'Efectivo': '#22c55e',
  'Desconocido': '#94a3b8'
};

function formatearDinero(monto) {
  const decimals = (monto % 1 !== 0) ? 2 : 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS',
    minimumFractionDigits: decimals,
    maximumFractionDigits: 2
  }).format(monto);
}

export default function Dashboard() {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    mes: 'ALL', dia: 'ALL', metodo: 'ALL', categoria: 'ALL'
  });

  const [filterOptions, setFilterOptions] = useState({
    meses: [], dias: [], metodos: [], categorias: []
  });

  useEffect(() => {
    const url = import.meta.env.VITE_APPS_SCRIPT_URL;
    fetch(url + "?action=getData")
      .then(res => res.json())
      .then(data => {
        setAllData(data.allData);
        populateOptions(data.allData);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

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

  if (loading) return <div className="loader"><div className="spinner"></div><div className="total-label">Cargando...</div></div>;
  if (error) return <div className="total-label" style={{color:'#f87171'}}>Error: {error}</div>;

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
      backgroundColor: Object.keys(porBanco).map(k => BANK_COLORS[k] || '#94a3b8'),
      borderWidth: 0
    }]
  };

  return (
    <div>
      <div className="glass-card">
        <div className="filters-row">
          <select value={filters.mes} onChange={e => setFilters({...filters, mes: e.target.value})} className="filter-select">
            <option value="ALL">Todos los meses</option>
            {filterOptions.meses.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={filters.dia} onChange={e => setFilters({...filters, dia: e.target.value})} className="filter-select">
            <option value="ALL">Todos los días</option>
            {filterOptions.dias.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filters.metodo} onChange={e => setFilters({...filters, metodo: e.target.value})} className="filter-select">
            <option value="ALL">Todos los bancos</option>
            {filterOptions.metodos.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={filters.categoria} onChange={e => setFilters({...filters, categoria: e.target.value})} className="filter-select">
            <option value="ALL">Todas las categorías</option>
            {filterOptions.categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="total-label">Volumen</div>
        <div className="total-amount" style={{color: total >= 0 ? 'var(--positive)' : 'var(--negative)'}}>{formatearDinero(Math.abs(total))}</div>
      </div>
      
      <div className="glass-card" style={{height: '250px'}}>
        <h2>Distribución</h2>
        <Doughnut data={chartData} options={{maintainAspectRatio: false, cutout: '75%', plugins: {legend: {position:'right', labels:{color:'#f8fafc'}}}} } />
      </div>

      {pedidosList.length > 0 && (
        <div className="glass-card" style={{borderColor: 'rgba(249, 115, 22, 0.3)'}}>
          <h2 style={{color: '#fdba74'}}>📌 Próximos Vencimientos / Pedidos</h2>
          <div className="movement-list">
            {pedidosList.map((mov, idx) => (
              <div key={idx} className="movement-item" style={{borderLeft: '3px solid #fdba74'}}>
                <div>
                  <div style={{fontWeight: 500, color:'#fdba74'}}>{mov.concepto}</div>
                  <div style={{fontSize: '0.7rem', color: '#94a3b8'}}>{mov.categoria} • {mov.metodo}</div>
                </div>
                <div style={{textAlign: 'right'}}>
                  <div style={{color: '#fdba74'}}>
                    {formatearDinero(mov.monto)}
                  </div>
                  <div style={{fontSize: '0.7rem', color: '#94a3b8'}}>{mov.fechaDisplay}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card">
        <h2>Movimientos</h2>
        <div className="movement-list">
          {movimientosList.length === 0 && <div className="total-label">No hay movimientos.</div>}
          {movimientosList.map((mov, idx) => (
            <div key={idx} className="movement-item">
              <div>
                <div style={{fontWeight: 500}}>{mov.concepto}</div>
                <div style={{fontSize: '0.7rem', color: '#94a3b8'}}>{mov.categoria} • {mov.metodo}</div>
              </div>
              <div style={{textAlign: 'right'}}>
                <div style={{color: mov.concepto.toLowerCase().includes("ingreso") ? 'var(--positive)' : 'var(--negative)'}}>
                  {formatearDinero(mov.monto)}
                </div>
                <div style={{fontSize: '0.7rem', color: '#94a3b8'}}>{mov.fechaDisplay}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
