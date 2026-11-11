/* E.D.D.i. PWA service worker: network-first entrypoint; do not cache user books or AI models. */
const CACHE='eddi-shell-v1';
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(['/images/eddi-reader-logo-square.png']).catch(()=>{})));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('eddi-shell-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()]))});
self.addEventListener('fetch',event=>{const req=event.request;if(req.mode!=='navigate'||new URL(req.url).origin!==self.location.origin)return;event.respondWith(fetch(req).catch(()=>caches.match(req)))});
