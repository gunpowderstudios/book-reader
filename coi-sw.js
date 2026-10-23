/* Chapter & Verse — tiny service worker that makes the page "cross-origin isolated".
   Browsers only allow multi-threaded WebAssembly (Fast mode) on isolated pages, and GitHub Pages cannot send the
   required headers itself, so this adds them to this site's own files. It caches nothing and only touches
   same-origin requests; resources from other sites (the speech model and libraries) load normally. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
 const r=e.request;
 if(r.cache==='only-if-cached'&&r.mode!=='same-origin')return;
 if(new URL(r.url).origin!==self.location.origin)return;
 e.respondWith(fetch(r).then(res=>{
  if(res.status===0||!res.body&&res.status!==200&&res.status!==304)return res;
  const h=new Headers(res.headers);
  h.set('Cross-Origin-Opener-Policy','same-origin');
  h.set('Cross-Origin-Embedder-Policy','require-corp');
  return new Response(res.body,{status:res.status,statusText:res.statusText,headers:h});
 }));
});
