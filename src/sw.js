import { precacheAndRoute } from 'workbox-precaching';

// Precache assets injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST || []);

// Listen for fetch events
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Intercept the Web Share Target POST request
  if (event.request.method === 'POST' && url.pathname.endsWith('/share-target')) {
    event.respondWith((async () => {
      try {
        const formData = await event.request.formData();
        const file = formData.get('image');

        if (file) {
          // Open IndexedDB to save the shared file
          const dbName = 'hb_go_db';
          const storeName = 'cache';

          const request = indexedDB.open(dbName);

          await new Promise((resolve, reject) => {
            request.onsuccess = (e) => {
              const db = e.target.result;
              const transaction = db.transaction([storeName], 'readwrite');
              const store = transaction.objectStore(storeName);

              const putRequest = store.put(file, 'shared_image');

              putRequest.onsuccess = () => resolve();
              putRequest.onerror = () => reject(putRequest.error);
            };
            request.onerror = () => reject(request.error);
          });
        }

        // Redirect back to the app with a query param to trigger the Editor
        return Response.redirect('/hb-go/#/editor/new?shared=true', 303);
      } catch (error) {
        console.error('Error handling share target POST:', error);
        return Response.redirect('/hb-go/', 303);
      }
    })());
  }
});

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
