/* E.D.D.i mobile Kitten speech adapter v1.12.120.
   Preserves the original reader/library UI; loads the Kitten worker on first Play. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
let worker=null,initPromise=null,seq=0,pending=new Map(),generation=null,session=null,audio=null,url=null;
const cancelled=()=>Object.assign(new Error('Cancelled'),{cancelled:true});
function request(type,text,voice){
 return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});
 try{worker.postMessage({id,type,text,voice})}catch(e){pending.delete(id);reject(e)}
 });
}
function ready(){
 if(initPromise)return initPromise;
 initPromise=(async()=>{
  worker=new Worker('lab/kitten-worker.js?v=1.12.123');
  worker.onmessage=e=>{const m=e.data||{},p=pending.get(m.id);if(!p)return;pending.delete(m.id);m.type==='error'?p.reject(Error(m.message||'Kitten failed')):p.resolve(m)};
  worker.onerror=e=>{for(const p of pending.values())p.reject(Error(e.message||'Kitten worker error'));pending.clear();initPromise=null;worker?.terminate();worker=null};
  await request('init');return true;
 })().catch(e=>{initPromise=null;worker?.terminate();worker=null;throw e});
 return initPromise;
}
function clearAudio(){if(audio){audio.pause();audio.removeAttribute('src');audio.load();audio=null}if(url){URL.revokeObjectURL(url);url=null}}
function stop(){if(session)session.cancelled=true;session=null;clearAudio();const p=$('play');if(p)p.textContent='▶ Play'}
const say=t=>{const el=$('status');if(el)el.textContent=t};
function toggle({S,update,render}){
 if(session&&!session.cancelled){if(audio){if(audio.paused){audio.play().then(()=>{S.paused=false;$('play').textContent='⏸ Pause'}).catch(e=>say(e.message))}else{audio.pause();S.paused=true;$('play').textContent='▶ Resume'}}else {session.cancelled=true;session=null;S.playing=false;S.paused=false;$('play').textContent='▶ Play'}return}
 if(!S.chapters?.length)return;
 let task={cancelled:false};session=task;S.playing=true;S.paused=false;$('play').textContent='⏸ Pause';
 const loop=async()=>{
  try{
   say('Preparing Kitten voice…');await ready();if(task.cancelled)return;
   while(!task.cancelled&&S.chapters[S.index]){
    const paras=S.chapters[S.index].paragraphs||[];
    if(S.p>=paras.length){if(S.index+1>=S.chapters.length){say('Finished reading');break}S.index++;S.p=0;render();continue}
    const passage=String(paras[S.p]||'').trim();if(!passage){S.p++;update();continue}
    say('Kitten is preparing narration…');
    const result=await request('generate',passage,$('voice')?.value||'rosie');
    if(task.cancelled)return;
    clearAudio();url=URL.createObjectURL(new Blob([result.data],{type:'audio/wav'}));audio=new Audio(url);
    const a=audio;a.playbackRate=Number($('rate')?.value)||1;
    // Highlight/position updates remain owned by the existing reader.
    window.readerTracking?.start?.(passage,S.p,()=>a.duration?Math.min(1,a.currentTime/a.duration):0);
    say('Reading with Kitten');
    await new Promise((resolve,reject)=>{a.onended=resolve;a.onerror=()=>reject(Error('Audio playback failed'));a.play().catch(reject)});
    if(task.cancelled)return;
    window.readerTracking?.clear?.();clearAudio();S.p++;update();
   }
  }catch(e){if(!task.cancelled)say('Kitten narration error: '+e.message)}
  finally{if(session===task){session=null;S.playing=false;S.paused=false;clearAudio();$('play').textContent='▶ Play'}}
 };void loop();
}
function skipSeconds(seconds,S,update){if(!S?.chapters?.length)return;const n=S.chapters[S.index].paragraphs.length;if(audio&&Number.isFinite(audio.duration)&&audio.duration){const t=audio.currentTime+seconds;if(t>=0&&t<audio.duration){audio.currentTime=t;return}}const was=!!session&&!session.cancelled;stop();S.p=Math.max(0,Math.min(n-1,S.p+(seconds<0?-1:1)));update();if(was)toggle({S,update,render:window.chapterApp?.render})}
window.chapterKokoro={toggle,stop,skipSeconds,prefetch:()=>{},refreshNarrator:()=>{},stopTest:()=>{},version:'kitten-mobile-1.12.123',isMobile:()=>true};
const KITTEN_VOICES=['Rosie','Bella','Jasper','Luna','Bruno','Hugo','Kiki','Leo'];
function setupVoices(){
 const voice=$('voice');
 if(voice){
  let selected='rosie';
  try{selected=localStorage.getItem('br-kitten-voice')||'rosie'}catch(_){}
  voice.replaceChildren(...KITTEN_VOICES.map(name=>new Option('Kitten — '+name,name.toLowerCase())));
  voice.value=KITTEN_VOICES.some(n=>n.toLowerCase()===selected)?selected:'rosie';
  voice.disabled=false;
  const update=()=>{try{localStorage.setItem('br-kitten-voice',voice.value)}catch(_){}
    const label=$('engine-narrator');if(label)label.textContent='Kitten — '+voice.selectedOptions[0]?.textContent?.replace('Kitten — ','');
  };
  voice.addEventListener('change',update);
  update();
 }
 const mode=$('mode-select');if(mode){mode.replaceChildren(new Option('Kitten (Mobile)','kitten'));mode.disabled=true}
}
document.addEventListener('DOMContentLoaded',()=>setTimeout(setupVoices,0));
})();