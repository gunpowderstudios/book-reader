/* Chapter & Verse v1.2.2 — Kokoro narration controller (main thread).
   Speech is generated inside kokoro-worker.js, a Web Worker, so this page never runs the model itself.
   One generation at a time; stale requests are dropped; every finished clip is cached. */
(()=>{'use strict';
const VERSION='1.2.2';
const VOICES={bm_george:'George — British male'}; /* add more Kokoro voice ids here later; the Test tab picks them up */
const DEFAULT_VOICE='bm_george';
const MAX_TEST_CHARS=300;            /* keeps a sample well inside Kokoro's ~510-token limit */
const CACHE_MAX_BYTES=48*1024*1024;  /* generated audio kept in memory (LRU) */
const INIT_TIMEOUT=150000,GENERATE_TIMEOUT=180000; /* worker silence limits before we give up and restart it */
const $=id=>document.getElementById(id);
const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
const mb=n=>Math.round(n/1048576);
const CANCELLED=new Error('Cancelled');
const status=s=>{const el=$('status');if(el)el.textContent=s};
const rate=()=>Number($('rate')&&$('rate').value)||1;

/* ───────── Worker client ───────── */
let worker=null,readyPromise=null,initWaiter=null,engineReady=false,watchdog=null,nextId=1,sink=null;
const calls=new Map();

function armWatchdog(){
 clearTimeout(watchdog);watchdog=null;
 if(!initWaiter&&!calls.size)return;
 watchdog=setTimeout(()=>failWorker(new Error('George stopped responding. Press Play to try again.')),initWaiter?INIT_TIMEOUT:GENERATE_TIMEOUT);
}
function failWorker(err){
 clearTimeout(watchdog);watchdog=null;
 const w=worker;worker=null;readyPromise=null;engineReady=false;
 try{if(w)w.terminate()}catch(_){}
 const iw=initWaiter;initWaiter=null;if(iw)iw.reject(err);
 const pending=[...calls.values()];calls.clear();pending.forEach(c=>c.reject(err));
}
function onWorkerMessage(w,m){
 if(w!==worker)return;
 switch(m.type){
  case 'stage':
   if(sink)sink(m.stage==='library'?'Loading George: fetching the speech library…':m.stage==='warmup'?'Loading George: starting the voice engine…':'Loading George: downloading the voice model…');
   break;
  case 'progress':
   if(sink)sink('Loading George: '+(m.total?Math.round(m.loaded/m.total*100):0)+'% ('+mb(m.loaded)+' of '+mb(m.total)+' MB)');
   break;
  case 'ready':{engineReady=true;const iw=initWaiter;initWaiter=null;if(iw)iw.resolve(m.ms);break}
  case 'init-error':failWorker(new Error('George could not load: '+m.message));return;
  case 'audio':{const c=calls.get(m.id);if(c){calls.delete(m.id);c.resolve(m)}break}
  case 'error':{const c=calls.get(m.id);if(c){calls.delete(m.id);c.reject(new Error(m.message))}else console.error('Kokoro worker:',m.message);break}
 }
 armWatchdog();
}
function startWorker(){
 if(worker)return worker;
 let w;
 try{w=new Worker('kokoro-worker.js?v='+VERSION,{type:'module'})}
 catch(e){throw new Error('This browser cannot run George in the background (module Web Workers are not supported).')}
 w.onmessage=ev=>onWorkerMessage(w,ev.data||{});
 w.onerror=ev=>{if(w!==worker)return;if(ev&&ev.preventDefault)ev.preventDefault();failWorker(new Error('George could not start'+(ev&&ev.message?': '+ev.message:' (the worker script failed to load).')))};
 w.onmessageerror=()=>{if(w===worker)failWorker(new Error('George sent data the page could not read.'))};
 return worker=w;
}
function ready(){
 if(readyPromise)return readyPromise;
 let w;try{w=startWorker()}catch(e){return Promise.reject(e)}
 readyPromise=new Promise((resolve,reject)=>{initWaiter={resolve,reject};w.postMessage({type:'init',voice:DEFAULT_VOICE})});
 readyPromise.catch(()=>{});
 armWatchdog();
 return readyPromise;
}
function call(msg){
 return new Promise((resolve,reject)=>{
  if(!worker){reject(new Error('George is not running. Press Play to try again.'));return}
  const id=nextId++;calls.set(id,{resolve,reject});worker.postMessage({...msg,id});armWatchdog();
 });
}

/* ───────── Audio helpers and cache ───────── */
function toWav(f32,hz){ /* 16-bit mono PCM: half the size of the library's float32 WAV */
 const n=f32.length,v=new DataView(new ArrayBuffer(44+n*2));
 const tag=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};
 tag(0,'RIFF');v.setUint32(4,36+n*2,true);tag(8,'WAVE');tag(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
 v.setUint32(24,hz,true);v.setUint32(28,hz*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);tag(36,'data');v.setUint32(40,n*2,true);
 for(let i=0;i<n;i++){const s=Math.max(-1,Math.min(1,f32[i]));v.setInt16(44+i*2,s<0?s*32768:s*32767,true)}
 return new Blob([v.buffer],{type:'audio/wav'});
}
const cache=new Map();let cacheBytes=0;
function cacheGet(k){const v=cache.get(k);if(v){cache.delete(k);cache.set(k,v)}return v}
function cachePut(k,v){
 const old=cache.get(k);if(old){cacheBytes-=old.blob.size;cache.delete(k)}
 cache.set(k,v);cacheBytes+=v.blob.size;
 while(cacheBytes>CACHE_MAX_BYTES&&cache.size>1){const first=cache.keys().next().value;cacheBytes-=cache.get(first).blob.size;cache.delete(first)}
}

/* ───────── Generation queue ───────── */
const queue=[];let busy=false;
function synth(rawText,voice,opts={}){
 const text=norm(rawText),key=voice+'|'+text,hit=cacheGet(key);
 if(hit)return Promise.resolve({blob:hit.blob,audioSec:hit.audioSec,cached:true});
 return new Promise((resolve,reject)=>{queue.push({key,text,voice,stale:opts.stale||(()=>false),onGenerate:opts.onGenerate,resolve,reject});pump()});
}
async function pump(){
 if(busy)return;busy=true;
 try{
  while(queue.length){
   const job=queue.shift();
   if(job.stale()){job.reject(CANCELLED);continue}
   const hit=cacheGet(job.key);
   if(hit){job.resolve({blob:hit.blob,audioSec:hit.audioSec,cached:true});continue}
   try{
    await ready();
    if(job.stale()){job.reject(CANCELLED);continue}
    if(job.onGenerate)job.onGenerate();
    const r=await call({type:'generate',text:job.text,voice:job.voice});
    const blob=toWav(r.samples,r.rate),audioSec=r.samples.length/r.rate;
    cachePut(job.key,{blob,audioSec}); /* cached even if the user pressed Stop meanwhile */
    job.resolve({blob,audioSec,genSec:r.ms/1000,cached:false});
   }catch(e){job.reject(e)}
  }
 }finally{busy=false}
}

/* ───────── One shared <audio> element ───────── */
const player=new Audio();let playerURL=null,silenceURL=null,endPlay=null;
function releasePlayer(){
 player.onended=null;player.onerror=null;
 try{player.pause()}catch(_){}
 player.removeAttribute('src');try{player.load()}catch(_){}
 if(playerURL){URL.revokeObjectURL(playerURL);playerURL=null}
}
function unlockAudio(){ /* call from a click: lets Safari/iOS allow playback that starts after generation */
 try{
  if(!silenceURL)silenceURL=URL.createObjectURL(toWav(new Float32Array(240),24000));
  if(playerURL)return;
  player.src=silenceURL;const p=player.play();if(p&&p.catch)p.catch(()=>{});
 }catch(_){}
}
function playBlob(blob){ /* resolves true when finished, false if stopped */
 return new Promise((resolve,reject)=>{
  releasePlayer();
  playerURL=URL.createObjectURL(blob);player.src=playerURL;
  const r=rate();player.defaultPlaybackRate=r;player.playbackRate=r; /* set after src: loading a new source resets the rate */
  const clear=()=>{endPlay=null;player.onended=null;player.onerror=null};
  const finish=ok=>{clear();resolve(ok)};
  endPlay=finish;
  player.onended=()=>finish(true);
  player.onerror=()=>{clear();reject(new Error('The browser could not play this audio.'))};
  const p=player.play();
  if(p&&p.catch)p.catch(e=>{
   if(endPlay!==finish||(e&&e.name==='AbortError'))return; /* AbortError = we paused or stopped on purpose */
   clear();reject(new Error(e&&e.name==='NotAllowedError'?'The browser blocked audio playback — press Play again.':'Audio playback failed: '+((e&&e.message)||e)));
  });
 });
}

/* ───────── Stop (shared by the Test tab and the book reader) ───────── */
let serial=0,session=null,testState='idle';
function stop(){
 serial++;
 if(session){session.cancelled=true;if(session.wake)session.wake();session=null}
 sink=null;
 if(endPlay)endPlay(false);
 releasePlayer();
 if(testActive())setTest('idle','Stopped.');
}

/* ───────── Test a Voice ───────── */
const testActive=()=>testState==='loading'||testState==='generating'||testState==='playing';
function setTest(state,msg){
 testState=state;
 const btn=$('test-play');if(btn){btn.textContent=state==='idle'||state==='error'?'▶ Play sample':'■ Stop';btn.dataset.state=state}
 const el=$('test-status');if(el){el.textContent=msg;el.dataset.state=state}
 status(msg);
}
const testVoiceId=()=>($('test-voice')&&$('test-voice').value)||DEFAULT_VOICE;
async function testVoice(raw){
 stop();
 const token=serial,stale=()=>token!==serial,voice=testVoiceId(),text=norm(raw).slice(0,MAX_TEST_CHARS);
 if(!text){setTest('error','Type some sample text first.');return}
 unlockAudio();
 try{
  if(cacheGet(voice+'|'+text))setTest('generating','Using cached audio…');
  else if(!engineReady){
   setTest('loading','Loading George… (first visit downloads the voice model once; your browser keeps it afterwards)');
   sink=t=>{if(!stale())setTest('loading',t)};
  }else setTest('generating','Generating speech… the page stays responsive, and you can press Stop.');
  const res=await synth(text,voice,{stale,onGenerate:()=>{if(!stale()){sink=null;setTest('generating','Generating speech… the page stays responsive, and you can press Stop.')}}});
  if(stale())return;
  const info=res.cached?'cached, so it started instantly':'generated '+res.audioSec.toFixed(1)+' s of speech in '+res.genSec.toFixed(1)+' s';
  setTest('playing','Playing — '+info+'.');
  const finished=await playBlob(res.blob);
  if(stale()||!finished)return;
  setTest('idle','Finished — '+info+'. Press Play again to hear it from the cache.');
 }catch(e){
  if(e===CANCELLED||stale())return;
  releasePlayer();sink=null;
  setTest('error','Voice test failed: '+(e&&e.message||e));
 }
}
function stopTest(){stop();if(testState==='error')setTest('idle','Ready.')}

/* ───────── Book narration (unchanged behaviour; speech now comes from the worker) ───────── */
function chunks(str){
 const words=str.match(/\S+\s*/g)||[],out=[];let text='';
 for(let w of words){if(text.length+w.length>190&&text){out.push(text.trim());text=''}while(w.length>190){out.push(w.slice(0,190));w=w.slice(190)}text+=w}
 if(text.trim())out.push(text.trim());return out;
}
async function unpause(s){
 while(s.paused&&!s.cancelled)await new Promise(resolve=>{s.wake=resolve});
 s.wake=null;
}
async function playback(blob,s){
 await unpause(s);if(s.cancelled)return;
 await playBlob(blob);
}
function toggle({S,update,render}){
 if(session&&!session.cancelled){
  session.paused=!session.paused;S.playing=!session.paused;
  $('play').textContent=session.paused?'▶ Resume':'Ⅱ Pause';
  if(session.paused){player.pause();status('Paused')}
  else{if(session.wake)session.wake();if(playerURL&&player.paused)player.play().catch(e=>{if(e&&e.name!=='AbortError')status('Playback error: '+e.message)});status('Reading with George')}
  return;
 }
 stop();const token=serial,s={cancelled:false,paused:false,wake:null};session=s;
 const stale=()=>s.cancelled||token!==serial;
 S.playing=true;S.paused=false;$('play').textContent='Ⅱ Pause';
 unlockAudio();
 (async()=>{
  try{
   if(!engineReady){status('Loading George… (first visit downloads the voice model once)');sink=t=>{if(!stale())status(t)}}
   while(!stale()&&S.index<S.chapters.length){
    await unpause(s);if(stale())return;
    const chapter=S.chapters[S.index];if(!chapter)break;
    if(S.p>=chapter.paragraphs.length){
     if(S.index===S.chapters.length-1){status('Finished book');break}
     S.index++;S.p=0;render();continue;
    }
    const paragraph=S.p,parts=chunks(chapter.paragraphs[paragraph]);
    for(const part of parts){
     await unpause(s);if(stale())return;
     if(engineReady)status('George is preparing audio…'); /* otherwise keep the model-loading message until generation starts */
     const res=await synth(part,DEFAULT_VOICE,{stale,onGenerate:()=>{if(!stale()){sink=null;status('George is preparing audio…')}}});
     if(stale())return;
     status('George is reading…');
     await playback(res.blob,s);
     if(stale())return;
    }
    S.p=paragraph+1;update();
   }
  }catch(e){if(!stale()&&e!==CANCELLED)status('George encountered an error: '+e.message)}
  finally{if(!s.cancelled&&token===serial){stop();S.playing=false;S.paused=false;$('play').textContent='▶ Play'}}
 })();
}

/* ───────── Test panel wiring ───────── */
(function wireTestPanel(){
 const sel=$('test-voice');
 if(sel){sel.replaceChildren(...Object.entries(VOICES).map(([id,label])=>new Option(label,id)));sel.value=DEFAULT_VOICE;sel.hidden=Object.keys(VOICES).length<2}
 const ta=$('test-text'),count=$('test-count');
 if(ta&&count){const update=()=>{count.textContent=ta.value.length+' / '+MAX_TEST_CHARS};ta.addEventListener('input',update);update()}
})();
window.chapterKokoro={toggle,stop,testVoice,stopTest,testActive,version:VERSION};
})();
