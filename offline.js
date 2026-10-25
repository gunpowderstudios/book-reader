/* Book Reader — optional "prepare a chapter": generate the narration once and keep it on this device.
   Saved passages are found by what they SAY (a fingerprint of the text plus the narrator), so they can never
   be played against the wrong text, and pressing Play uses them automatically — with highlighting, bookmarks and
   chapter-to-chapter reading — instead of asking the voice engine. Storage is per device. */
(()=>{'use strict';
const $=id=>document.getElementById(id),app=()=>window.chapterApp,voice=()=>window.chapterKokoro;
let dbTask,preparing=false,cancel=false;
const STORE='clips',DB_NAME='book-reader-audio-v2';
function note(s){const e=$('offline-status');if(e)e.textContent=s}
function narrator(){return voice().currentVoice()}
function current(){const s=app()?.state;return s?.chapters?.[s.index]?{s,chapter:s.chapters[s.index],id:s.key+':'+s.index}:null}
function fingerprint(s){ /* two 32-bit hashes plus the length: plenty to tell passages apart */
 let a=0x811c9dc5,b=0x9e3779b9;
 for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);a=Math.imul(a^c,16777619);b=Math.imul(b^c,2246822519);b^=b>>>13}
 return (a>>>0).toString(36)+(b>>>0).toString(36)+'-'+s.length.toString(36);
}
const clipKey=(v,text)=>v+'|'+fingerprint(text);
function db(){
 if(!dbTask)dbTask=new Promise((resolve,reject)=>{
  if(!window.indexedDB){reject(new Error('this browser cannot store audio'));return}
  const r=indexedDB.open(DB_NAME,1);
  r.onupgradeneeded=()=>r.result.createObjectStore(STORE);
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
 return dbTask;
}
const tx=(mode,work)=>db().then(d=>new Promise((resolve,reject)=>{const t=d.transaction(STORE,mode),res={v:undefined};t.oncomplete=()=>resolve(res.v);t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error);work(t.objectStore(STORE),res)}));
/* Audio is stored as plain bytes (not Blob objects), which Safari handles far more reliably in IndexedDB. */
const toBlob=row=>row&&row.buf&&row.buf.byteLength>44?new Blob([row.buf],{type:'audio/wav'}):(row&&row.blob&&row.blob.size>44?row.blob:null);
async function get(v,text){const row=await tx('readonly',(st,res)=>{const q=st.get(clipKey(v,norm(text)));q.onsuccess=()=>{res.v=q.result}});return toBlob(row)}
async function put(v,text,blob){const buf=await blob.arrayBuffer();return tx('readwrite',st=>{st.put({buf,at:Date.now()},clipKey(v,norm(text)))})}
/* Short-lived storage for passages prepared ahead during normal listening (kept out of memory; removed once played or stopped). */
const tmpKey=k=>'tmp|'+fingerprint(k);
const putTemp=async(k,blob)=>{const buf=await blob.arrayBuffer();return tx('readwrite',st=>{st.put({buf,at:Date.now()},tmpKey(k))})};
const getTemp=k=>tx('readonly',(st,res)=>{const q=st.get(tmpKey(k));q.onsuccess=()=>{res.v=q.result}}).then(r=>{const b=toBlob(r);if(b)return b;throw new Error('missing')});
const dropTemp=k=>tx('readwrite',st=>{st.delete(tmpKey(k))});
const purgeTemp=()=>tx('readwrite',st=>{st.delete(IDBKeyRange.bound('tmp|','tmp|\uffff'))}).catch(()=>{});
const savedKeys=()=>tx('readonly',(st,res)=>{const q=st.getAllKeys();q.onsuccess=()=>{res.v=new Set(q.result.filter(k=>typeof k==='string'&&!k.startsWith('tmp|')))}}).then(x=>x||new Set());
function norm(s){return String(s||'').replace(/\s+/g,' ').trim()}
function clips(chapter){return chapter.paragraphs.flatMap(p=>voice().splitText(p)).map(norm).filter(Boolean)}
function formatMB(n){return (n/1048576).toFixed(1)+' MB'}
function estimate(){const v=current();if(!v)return null;const words=v.chapter.paragraphs.join(' ').trim().split(/\s+/).filter(Boolean).length;const seconds=words/140*60;return {words,seconds,bytes:seconds*24000*2}}
async function refresh(){
 const v=current(),btn=$('offline-prepare'),cancelBtn=$('offline-cancel'),clear=$('offline-clear');
 if(btn)btn.disabled=!v||preparing;
 if(cancelBtn)cancelBtn.hidden=!preparing;
 if(!v){if(!preparing)note('Open an EPUB to prepare a chapter.');return}
 const e=estimate(),lines=clips(v.chapter),total=lines.length;
 let keys=new Set;
 try{keys=await savedKeys()}catch(err){if(!preparing)note('Saving audio is not available here: '+err.message);if(btn)btn.disabled=true;return}
 const who=narrator();let done=0;for(const t of lines)if(keys.has(clipKey(who,t)))done++;
 $('offline-estimate').textContent=v.chapter.title+' · '+e.words.toLocaleString()+' words · about '+Math.round(e.seconds/60)+' min · about '+formatMB(e.bytes)+' of storage on this device.';
 if(clear){clear.hidden=!keys.size;clear.textContent='Delete all saved audio ('+keys.size.toLocaleString()+' passages)'}
 if(!preparing)note(done===total&&total?'This chapter is prepared. Press Play and it will start straight away, without generating speech.':done?'Saved '+done+' of '+total+' passages. Press Prepare to continue.':'Not prepared yet. Preparing generates the chapter once and keeps it on this device.');
}
async function prepare(){
 if(preparing)return;const v=current();if(!v)return;
 app().stop();preparing=true;cancel=false;$('offline-prepare').disabled=true;$('offline-cancel').hidden=false;
 const lines=clips(v.chapter),total=lines.length,who=narrator();let done=0;
 try{
  const keys=await savedKeys();
  for(let i=0;i<total;i++){
   if(cancel||current()?.id!==v.id)break;
   if(!keys.has(clipKey(who,lines[i]))){
    note('Generating passage '+(i+1)+' of '+total+'… Keep this tab open and unlocked.');
    const r=await voice().generateClip(lines[i],who);
    await put(who,lines[i],r.blob);
   }
   done++;$('offline-progress').value=Math.round(done/total*100);
   note('Prepared '+done+' of '+total+' passages ('+Math.round(done/total*100)+'%). You can stop and carry on later.');
  }
  if(cancel)note('Preparation stopped. Progress was saved.');
 }catch(err){note('Preparation stopped: '+err.message+'. Completed passages remain saved.')}
 finally{preparing=false;$('offline-cancel').hidden=true;await refresh()}
}
async function clearAll(){
 if(preparing)return;
 if(!confirm('Delete all prepared audio from this device? Your books and reading places are not affected.'))return;
 try{await tx('readwrite',st=>{st.clear()});note('Saved audio deleted.')}catch(err){note('Could not delete saved audio: '+err.message)}
 await refresh();
}
function setup(){
 $('offline-prepare').onclick=prepare;
 $('offline-cancel').onclick=()=>{cancel=true;note('Stopping after the current passage…')};
 $('offline-clear').onclick=clearAll;
 $('offline-help').textContent='Audio is saved only in this browser, on this device, and the browser may clear it if storage runs low. Keep this tab open while preparing.';
 try{indexedDB.deleteDatabase('book-reader-audio-v1')}catch(_){} /* the earlier, less reliable store */
 purgeTemp(); /* leftovers from a closed tab */
 refresh();
}
window.bookOffline={refresh,get:(v,t)=>get(v,t),put,putTemp,getTemp,dropTemp,purgeTemp};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();
