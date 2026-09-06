import React, { useEffect, useState } from 'react';
import Scanner from './components/Scanner';
import Dashboard from './components/Dashboard';
import Pendientes from './components/Pendientes';
import Sueldos from './components/Sueldos';
import { APPS_SCRIPT_URL } from './config';
import { LayoutDashboard, Clock, Wallet, Plus, Scan, Settings as SettingsIcon } from 'lucide-react';
import MovementDetail from './components/MovementDetail';
import Settings from './components/Settings';

function App() {
  const [sharedFile, setSharedFile] = useState(null);
  const [isCheckingShare, setIsCheckingShare] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMovement, setSelectedMovement] = useState(null);
  
  const [appData, setAppData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState(null);
  
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=getData`);
        if (!response.ok) throw new Error('Error al conectar con la base de datos');
        let rawData = await response.json();
        
        // Fallback por si la API de GAS sigue en la versión vieja
        if (rawData.allData && !rawData.gastos) {
          rawData = { gastos: rawData.allData, pendientes: [], efectivo: [], saldoEfectivo: 0, sueldos: [], apodos: [] };
        }
        if (!rawData.apodos) rawData.apodos = [];

        const mapFechas = (arr) => {
          if (!arr) return [];
          return arr.map(item => {
            if (item.fecha && !item.fechaDisplay) {
              const d = new Date(item.fecha);
              if (!isNaN(d.getTime())) {
                item.fechaDisplay = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                item.mesIso = d.toISOString().substring(0, 7);
              }
            }
            return item;
          });
        };

        rawData.gastos = mapFechas(rawData.gastos);
        rawData.pendientes = mapFechas(rawData.pendientes);
        rawData.efectivo = mapFechas(rawData.efectivo);
        rawData.sueldos = mapFechas(rawData.sueldos);

        setAppData(rawData);
        setLoadingData(false);
      } catch (err) {
        setDataError(err.message);
        setLoadingData(false);
      }
    }
    fetchData();

    const params = new URLSearchParams(window.location.search);
    if (params.get('shared') === 'true') {
      const request = indexedDB.open('AuditoriaDB', 1);
      request.onsuccess = (e) => {
        const db = e.target.result;
        if (db.objectStoreNames.contains('sharedFiles')) {
          const tx = db.transaction('sharedFiles', 'readonly');
          const store = tx.objectStore('sharedFiles');
          const getReq = store.get('latest_receipt');
          
          getReq.onsuccess = () => {
            if (getReq.result) {
              setSharedFile(getReq.result);
              window.history.replaceState({}, document.title, "/");
            }
            setIsCheckingShare(false);
          };
          getReq.onerror = () => setIsCheckingShare(false);
        } else {
          setIsCheckingShare(false);
        }
      };
      request.onerror = () => setIsCheckingShare(false);
    } else {
      setIsCheckingShare(false);
    }
  }, []);

  if (isCheckingShare) {
    return <div className="loader"><div className="spinner"></div><div className="total-label">Cargando...</div></div>;
  }

  const handleUpdateCategory = async (id, newCategory) => {
    // Optimistic update locally
    const updateInArray = (arr) => arr.map(item => item.id === id ? { ...item, categoria: newCategory } : item);
    setAppData(prev => ({ ...prev, gastos: updateInArray(prev.gastos) }));
    
    // Server request
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          token: "facu_gastos_2026",
          action: "updateCategory",
          id: id,
          categoria: newCategory
        })
      });
    } catch(e) {
      console.error("Error updating category", e);
    }
  };

  const handleSaveApodo = async (nombreOriginal, apodo) => {
    // Actualización optimista local
    const newApodo = { id: Date.now().toString(), nombreOriginal, apodo };
    setAppData(prev => {
      const existing = prev.apodos.find(a => a.nombreOriginal.toLowerCase() === nombreOriginal.toLowerCase());
      let newApodos;
      if (existing) {
        newApodos = prev.apodos.map(a => a.nombreOriginal.toLowerCase() === nombreOriginal.toLowerCase() ? { ...a, apodo } : a);
      } else {
        newApodos = [...prev.apodos, newApodo];
      }
      return { ...prev, apodos: newApodos };
    });

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          token: "facu_gastos_2026",
          action: "saveApodo",
          nombreOriginal: nombreOriginal,
          apodo: apodo
        })
      });
      setSelectedMovement(null); // Cerramos el modal al guardar
    } catch(e) {
      console.error("Error saving apodo", e);
    }
  };

  const renderTab = () => {
    if (loadingData) return <div className="loader"><div className="spinner"></div><div className="total-label">Cargando datos...</div></div>;
    if (dataError) return <div style={{textAlign: 'center', paddingTop: '40px', color: 'red'}}>Error: {dataError}</div>;

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard allData={appData.gastos} efectivoData={appData.efectivo} saldoEfectivo={appData.saldoEfectivo} onUpdateCategory={handleUpdateCategory} onMovementClick={setSelectedMovement} apodos={appData.apodos} />;
      case 'pendientes':
        return <Pendientes pendientes={appData.pendientes} onMovementClick={setSelectedMovement} apodos={appData.apodos} />;
      case 'sueldos':
        return <Sueldos sueldos={appData.sueldos} />;
      case 'settings':
        return <Settings apodos={appData.apodos} onBack={() => setActiveTab('dashboard')} />;
      default:
        return <Dashboard allData={appData.gastos} efectivoData={appData.efectivo} saldoEfectivo={appData.saldoEfectivo} onUpdateCategory={handleUpdateCategory} onMovementClick={setSelectedMovement} apodos={appData.apodos} />;
    }
  };

  return (
    <>
      <div className="header-bar">
        <h1 className="header-title">Billetería</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="badge">v0.0.4</span>
          <button style={{ background: 'none', border: 'none', color: 'var(--text-main)' }} onClick={() => setActiveTab('settings')}>
            <SettingsIcon size={22} />
          </button>
        </div>
      </div>

      <div className="content-area">
        {sharedFile ? (
          <Scanner 
            file={sharedFile} 
            onScanComplete={(data) => {
              alert(`¡Guardado exitosamente!\nMonto: ${data.monto}\nConcepto: ${data.concepto}`);
              setSharedFile(null);
              window.location.reload(); 
            }} 
            onCancel={() => setSharedFile(null)} 
          />
        ) : (
          renderTab()
        )}
      </div>

      {!sharedFile && (
        <nav className="bottom-nav">
          <button className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={22} />
            <span>Resumen</span>
          </button>
          <button className={`nav-btn ${activeTab === 'pendientes' ? 'active' : ''}`} onClick={() => setActiveTab('pendientes')}>
            <Clock size={22} />
            <span>Pendientes</span>
          </button>
          
          <div className="nav-fab-wrap">
            <label className="nav-fab" htmlFor="manual-scan" title="Escanear Gasto">
              <Scan size={24} color="#000" />
            </label>
            <input 
              type="file" 
              id="manual-scan" 
              accept="image/*,application/pdf" 
              style={{ display: 'none' }} 
              onChange={(e) => {
                if(e.target.files && e.target.files[0]) {
                  setSharedFile(e.target.files[0]);
                }
              }} 
            />
          </div>

          <button className={`nav-btn ${activeTab === 'sueldos' ? 'active' : ''}`} onClick={() => setActiveTab('sueldos')}>
            <Wallet size={22} />
            <span>Sueldos</span>
          </button>
        </nav>
      )}

      {/* MODAL DE DETALLES */}
      {selectedMovement && (
        <MovementDetail 
          mov={selectedMovement} 
          onClose={() => setSelectedMovement(null)} 
          onSaveApodo={handleSaveApodo}
          onUpdateCategory={handleUpdateCategory}
          apodos={appData?.apodos || []}
        />
      )}
    </>
  );
}

export default App;
