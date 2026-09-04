import React, { useEffect, useState } from 'react';
import Scanner from './components/Scanner';
import './App.css'; // Moveremos los estilos globales aquí

function App() {
  const [sharedFile, setSharedFile] = useState(null);
  const [isCheckingShare, setIsCheckingShare] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('shared') === 'true') {
      // Buscar en IndexedDB
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

  if (isCheckingShare) {
    return <div className="loader"><div className="spinner"></div><div className="total-label">Cargando...</div></div>;
  }

  return (
    <div className="container">
      <header>
        <h1>Auditoría de Gastos</h1>
      </header>

      {sharedFile ? (
        <Scanner 
          file={sharedFile} 
          onScanComplete={(data) => {
            alert(`¡Guardado exitosamente!\nMonto: ${data.monto}\nConcepto: ${data.concepto}`);
            setSharedFile(null);
            window.location.reload(); // Recargar para ver los cambios
          }} 
          onCancel={() => setSharedFile(null)} 
        />
      ) : (
        <Dashboard />
      )}
    </div>
  );
}

import Dashboard from './components/Dashboard';

// Export App
export default App;
