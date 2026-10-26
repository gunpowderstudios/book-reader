/* Book Reader — My Library.
   Keeps your EPUB files and your place in each one in this browser's own database (IndexedDB).
   Nothing is uploaded; nothing is shared between your devices. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const DB_NAME='chapter-and-verse',DB_VER=1,SAVE_DELAY=1200;
let dbPromise=null,books=[],available=true,persisted=null,pending=null,timer=null;

/* ───────── Database ───────── */
function openDB(){
 if(dbPromise)return dbPromise;
 dbPromise=new Promise((resolve,reject)=>{
  if(!window.indexedDB){reject(new Error('This browser has no local database'));return}
  let r;try{r=indexedDB.open(DB_NAME,DB_VER)}catch(e){reject(e);return}
  r.onupgradeneeded=()=>{
   const d=r.result;
   if(!d.objectStoreNames.contains('books'))d.createObjectStore('books',{keyPath:'id'});
   if(!d.objectStoreNames.contains('files'))d.createObjectStore('files');
  };
  r.onsuccess=()=>{const db=r.result;db.onversionchange=()=>db.close();resolve(db)};
  r.onerror=()=>reject(r.error||new Error('Could not open the library database'));
  r.onblocked=()=>reject(new Error('The library database is busy; close other tabs of this app and reload'));
 });
 dbPromise.catch(()=>{available=false;render()});
 return dbPromise;
}
function run(stores,mode,work){ /* work(transaction, result) fills result.v; resolves when the transaction commits */
 return openDB().then(db=>new Promise((resolve,reject)=>{
  const res={v:undefined},t=db.transaction(stores,mode);
  t.oncomplete=()=>resolve(res.v);
  t.onerror=()=>reject(t.error);
  t.onabort=()=>reject(t.error||new Error('Database transaction aborted'));
  work(t,res);
 }));
}

/* ───────── Data ───────── */
const list=()=>run(['books'],'readonly',(t,res)=>{const q=t.objectStore('books').getAll();q.onsuccess=()=>{res.v=q.result||[]}}).then(a=>a||[]);
const get=id=>run(['books'],'readonly',(t,res)=>{const q=t.objectStore('books').get(id);q.onsuccess=()=>{res.v=q.result}});
const hasFile=id=>run(['files'],'readonly',(t,res)=>{const q=t.objectStore('files').count(IDBKeyRange.only(id));q.onsuccess=()=>{res.v=q.result>0}});
const getFile=id=>run(['files'],'readonly',(t,res)=>{const q=t.objectStore('files').get(id);q.onsuccess=()=>{res.v=q.result}});

/* Add or update a book. Your saved place is kept when the book is already there. */
async function upsert(meta,file){
 const rec=await run(['books','files'],'readwrite',(t,res)=>{
  const bs=t.objectStore('books'),g=bs.get(meta.id);
  g.onsuccess=()=>{
   const old=g.result||null,now=Date.now();
   const next={...(old||{}),...meta,added:old?old.added:now,lastOpened:now};
   if(old&&old.index!=null&&meta.keepPosition){next.index=old.index;next.p=old.p;next.pct=old.pct}
   delete next.keepPosition;
   bs.put(next);res.v=next;
   if(file)t.objectStore('files').put(file,meta.id);
  };
 });
 const i=books.findIndex(b=>b.id===rec.id);
 if(i>=0)books[i]=rec;else books.push(rec);
 if(file&&persisted===null&&navigator.storage&&navigator.storage.persist){
  navigator.storage.persist().then(ok=>{persisted=!!ok;renderStorage()},()=>{persisted=false;renderStorage()});
 }
 render();
 return rec;
}

/* Save where you are. Writes are batched (and flushed when the page is hidden) so reading never waits on the disk. */
function position(id,pos){
 if(!available||!id)return;
 const now=Date.now();
 const b=books.find(x=>x.id===id);if(b)Object.assign(b,pos,{lastOpened:now});
 pending={id,pos:{...pos,lastOpened:now}};
 clearTimeout(timer);timer=setTimeout(flush,SAVE_DELAY);
}
function flush(){
 clearTimeout(timer);timer=null;
 const p=pending;pending=null;
 if(!p||!available)return Promise.resolve();
 return run(['books'],'readwrite',t=>{
  const bs=t.objectStore('books'),g=bs.get(p.id);
  g.onsuccess=()=>{if(g.result)bs.put({...g.result,...p.pos})};
 }).catch(()=>{});
}
async function remove(id){
 await flush();
 await run(['books','files'],'readwrite',t=>{t.objectStore('books').delete(id);t.objectStore('files').delete(id)});
 books=books.filter(b=>b.id!==id);
 render();
}
async function refresh(){
 try{books=await list();available=true}catch(_){available=false;books=[]}
 render();
 return books;
}
const estimate=()=>navigator.storage&&navigator.storage.estimate?navigator.storage.estimate().catch(()=>null):Promise.resolve(null);

