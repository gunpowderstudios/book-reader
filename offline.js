/* Book Reader v1.5.0 — chapter preparation, persistent per-clip audio, and seamless WAV playback.
   Browser storage is per device; preparing is not a network audio download. */
(()=>{'use strict';
const $=id=>document.getElementById(id),app=()=>window.chapterApp,voice=()=>window.chapterKokoro;
let dbTask,preparing=false,cancel=false,playing=null,url=null;
function note(s){const e=$('offline-status');if(e)e.textContent=s}
function current(){const s=app()?.state;return s?.chapters?.[s.index]?{s,chapter:s.chapters[s.index],id:s.key+':'+s.index}:null}
function db(){if(!dbTask)dbTask=new Promise((resolve,reject)=>{const r=indexedDB.open('book-reader-audio-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('clips');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});return dbTask}
async function entry(key){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction('clips','readonly'),q=t.objectStore('clips').get(key);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)})}
async function save(key,value){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction('clips','readwrite');t.objectStore('clips').put(value,key);t.oncomplete=resolve;t.onerror=()=>reject(t.error)})}
function clips(chapter){return chapter.paragraphs.flatMap(p=>voice().splitText(p)).filter(Boolean)}
function formatMB(n){return (n/1048576).toFixed(1)+' MB'}
function estimate(){const v=current();if(!v)return null;const words=v.chapter.paragraphs.join(' ').trim().split(/\s+/).filter(Boolean).length;const seconds=words/140*60;const bytes=seconds*24000*2;return {words,seconds,bytes,model:voice()?.getMode?.()==='fast'?'~326 MB':'~92 MB'}}
async function refresh(){
 const v=current(),btn=$('offline-prepare'),play=$('offline-play'),cancelBtn=$('offline-cancel');
 if(btn)btn.disabled=!v||preparing;
 if(cancelBtn)cancelBtn.hidden=!preparing;
 if(!v){note('Open an EPUB to prepare a chapter.');if(play)play.disabled=true;return}
 const e=estimate(),total=clips(v.chapter).length;
 $('offline-estimate').textContent=v.chapter.title+' · '+e.words.toLocaleString()+' words · ~'+Math.round(e.seconds/60)+' min · ~'+formatMB(e.bytes)+' of local audio storage (WAV). George’s '+e.model+' voice model downloads once if not cached.';
 let done=0,actual=0;
 try{for(let i=0;i<total;i++){const c=await entry(v.id+':'+i);if(c?.blob){done++;actual+=c.blob.size}}}catch(err){note('Offline storage unavailable: '+err.message);if(play)play.disabled=true;return}
 if(play)play.disabled=done!==total||!total;
 if(!preparing)note(done===total&&total?'Ready: saved audio can play without generating speech. Use Play prepared chapter.':done?'Saved '+done+' of '+total+' passages ('+formatMB(actual)+'). Select Prepare to resume.':'Not prepared yet. The chapter will be generated once and stored on this device.');
}
function wavHeader(bytes,hz){const ab=new ArrayBuffer(44),v=new DataView(ab);const tag=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};tag(0,'RIFF');v.setUint32(4,36+bytes,true);tag(8,'WAVE');tag(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,hz,true);v.setUint32(28,hz*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);tag(36,'data');v.setUint32(40,bytes,true);return ab}
async function prepare(){
 if(preparing)return;const v=current();if(!v)return;
 app().stop();stopAudio();preparing=true;cancel=false;$('offline-prepare').disabled=true;$('offline-cancel').hidden=false;
 const lines=clips(v.chapter),total=lines.length;let done=0;
 try{
  for(let i=0;i<total;i++){
   if(cancel||current()?.id!==v.id)break;
   const key=v.id+':'+i;let stored=await entry(key);
   if(!stored?.blob){
    note('Generating passage '+(i+1)+' of '+total+'… Keep this tab open and unlocked.'); 
    const r=await voice().generateClip(lines[i]);stored={blob:r.blob,at:Date.now()};
    await save(key,stored);
   }
   done++;$('offline-progress').value=Math.round(done/total*100);
   note('Prepared '+done+' of '+total+' passages ('+Math.round(done/total*100)+'%). You can stop and resume later.');
  }
  if(cancel)note('Preparation stopped. Progress was saved.');
 }catch(err){note('Preparation stopped: '+err.message+'. Completed passages remain saved.')}
 finally{preparing=false;$('offline-cancel').hidden=true;await refresh()}
}
function stopAudio(){if(playing){playing.pause();playing.removeAttribute('src');playing.load();playing=null}if(url){URL.revokeObjectURL(url);url=null};$('offline-play').textContent='▶ Play prepared chapter'}
async function playPrepared(){
 if(playing){stopAudio();return}
 const v=current();if(!v)return;
 app().stop();note('Opening saved audio…');
 try{
  const parts=clips(v.chapter),blobs=[];let rate=24000,bytes=0;
  for(let i=0;i<parts.length;i++){
   const e=await entry(v.id+':'+i);if(!e?.blob)throw Error('Chapter is not fully prepared');
   const b=e.blob; if(b.size<44)throw Error('Invalid saved audio');
   const header=new DataView(await b.slice(0,44).arrayBuffer());const hz=header.getUint32(24,true);
   if(i===0)rate=hz;else if(hz!==rate)throw Error('Audio sample rates differ; regenerate this chapter');
   blobs.push(b.slice(44));bytes+=b.size-44;
  }
  // One WAV blob gives gapless playback; Blob parts are assembled without decoding every clip into RAM.
  const combined=new Blob([wavHeader(bytes,rate),...blobs],{type:'audio/wav'});
  url=URL.createObjectURL(combined);playing=new Audio(url);playing.playbackRate=Number($('rate').value)||1;
  playing.onended=()=>{stopAudio();note('Finished prepared chapter.')};
  playing.onerror=()=>{stopAudio();note('Saved audio could not play on this device.')};
  $('offline-play').textContent='■ Stop prepared chapter';await playing.play();note('Playing saved chapter — no AI generation needed.');
 }catch(err){stopAudio();note('Cannot play saved chapter: '+err.message)}
}
function setup(){
 $('offline-prepare').onclick=prepare;
 $('offline-cancel').onclick=()=>{cancel=true;note('Stopping after the current passage…')};
 $('offline-play').onclick=playPrepared;
 $('offline-help').textContent='Audio is saved only in this browser on this device. Keep this tab open during preparation. Browsers may clear stored audio; for guaranteed offline listening export an audiobook on your Mac. The webpage itself may still need internet to open.';
 refresh();
}
window.bookOffline={refresh,stopAudio};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();