/* E.D.D.i. v1.12.101 — cache the application shell for offline reading.
   Keep COOP/COEP headers on same-origin replies so multi-threaded speech can still operate.
   Large AI model files remain managed by the speech library's browser cache. */
const CACHE='eddi-shell-v1.12.101';
const SHELL=['./','index.html','kokoro.js','kokoro-worker.js','library.js','offline.js','read-along.js',
 'images/eddi-reader-logo-long.png','images/eddi-reader-logo-square.png','images/book-cover-fallback.svg'];
const JSZIP='https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
self.addEventListener('install',e=>{
 e.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await Promise.allSettled(SHELL.map(url=>cache.add(new Request(url,{cache:'reload'}))));
  try{await cache.add(new Request(JSZIP,{mode:'cors'}))}catch(_){}
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',e=>e.waitUntil((async()=>{
 const names=await caches.keys();
 await Promise.all(names.filter(n=>n.startsWith('eddi-shell-')&&n!==CACHE).map(n=>caches.delete(n)));
 await self.clients.claim();
})()));
function isolated(res){
 if(!res||res.type==='opaque'||res.type==='opaqueredirect')return res;
 const h=new Headers(res.headers);
 h.set('Cross-Origin-Opener-Policy','same-origin');
 h.set('Cross-Origin-Embedder-Policy','require-corp');
 return new Response(res.body,{status:res.status,statusText:res.statusText,headers:h});
}
self.addEventListener('fetch',e=>{
 const req=e.request;
 if(req.cache==='only-if-cached'&&req.mode!=='same-origin')return;
 if(req.method!=='GET')return;
 const url=new URL(req.url),same=url.origin===self.location.origin;
 if(!same&&url.href!==JSZIP)return;
 e.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const key=same?new Request(url.origin+url.pathname):req;
  try{
   // Always revalidate the app shell. Safari can otherwise show a stale UI from HTTP cache.\n   const shellFile=same&&SHELL.some(p=>new URL(p,self.registration.scope).pathname===url.pathname);\n   const response=await fetch(shellFile?new Request(req,{cache:'no-store'}):req);
   if(response.ok&&same&&!url.pathname.includes('/books/')&&!url.pathname.includes('/audiobook/')){
    // Cache the shell only, not arbitrary reader content.
    if(SHELL.some(p=>new URL(p,self.registration.scope).pathname===url.pathname))
      await cache.put(key,response.clone());
   }
   if(response.ok&&!same)await cache.put(req,response.clone());
   return same?isolated(response):response;
  }catch(err){
   const cached=await cache.match(key);
   if(cached)return same?isolated(cached):cached;
   if(same&&req.mode==='navigate'){
    const home=await cache.match(new Request(new URL('index.html',self.registration.scope)));
    if(home)return isolated(home);
   }
   throw err;
  }
 })());
});
