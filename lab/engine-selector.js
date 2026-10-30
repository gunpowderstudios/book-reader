/* Eddi Lab engine selector: Kokoro tests remain original; Kitten uses the saved Nano Web Worker. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const family=$('lab-family'),voice=$('stream-voice'),mode=$('stream-engine'),start=$('stream-start'),stop=$('stream-stop'),audio=$('stream-player');
if(!family||!voice||!start||!stop||!audio)return;
const kokoro=[...voice.options].map(o=>[o.value,o.textContent]);
const kitten=['bella','jasper','luna','bruno','rosie','hugo','kiki','leo'];
const modeField=mode.closest('.test-field');
const status=document.createElement('p');status.id='kitten-lab-status';status.className='muted';status.setAttribute('role','status');start.parentElement.after(status);
let worker=null,pending=new Map(),counter=0,active=null;
const report=()=>window.eddiLabBridge?.getReport?.();
function note(msg){status.textContent=msg;const r=report();if(r)r.events.push({time:new Date().toISOString(),message:'Kitten: '+msg})}
function reset(){
 if(active){active.cancelled=true;for(const url of active.urls||[])URL.revokeObjectURL(url)}
 active=null;audio.pause();audio.removeAttribute('src');audio.load();
 if(worker){worker.terminate();worker=null}
 for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('Stopped'))}pending.clear();
 start.disabled=false;stop.disabled=true;family.disabled=false;voice.disabled=false;
}
function call(type,text,voiceName){
 return new Promise((resolve,reject)=>{
  const id=++counter,timer=setTimeout(()=>{pending.delete(id);reject(Error('Kitten request timed out'))},90000);
  pending.set(id,{timer,resolve,reject});
  worker.postMessage({id,type,text,voice:voiceName});
 });
}
function choose(){
 reset();
 const selected=family.value;
 voice.replaceChildren(...(selected==='kitten'?kitten.map(v=>new Option(v[0].toUpperCase()+v.slice(1),v)):kokoro.map(([v,label])=>new Option(label,v))));
 voice.value=selected==='kitten'?'rosie':kokoro[0][0];
 if(modeField)modeField.hidden=selected==='kitten';
 note(selected==='kitten'?'Kitten Nano selected. Press Test Live E.D.D.i. to load the engine and hear its voice.':'Kokoro selected. Existing diagnostics and voice tests are available.');
}
family.addEventListener('change',choose);
stop.addEventListener('click',e=>{if(family.value!=='kitten')return;e.stopImmediatePropagation();reset();note('Test stopped.')},true);
start.addEventListener('click',async e=>{
 if(family.value!=='kitten')return;
 e.stopImmediatePropagation();
 reset();
 const s={cancelled:false,urls:[],started:performance.now()};active=s;
 family.disabled=true;voice.disabled=true;start.disabled=true;stop.disabled=false;
 const voiceName=voice.value;
 const sample=$('stream-chapter')?.value;
 const sentences=sample==='mobile'
 ? ['Welcome aboard Eddi. We are testing the Kitten voice engine on this device.']
 : ['Welcome aboard Eddi, your free AI book reader.','The adventure begins with a single page, a quiet room, and an extraordinary story.','Now we are listening for clear pronunciation, natural pacing, and any silence between passages.','This experiment runs inside Eddi’s Lab and does not change the live reader.'];
 try{
  note('Loading Kitten Nano model and '+voiceName+' voice…');
  worker=new Worker('./kitten-worker.js');
  worker.onmessage=ev=>{const m=ev.data||{},p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);m.type==='error'?p.reject(Error(m.message)):p.resolve(m)};
  worker.onerror=ev=>{note('Worker error: '+(ev.message||'unknown'));reset()};
  await call('init','',voiceName);
  if(s.cancelled)return;
  note('Model ready. Generating speech…');
  const clips=[];
  for(let i=0;i<sentences.length&&!s.cancelled;i++){
   const t=performance.now(),result=await call('generate',sentences[i],voiceName);
   if(s.cancelled)return;
   const url=URL.createObjectURL(new Blob([result.data],{type:'audio/wav'}));
   s.urls.push(url);clips.push(url);
   note('Generated passage '+(i+1)+'/'+sentences.length+' in '+((performance.now()-t)/1000).toFixed(1)+'s');
  }
  if(s.cancelled)return;
  let index=0;
  const playNext=async()=>{
   if(s.cancelled)return;
   if(index>=clips.length){note('Test complete. All '+clips.length+' passages played.');reset();return}
   audio.src=clips[index++];
   try{await audio.play();note('Playing passage '+index+' of '+clips.length)}catch(err){note('Audio ready; tap play on the audio bar (browser permission required).')}
  };
  audio.onended=()=>{if(active===s)playNext()};
  await playNext();
 }catch(err){if(!s.cancelled){note('Kitten test failed: '+err.message);reset()}}
},true);
choose();
})();
