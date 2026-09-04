import { precacheAndRoute } from 'workbox-precaching';

// Precarga los recursos compilados por Vite
precacheAndRoute(self.__WB_MANIFEST);

// Interceptar requests POST de la Web Share Target API
self.addEventListener('fetch', event => {
  if (event.request.method === 'POST' && event.request.url.includes('/share')) {
    event.respondWith((async () => {
      const formData = await event.request.formData();
      const image = formData.get('image');
      
      if (image) {
        // Guardamos la imagen en IndexedDB temporalmente
        await saveToIndexedDB(image);
      }
      
      // Redirigir al inicio de la app para procesarlo
      return Response.redirect('/?shared=true', 303);
    })());
  }
});

async function saveToIndexedDB(file) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AuditoriaDB', 1);
    
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('sharedFiles')) {
        db.createObjectStore('sharedFiles');
      }
    };
    
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction('sharedFiles', 'readwrite');
      const store = tx.objectStore('sharedFiles');
      // Sobrescribimos siempre en la misma key 'latest_receipt'
      store.put(file, 'latest_receipt');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
  });
}
