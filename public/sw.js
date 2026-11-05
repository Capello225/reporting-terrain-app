/* Reporting Terrain : fonctionnement hors ligne (version web installable, iPhone compris).
   Les données restent sur l'appareil (IndexedDB) ; ce fichier ne met en cache que l'application. */
const CACHE = 'reporting-terrain-3.5.0';
const FICHIERS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('reporting-terrain-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return;
  // Hors ligne d'abord : réponse immédiate depuis le cache, mise à jour discrète en arrière-plan
  e.respondWith(caches.open(CACHE).then(async c => {
    const cle = r.mode === 'navigate' ? './index.html' : r;
    const enCache = await c.match(cle, { ignoreSearch: true });
    const reseau = fetch(r).then(rep => { if (rep && rep.ok && rep.type === 'basic') c.put(cle, rep.clone()); return rep; }).catch(() => null);
    return enCache || (await reseau) || new Response('Hors ligne', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }));
});
