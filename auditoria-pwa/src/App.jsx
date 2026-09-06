import React, { useEffect, useState } from 'react';
import Scanner from './components/Scanner';
import Dashboard from './components/Dashboard';
import Pendientes from './components/Pendientes';
import Sueldos from './components/Sueldos';
import { APPS_SCRIPT_URL } from './config';

function App() {
  const [sharedFile, setSharedFile] = useState(null);
  const [isCheckingShare, setIsCheckingShare] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [appData, setAppData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState(null);
  useEffect(() => {
    // 1. Fetch data from Apps Script
    async function fetchData() {
      try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=getData`);
        if (!response.ok) throw new Error('Error al conectar con la base de datos');
        const data = await response.json();
        setAppData(data);
        setLoadingData(false);
      } catch (err) {
        setDataError(err.message);
        setLoadingData(false);
      }
    }
    fetchData();

    // 2. Check for Shared Target
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
              // Limpiamos la URL para no re-trigger si recargan
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

  const [activeTab, setActiveTab] = useState('dashboard');

  if (isCheckingShare) {
    return <div className="loader"><div className="spinner"></div><div className="total-label">Cargando...</div></div>;
  }

  const renderTab = () => {
    if (loadingData) return <div className="loader"><div className="spinner"></div><div className="total-label">Cargando datos...</div></div>;
    if (dataError) return <div style={{textAlign: 'center', paddingTop: '40px', color: 'red'}}>Error: {dataError}</div>;

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard allData={appData.gastos} efectivoData={appData.efectivo} saldoEfectivo={appData.saldoEfectivo} />;
      case 'pendientes':
        return <Pendientes pendientes={appData.pendientes} />;
      case 'sueldos':
        return <Sueldos sueldos={appData.sueldos} />;
      default:
        return <Dashboard allData={appData.gastos} efectivoData={appData.efectivo} saldoEfectivo={appData.saldoEfectivo} />;
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      <header>
        <h1>Billetería</h1>
      </header>

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
        <>
          {renderTab()}
          
          <div className="fab-container" style={{ bottom: '90px' }}>
            <label className="fab-button" htmlFor="manual-scan" title="Escanear Gasto">
              +
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

          <nav className="bottom-nav">
            <button className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              📊 Dashboard
            </button>
            <button className={`nav-btn ${activeTab === 'pendientes' ? 'active' : ''}`} onClick={() => setActiveTab('pendientes')}>
              ⏳ Pendientes
            </button>
            <button className={`nav-btn ${activeTab === 'sueldos' ? 'active' : ''}`} onClick={() => setActiveTab('sueldos')}>
              💰 Sueldos
            </button>
          </nav>
        </>
      )}
    </div>
  );
}


// Export App
export default App;
