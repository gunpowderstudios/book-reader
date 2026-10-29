/* E.D.D.i mobile Kitten speech adapter v1.12.129.
   Preserves the original reader/library UI; loads the Kitten worker on first Play. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
let worker=null,initPromise=null,seq=0,pending=new Map(),generation=null,session=null,audio=null,url=null,voiceReady=false;
const cancelled=()=>Object.assign(new Error('Cancelled'),{cancelled:true});
function request(type,text,voice){
 return new Promise((resolve,reject)=>{const id=++seq;const timeout=setTimeout(()=>{if(!pending.has(id))return;pending.delete(id);reject(Error(type==='init'?'Kitten voice took too long to load. Try again or use the original reader.':'Kitten narration timed out. Try again.'))},type==='init'?60000:90000);pending.set(id,{resolve:v=>{clearTimeout(timeout);resolve(v)},reject:e=>{clearTimeout(timeout);reject(e)}});
 try{worker.postMessage({id,type,text,voice})}catch(e){pending.delete(id);reject(e)}
 });
}
function ready(){
 if(initPromise)return initPromise;
 initPromise=(async()=>{
  worker=new Worker('lab/kitten-worker.js?v=1.12.123');
  worker.onmessage=e=>{const m=e.data||{},p=pending.get(m.id);if(!p)return;pending.delete(m.id);m.type==='error'?p.reject(Error(m.message||'Kitten failed')):p.resolve(m)};
  worker.onerror=e=>{for(const p of pending.values())p.reject(Error(e.message||'Kitten worker error'));pending.clear();initPromise=null;worker?.terminate();worker=null};
  await request('init');voiceReady=true;return true;
 })().catch(e=>{initPromise=null;worker?.terminate();worker=null;throw e});
 return initPromise;
}
function clearAudio(){if(audio){audio.pause();audio.removeAttribute('src');audio.load();audio=null}if(url){URL.revokeObjectURL(url);url=null}}
function stop(){setLoading(false);if(session)session.cancelled=true;session=null;clearAudio();const p=$('play');if(p)p.textContent='▶ Play'}
const say=t=>{const el=$('status');if(el)el.textContent=t};
function toggle({S,update,render}){
 if(session&&!session.cancelled){if(!audio){say('Loading narration — please wait…');return}if(audio){if(audio.paused){audio.play().then(()=>{S.paused=false;$('play').textContent='⏸ Pause'}).catch(e=>say(e.message))}else{audio.pause();S.paused=true;$('play').textContent='▶ Resume'}}else {session.cancelled=true;session=null;S.playing=false;S.paused=false;$('play').textContent='▶ Play'}return}
 if(!S.chapters?.length)return;
 let task={cancelled:false};session=task;S.playing=true;S.paused=false;$('play').textContent='◌ Loading…';
 const loop=async()=>{
  try{
   setLoading(true,'Loading Kitten voice…');say('Loading Kitten voice…');await ready();if(task.cancelled)return;
   while(!task.cancelled&&S.chapters[S.index]){
    const paras=S.chapters[S.index].paragraphs||[];
    if(S.p>=paras.length){if(S.index+1>=S.chapters.length){say('Finished reading');break}S.index++;S.p=0;render();continue}
    const passage=String(paras[S.p]||'').trim();if(!passage){S.p++;update();continue}
    setLoading(true,'Loading narration…');say('Loading narration for paragraph '+(S.p+1)+'…');
    const result=await request('generate',passage,$('voice')?.value||'rosie');
    if(task.cancelled)return;
    clearAudio();url=URL.createObjectURL(new Blob([result.data],{type:'audio/wav'}));audio=new Audio(url);
    const a=audio;a.playbackRate=Number($('rate')?.value)||1;
    // Highlight/position updates remain owned by the existing reader.
    window.readerTracking?.start?.(passage,S.p,()=>a.duration?Math.min(1,a.currentTime/a.duration):0);
    setLoading(false);$('play').textContent='⏸ Pause';say('Reading with Kitten');
    await new Promise((resolve,reject)=>{a.onended=resolve;a.onerror=()=>reject(Error('Audio playback failed'));a.play().catch(reject)});
    if(task.cancelled)return;
    window.readerTracking?.clear?.();clearAudio();S.p++;update();
   }
  }catch(e){if(!task.cancelled)say('Kitten narration error: '+e.message)}
  finally{setLoading(false);if(session===task){session=null;S.playing=false;S.paused=false;clearAudio();$('play').textContent='▶ Play'}}
 };void loop();
}
function skipSeconds(seconds,S,update){if(!S?.chapters?.length)return;const n=S.chapters[S.index].paragraphs.length;if(audio&&Number.isFinite(audio.duration)&&audio.duration){const t=audio.currentTime+seconds;if(t>=0&&t<audio.duration){audio.currentTime=t;return}}const was=!!session&&!session.cancelled;stop();S.p=Math.max(0,Math.min(n-1,S.p+(seconds<0?-1:1)));update();if(was)toggle({S,update,render:window.chapterApp?.render})}
function prefetch(S){if(voiceReady||initPromise||!S?.chapters?.length)return;setLoading(true,'Loading Kitten voice…');say('Loading Kitten voice…');ready().then(()=>{if(!session){setLoading(false);say('Kitten voice ready. Press Play to start narration.')}}).catch(e=>{if(!session){setLoading(false);say('Kitten voice could not load: '+e.message)}})}
window.chapterKokoro={toggle,stop,skipSeconds,prefetch,refreshNarrator:()=>{},stopTest:()=>{},version:'kitten-mobile-1.12.129',isMobile:()=>true};
const KITTEN_VOICES=['Rosie','Bella','Jasper','Luna','Bruno','Hugo','Kiki','Leo'];
function setLoading(on,message){const bar=$('kitten-loading');if(bar){bar.hidden=!on;const label=bar.querySelector('span');if(label&&message)label.textContent=message;}const button=$('play');if(on&&button&&session&&!session.cancelled)button.textContent='◌ Loading…';}
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
function initKittenUI(){
 const host=$('mobile-audiobook')||$('playback-panel');
 if(host&&!$('kitten-loading')){const bar=document.createElement('div');bar.id='kitten-loading';bar.hidden=true;bar.setAttribute('role','status');bar.setAttribute('aria-live','polite');bar.innerHTML='<span>Preparing narration…</span><div class="kitten-loading-track"><i></i></div>';const play=$('mobile-book-play');if(play&&play.parentElement===host)play.insertAdjacentElement('afterend',bar);else host.insertBefore(bar,host.firstChild);}
 setupVoices();
 // Legacy page initialisation may run later; reapply once after it completes.
 setTimeout(setupVoices,250);setTimeout(setupVoices,1000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initKittenUI,{once:true});else initKittenUI();
})();