/* ───────── Screen ───────── */
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e};
const fmtMB=n=>(n/1048576).toFixed(n<10485760?1:0)+' MB';
function when(ts){
 if(!ts)return '';
 try{return new Date(ts).toLocaleString(undefined,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}catch(_){return ''}
}
function card(b){
 const c=el('article','book');c.dataset.id=b.id;
 const cover=el('div','cover');
 const art=b.cover||(/^Conan_Original_Stories/i.test(b.name||'')||/^Conan: Original/i.test(b.title||'')?'books/conan-cover.svg':''); /* the free book ships with its own cover */
 if(art){const img=el('img');img.src=art;img.alt='';cover.append(img)}
 else cover.append(el('span','ph',(b.title||'?').trim().charAt(0).toUpperCase()||'?'));
 const info=el('div','info');
 info.append(el('h3','',b.title||b.name||'Untitled'));
 info.append(el('p','by',b.author||'Unknown author'));
 const pct=Math.round((b.pct||0)*100);
 const prog=el('div','prog');const fill=el('i');fill.style.width=pct+'%';prog.append(fill);
 info.append(prog);
 const bits=[pct+'% read'];
 if(b.chapters)bits.push('chapter '+Math.min(b.chapters,(b.index||0)+1)+' of '+b.chapters);
 if(b.lastOpened)bits.push('last read '+when(b.lastOpened));
 info.append(el('small','',bits.join(' · ')));
 const acts=el('div','acts');
 const go=el('button','go',(b.pct||0)>0||(b.index||0)>0||(b.p||0)>0?'▶ Continue':'▶ Start');
 go.onclick=()=>{if(window.chapterApp)window.chapterApp.openFromLibrary(b.id)};
 const rm=el('button','rm','Remove');let armed=0;
 rm.onclick=()=>{
  if(!armed){rm.textContent='Really remove?';rm.classList.add('danger');armed=setTimeout(()=>{armed=0;rm.textContent='Remove';rm.classList.remove('danger')},4000);return}
  clearTimeout(armed);rm.disabled=true;remove(b.id).catch(e=>{rm.disabled=false;rm.textContent='Remove';if(window.chapterApp)window.chapterApp.say('Could not remove the book: '+e.message)});
 };
 acts.append(go,rm);info.append(acts);
 c.append(cover,info);
 return c;
}
function render(){
 const grid=$('lib-list');if(!grid)return;
 const empty=$('lib-empty');
 grid.replaceChildren(...[...books].sort((a,b)=>(b.lastOpened||0)-(a.lastOpened||0)).map(card));
 if(empty){
  empty.hidden=books.length>0;
  // Keep the designed welcome card and its Free Books link in place.
  // Only change the empty-library fallback note when browser storage is unavailable.
  const note=empty.querySelector('.first-book-note');
  if(note)note.textContent=available
   ?'Explore the Free Books collection, including Dracula.'
   :'You can still open a free EPUB, but this browser may not save books between visits.';
 }
 renderStorage();
}
async function renderStorage(){
 const out=$('lib-storage');if(!out)return;
 if(!available){out.textContent='';return}
 const used=books.reduce((n,b)=>n+(b.size||0),0);
 const e=await estimate();
 let t=books.length+(books.length===1?' book':' books')+' · '+fmtMB(used)+' of EPUB files saved on this device only (not shared between your Mac, iPhone and iPad)';
 if(e&&e.quota)t+=' · '+fmtMB(e.usage||0)+' of '+fmtMB(e.quota)+' browser storage in use';
 if(persisted===false)t+=' · the browser may clear this library if the device runs very low on space';
 out.textContent=t;
}

/* ───────── Start-up ───────── */
const ready=refresh();
window.addEventListener('pagehide',flush);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush()});
window.chapterLibrary={ready,list,get,hasFile,getFile,upsert,position,flush,remove,refresh,render,estimate,
 get available(){return available},get books(){return books.slice()}};

(function wire(){
 const input=$('file-lib');
 if(input)input.onchange=async e=>{
  const files=[...(e.target.files||[])];e.target.value='';
  if(window.chapterApp&&files.length)await window.chapterApp.addFiles(files);
 };
})();
})();
