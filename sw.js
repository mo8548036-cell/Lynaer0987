// Impostor Arena — service worker: o jogo abre sem internet (Treino offline).
// Nunca guarda o Socket.IO nem chamadas de API: o online continua sempre em tempo real.
const CACHE = 'impostor-arena-v4';
const CORE = ['./', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.searchParams.has('EIO') || u.pathname.includes('/api/')) return;
  if (u.pathname.startsWith('/ws/') && !u.pathname.endsWith('.js')) return;
  const font = /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if (u.origin !== self.location.origin && !font) return;
  const keep = (res) => { if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(r, cp)); } return res; };
  if (r.mode === 'navigate') { // página: rede primeiro (versão nova), cache se estiver offline
    e.respondWith(fetch(r).then(keep).catch(() => caches.match(r).then((m) => m || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(r).then((m) => { const net = fetch(r).then(keep).catch(() => m); return m || net; }));
});
