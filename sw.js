// Service worker mínimo: guarda en caché la interfaz y las imágenes para que
// la app abra rápido. Los datos del juego siempre se piden al servidor.
const CACHE = 'joputa-v15';
const CORE = ['./', 'index.html', 'styles.css', 'app.js', 'sigilo.js', 'config.js', 'manifest.webmanifest', 'img/mapa.webp', 'img/app_icon_192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // imágenes: caché primero; el resto: red primero (para recibir actualizaciones)
  if (url.pathname.includes('/img/')) {
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((res) => {
      const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return res;
    })));
  } else {
    e.respondWith(fetch(e.request).then((res) => {
      const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return res;
    }).catch(() => caches.match(e.request)));
  }
});

// Avisos push
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'El Joputa del Camping', {
    body: d.body || '', tag: d.tag || 'joputa', renotify: true,
    icon: 'img/app_icon_192.png', badge: 'img/app_icon_192.png', data: { url: './' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return self.clients.openWindow('./');
  }));
});
