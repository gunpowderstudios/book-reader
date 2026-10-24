/* Chapter & Verse v1.4.1 — Kokoro narration controller (main thread).
   Speech is generated inside kokoro-worker.js, a Web Worker, so this page never runs the model itself.
   One generation at a time; stale requests are dropped; every finished clip is cached.
   While you listen (or pause) it keeps generating ahead, up to a chosen number of minutes. */
(()=>{'use strict';
const VERSION='1.9.3';
const VOICES={bm_george:'British Male — George',bf_emma:'British Female — Emma',am_eric:'American Male — Eric',af_aoede:'American Female — Aoede'}; /* add more Kokoro voice ids here later; the Test tab picks them up */
const DEFAULT_VOICE='bm_george';
const currentVoice=()=>{const v=document.getElementById('voice')?.value;return VOICES[v]?v:DEFAULT_VOICE};
const narratorName=()=>({bm_george:'George',bf_emma:'Emma',am_eric:'Eric',af_aoede:'Aoede'})[currentVoice()]||'George';
const named=s=>String(s).replaceAll('George',narratorName());
const MODES={
 standard:{label:'Standard — lower memory',mb:92},
 fast:{label:'Fast — recommended when supported',mb:326},
 gpu:{label:'GPU — experimental',mb:326}
};
const MAX_TEST_CHARS=300;            /* keeps a sample well inside Kokoro's ~510-token limit */
const CACHE_MAX_BYTES=96*1024*1024;  /* generated audio kept in memory (LRU) */
const MAX_PENDING=2,MAX_AHEAD=400;   /* passages queued in the worker at once / held ahead of playback */
const INIT_TIMEOUT=300000,GENERATE_TIMEOUT=180000; /* worker silence limits before we give up and restart it */
const $=id=>document.getElementById(id);
const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
const fmtMB=n=>(n/1048576).toFixed(n<10485760?1:0)+' MB';
const fmtDur=s=>{s=Math.max(0,Math.round(s));return s>=60?Math.floor(s/60)+'m '+String(s%60).padStart(2,'0')+'s':s+'s'};
const CANCELLED=new Error('Cancelled');
const status=s=>{const el=$('status');if(el)el.textContent=named(s)};
const rate=()=>Number($('rate')&&$('rate').value)||1;
const store={
 get(k,d){try{const v=localStorage.getItem(k);return v==null?d:v}catch(_){return d}},
 set(k,v){try{localStorage.setItem(k,v)}catch(_){}}
};

/* ───────── Settings ───────── */
const mobileDevice=()=>/iPad|iPhone|iPod|Android/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const suggestedMode=()=>mobileDevice()?'standard':'fast';
let preference=store.get('cv-mode-choice',store.get('cv-mode','')||'auto');
if(!['auto','fast','standard'].includes(preference))preference='auto';
let mode=preference==='auto'?suggestedMode():preference;
const bufferTarget=()=>{const m=Number(store.get('cv-buffer','6'));return (m>0&&m<=30?m:6)*60};
const installed=()=>store.get('cv-ready-'+mode,'')==='1';
const isolated=()=>typeof crossOriginIsolated!=='undefined'&&crossOriginIsolated===true;

/* ───────── Engine state and the download bar ───────── */
const eng={phase:'idle',loaded:0,total:0,net:0,used:null,sec:0,isolated:false,cores:0,note:'',error:''};
const modeName=m=>(MODES[m]||MODES.standard).label;
function describeEngine(){
 if(eng.used==='gpu')return 'on your graphics card';
 if(eng.used==='fast')return eng.isolated?(n=>'using '+n+(n===1?' core':' cores'))(Math.min(4,Math.ceil((eng.cores||2)/2))):'one core only (multi-core is not active on this page)';
 return 'one core';
}
function renderEngine(){
 const text=$('eng-text'),fill=$('eng-fill'),bar=$('eng-bar'),netEl=$('net-text');
 if(!text&&!netEl)return;
 let pct=0,msg,state=eng.phase;
 switch(eng.phase){
  case 'library':pct=2;msg='Fetching the speech library…';break;
  case 'downloading':
   pct=eng.total?Math.min(100,eng.loaded/eng.total*100):0;
   msg='Loading George: '+fmtMB(eng.loaded)+' of '+(eng.total?fmtMB(eng.total):'?')+' ('+Math.round(pct)+'%)';break;
  case 'starting':pct=0;msg='Starting the voice engine…';break;
  case 'voice':pct=0;msg='Preparing '+narratorName()+'’s voice…';break;
  case 'ready':pct=100;msg='George is ready — '+modeName(eng.used)+', '+describeEngine()+', started in '+eng.sec.toFixed(1)+' s';break;
  case 'error':pct=100;msg=eng.error||'George could not load.';break;
  default:
   msg=installed()?'George is installed on this device and starts when you press Play.'
    :'George is not loaded yet. He starts when you press Play (a one-off download of about '+MODES[mode].mb+' MB).';
 }
 if(eng.note)msg+=' — '+eng.note;
 if(text)text.textContent=named(msg);
 if(fill){fill.style.width=pct.toFixed(1)+'%'}
 if(bar){bar.dataset.state=state;if(['library','starting','voice'].includes(state)||(state==='downloading'&&!eng.total)){bar.removeAttribute('aria-valuenow');bar.setAttribute('aria-valuetext',named(msg))}else{bar.setAttribute('aria-valuenow',String(Math.round(pct)));bar.removeAttribute('aria-valuetext')}}
 if(netEl){
  let t='Downloaded by George this visit: '+fmtMB(eng.net);
  if(eng.phase==='ready'&&eng.net<1572864)t+=' — nothing new; he loaded from your browser’s saved copy';
  netEl.textContent=named(t);
 }
}
function engineReset(note){Object.assign(eng,{phase:'idle',loaded:0,total:0,net:0,used:null,sec:0,error:'',note:note||''});renderEngine()}

/* ───────── Worker client ───────── */
const FALLBACKS={gpu:'fast',fast:'standard'};
let runMode=null;
let worker=null,readyPromise=null,initWaiter=null,engineReady=false,watchdog=null,nextId=1,sink=null;
const calls=new Map();

function armWatchdog(){
 clearTimeout(watchdog);watchdog=null;
 if(!initWaiter&&!calls.size)return;
 watchdog=setTimeout(()=>failWorker(new Error('George stopped responding. Press Play to try again.')),initWaiter?INIT_TIMEOUT:GENERATE_TIMEOUT);
}
function failWorker(err,silent){
 clearTimeout(watchdog);watchdog=null;
 const w=worker;worker=null;readyPromise=null;engineReady=false;
 try{if(w)w.terminate()}catch(_){}
 const iw=initWaiter;initWaiter=null;if(iw)iw.reject(err);
 const pending=[...calls.values()];calls.clear();pending.forEach(c=>c.reject(err));
 if(!silent){eng.phase='error';eng.error=err.message;renderEngine()}
}
function onWorkerMessage(w,m){
 if(w!==worker)return;
 switch(m.type){
  case 'stage':
   if(m.stage==='library'){eng.phase='library'}
   else if(m.stage==='model'){eng.phase='downloading'}
   else if(m.stage==='warmup'){eng.phase='starting'}
   else if(m.stage==='voice'){eng.phase='voice'}
   renderEngine();
   if(sink)sink(m.stage==='library'?'Loading George: fetching the speech library…':m.stage==='warmup'?'Loading George: starting the voice engine…':m.stage==='voice'?'Preparing '+narratorName()+'’s voice…':'Loading George: downloading the voice model…');
   break;
  case 'progress':
   eng.phase='downloading';eng.loaded=m.loaded;eng.total=m.total;if(typeof m.net==='number')eng.net=m.net;renderEngine();
   if(sink)sink('Loading George: '+(m.total?Math.round(m.loaded/m.total*100):0)+'% ('+fmtMB(m.loaded)+' of '+fmtMB(m.total)+')');
   break;
  case 'net':eng.net=m.bytes;renderEngine();break;
  case 'voice-start':if(m.voice===currentVoice()){eng.phase='voice';renderEngine();status('Preparing '+narratorName()+'’s voice…')}break;
  case 'voice-ready':if(m.voice===currentVoice()){eng.phase='ready';renderEngine()}break;
  case 'ready':{
   engineReady=true;eng.phase='ready';eng.used=m.mode||mode;eng.sec=(m.ms||0)/1000;eng.isolated=!!m.isolated;eng.cores=m.cores||0;
   if(eng.used===mode)eng.note='';
   store.set('cv-ready-'+(m.mode||mode),'1');
   if(m.mode&&m.mode!==mode){store.set('cv-ready-'+mode,'');mode=m.mode;store.set('cv-mode',mode);const sel=$('mode-select');if(sel)sel.value=mode} /* remember the mode that works on this device */
   renderEngine();
   const iw=initWaiter;initWaiter=null;if(iw)iw.resolve(m.ms);break}
  case 'init-error':{
   const from=m.mode||runMode||mode,next=FALLBACKS[from];
   if(next&&initWaiter){ /* lighter mode in a fresh worker (a failed load can leave memory held) */
    const iw=initWaiter;initWaiter=null;
    failWorker(new Error('retry'),true);
    eng.note=modeName(from)+' mode did not work here ('+String(m.message).replace(/^no available backend found\. ERR: /,'')+') — using '+modeName(next)+' instead';
    runMode=next;ready().then(iw.resolve,iw.reject);
    return;
   }
   failWorker(new Error('George could not load: '+m.message));return}
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
 eng.phase='library';eng.error='';eng.loaded=0;eng.total=0;
 if(mode==='fast'&&!isolated()){
  const st=(()=>{try{return sessionStorage.getItem('cv-coi')}catch(_){return null}})();
  eng.note=st==='failed'||st==='unsupported'?'multi-core is not available in this browser, so Fast mode runs on one core':'multi-core is not active on this page';
 }
 renderEngine();
 readyPromise=new Promise((resolve,reject)=>{initWaiter={resolve,reject};w.postMessage({type:'init',voice:currentVoice(),mode:runMode||mode})});
 readyPromise.catch(()=>{});
 armWatchdog();
 return readyPromise;
}
function call(msg){
 return new Promise((resolve,reject)=>{
  if(!worker){reject(new Error('George is not running. Press Play to try again.'));return}
  const id=nextId++;calls.set(id,{resolve,reject});worker.postMessage({...msg,id,mode:runMode||mode});armWatchdog();
 });
}
function haltAll(){ /* stop playback through the page (so its buttons reset), falling back to our own stop */
 if(window.chapterApp&&window.chapterApp.stop)window.chapterApp.stop();else stop();
}
function setMode(next){
 if(!['auto','fast','standard'].includes(next))return mode;
 preference=next;store.set('cv-mode-choice',next);
 const chosen=next==='auto'?suggestedMode():next;
 if(chosen===mode){showRecommendation();return mode}
 mode=chosen;runMode=null;store.set('cv-mode',chosen);
 if(worker||readyPromise)failWorker(new Error('Switching mode'),true);
 cache.clear();cacheBytes=0;recent.length=0;lastSpeed=0; /* clips from another engine are not reused when comparing speed */
 engineReset(next==='fast'&&!isolated()?'multi-core needs a one-time page reload':'');
 if(next==='fast'&&!isolated()&&window.cvIsolation)window.cvIsolation.enable();
 renderBuffer();
 return mode;
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
function trimSilence(f){ /* Kokoro pads each clip with silence; trimming it shortens the gap between passages */
 const T=0.004,pad=480;let a=0,b=f.length;
 while(a<b&&Math.abs(f[a])<T)a++;
 while(b>a&&Math.abs(f[b-1])<T)b--;
 a=Math.max(0,a-pad);b=Math.min(f.length,b+pad*2);
 return b-a<2400?f:f.subarray(a,b);
}
let lastSpeed=0;const recent=[]; /* speed = seconds of speech produced per second of generating (>1 = faster than real time) */
function noteGen(audioSec,genSec){
 if(!(genSec>0))return;
 recent.push({a:audioSec,g:genSec});if(recent.length>8)recent.shift();
 let A=0,G=0;for(const r of recent){A+=r.a;G+=r.g}lastSpeed=G>0?A/G:0;
 try{store.set('cv-measured-'+(eng.used||mode),String(lastSpeed))}catch(_){}
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
 const text=norm(rawText),key=mode+'|'+voice+'|'+text,hit=cacheGet(key);
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
    const pcm=trimSilence(r.samples),blob=toWav(pcm,r.rate),audioSec=pcm.length/r.rate;
    noteGen(audioSec,r.ms/1000);
    cachePut(job.key,{blob,audioSec}); /* cached even if the user pressed Stop meanwhile */
    job.resolve({blob,audioSec,genSec:r.ms/1000,cached:false});
    renderBuffer();
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

/* ───────── Buffer meter (how far ahead George is, and how fast he works) ───────── */
let meterTimer=null,bufInfo={ready:0,target:0,waiting:0,waits:0,waitSec:0};
function hint(){
 const need=Math.max(1,rate()); /* listening at 1.5× needs speech made 1.5× faster than it is spoken */
 if(recent.length<3||lastSpeed>=need)return null;
 const sp=lastSpeed.toFixed(1)+'×';
 if(mode==='standard')return {text:'On this device George makes speech at '+sp+' speaking speed in Standard mode, so pauses are unavoidable. Fast mode is usually about twice as quick on a Mac or PC.',action:'Try Fast mode',to:'fast'};
 if(mode==='fast')return {text:'Even in Fast mode George makes speech at '+sp+' speaking speed here, so pauses will return once the buffer is used up. A graphics card may be quicker, or make a finished audiobook once and listen with no waiting.',action:'Try GPU mode (experimental)',to:'gpu'};
 return {text:'George makes speech at '+sp+' speaking speed here. Making a finished audiobook once avoids any waiting.',action:null};
}
function renderBuffer(){
 const text=$('buf-text'),fill=$('buf-fill'),bar=$('buf-bar'),hintEl=$('speed-hint');
 const active=session&&!session.cancelled;
 const speed=lastSpeed?lastSpeed.toFixed(1)+'× speaking speed':'';
 let msg,state='idle',pct=0;
 if(active){
  const t=bufInfo.target||bufferTarget();
  pct=Math.min(100,bufInfo.ready/t*100);
  if(bufInfo.waiting){state='empty';msg='Waiting for George — nothing buffered yet'}
  else{state=bufInfo.ready<20?'low':'ok';msg='Ready ahead: '+fmtDur(bufInfo.ready)+' of '+fmtDur(t)}
  if(speed)msg+=' · George works at '+speed;
  if(bufInfo.waits)msg+=' · pauses: '+bufInfo.waits+' ('+fmtDur(bufInfo.waitSec)+')';
 }else{
  msg='Read-ahead starts when you press Play (up to '+Math.round(bufferTarget()/60)+' min)'+(speed?' · last measured: George works at '+speed:'');
 }
 if(text)text.textContent=named(msg);
 if(fill)fill.style.width=pct.toFixed(1)+'%';
 if(bar){bar.dataset.state=state;bar.setAttribute('aria-valuenow',String(Math.round(pct)))}
 if(hintEl){
  const h=hint();
  if(h){
   hintEl.hidden=false;hintEl.replaceChildren(document.createTextNode(named(h.text)+' '));
   if(h.action){const b=document.createElement('button');b.textContent=h.action;b.onclick=()=>{haltAll();setMode(h.to);const sel=$('mode-select');if(sel)sel.value=mode};hintEl.append(b)}
  }else hintEl.hidden=true;
 }
}
function tick(){
 if(bufInfo.waiting&&session&&!session.cancelled)status('George is catching up… '+Math.round((Date.now()-bufInfo.waiting)/1000)+' s');
 renderBuffer();
}
function startMeter(){stopMeter();bufInfo={ready:0,target:bufferTarget(),waiting:0,waits:0,waitSec:0};meterTimer=setInterval(tick,500);renderBuffer()}
function stopMeter(){if(meterTimer){clearInterval(meterTimer);meterTimer=null}bufInfo.waiting=0;renderBuffer()}

/* ───────── Stop (shared by the Test tab and the book reader) ───────── */
let serial=0,session=null,testState='idle',prefetchToken=0;
function stop(){
 window.readerTracking?.clear?.();
 serial++;
 if(session){session.cancelled=true;if(session.wake)session.wake();session=null}
 sink=null;
 if(endPlay)endPlay(false);
 releasePlayer();
 stopMeter();
 if(testActive())setTest('idle','Stopped.');
}

/* ───────── Test a Voice ───────── */
const testActive=()=>testState==='loading'||testState==='generating'||testState==='playing';
function setTest(state,msg){
 testState=state;
 const btn=$('test-play');if(btn){btn.textContent=state==='idle'||state==='error'?'▶ Play sample':'■ Stop';btn.dataset.state=state}
 const el=$('test-status');if(el){el.textContent=named(msg);el.dataset.state=state}
 status(msg);
}
const testVoiceId=()=>($('test-voice')&&$('test-voice').value)||DEFAULT_VOICE;
async function testVoice(raw){
 stop();
 const token=serial,stale=()=>token!==serial,voice=testVoiceId(),text=norm(raw).slice(0,MAX_TEST_CHARS);
 if(!text){setTest('error','Type some sample text first.');return}
 unlockAudio();
 try{
  if(cacheGet(mode+'|'+voice+'|'+text))setTest('generating','Using cached audio…');
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

/* ───────── Book narration ───────── */
const CHUNK_MAX=230,FIRST_CHUNK_MAX=140; /* short first passage = faster start */
const ABBR=/\b(?:Mr|Mrs|Ms|Dr|St|Prof|Sr|Jr|vs|etc|No|Mt|Capt|Col|Gen|Lt|Sgt)\.$/;
function sentences(str){
 const raw=str.match(/[^.!?…]+(?:[.!?…]+["'”’)\]]*|$)\s*/g)||[str],out=[];
 for(const x of raw){if(out.length&&ABBR.test(out[out.length-1].trim()))out[out.length-1]+=x;else out.push(x)}
 return out;
}
function splitLong(s,max){ /* only for sentences longer than max: split at commas etc., then at spaces */
 if(s.length<=max)return [s];
 const out=[];let buf='';
 for(let p of s.match(/[^,;:—–]+[,;:—–]*\s*/g)||[s]){
  while(p.length>max){
   const cut=p.lastIndexOf(' ',max),k=cut>max*0.5?cut:max;
   if(buf){out.push(buf.trim());buf=''}
   out.push(p.slice(0,k).trim());p=p.slice(k);
  }
  if(buf&&buf.length+p.length>max){out.push(buf.trim());buf=''}
  buf+=p;
 }
 if(buf.trim())out.push(buf.trim());
 return out;
}
function chunks(str,max=CHUNK_MAX){ /* sentence-aware: passages end where a sentence ends whenever possible */
 const out=[];let buf='';
 for(const sent of sentences(norm(str)))for(const piece of splitLong(sent,max)){
  if(buf&&buf.length+piece.length+1>max){out.push(buf.trim());buf=''}
  buf+=(buf?' ':'')+piece.trim();
 }
 if(buf.trim())out.push(buf.trim());
 return out;
}
function* segments(S){ /* lazily walks the book from the current position */
 let ci=S.index,p=S.p,first=true;
 while(ci<S.chapters.length){
  const ch=S.chapters[ci];
  if(!ch||p>=ch.paragraphs.length){ci++;p=0;continue}
  const parts=chunks(ch.paragraphs[p],first?FIRST_CHUNK_MAX:CHUNK_MAX);first=false;
  for(let k=0;k<parts.length;k++)yield{ci,p,last:k===parts.length-1,text:parts[k]};
  p++;
 }
}
async function unpause(s){
 while(s.paused&&!s.cancelled)await new Promise(resolve=>{s.wake=resolve});
 s.wake=null;
}
async function playback(blob,s){
 await unpause(s);if(s.cancelled)return;
 await playBlob(blob);
}
/* Generate the first few passages before Play is pressed, so reading starts at once.
   Only when George is already installed on this device (never starts a big download by surprise). */
function prefetch(S,count=3){
 if(session&&!session.cancelled)return;
 if(!(engineReady||installed()))return;
 if(!S||!S.chapters||!S.chapters.length)return;
 const my=++prefetchToken,it=segments(S);let n=0;
 for(let r=it.next();!r.done&&n<count;r=it.next(),n++){
  synth(r.value.text,currentVoice(),{stale:()=>my!==prefetchToken||!!session}).catch(()=>{});
 }
}
function toggle({S,update,render}){
 if(session&&!session.cancelled){
  session.paused=!session.paused;S.playing=!session.paused;
  $('play').textContent=session.paused?'▶ Resume':'Ⅱ Pause';
  if(session.paused){player.pause();status('Paused — George keeps preparing the next passages')}
  else{if(session.wake)session.wake();if(playerURL&&player.paused)player.play().catch(e=>{if(e&&e.name!=='AbortError')status('Playback error: '+e.message)});status('Reading with George')}
  return;
 }
 stop();prefetchToken++;
 const token=serial,s={cancelled:false,paused:false,wake:null,voice:currentVoice()};session=s;
 const stale=()=>s.cancelled||token!==serial;
 S.playing=true;S.paused=false;$('play').textContent='Ⅱ Pause';
 unlockAudio();startMeter();
 (async()=>{
  try{
   if(!engineReady){status('Loading George… (first visit downloads the voice model once)');sink=t=>{if(!stale())status(t)}}
   const it=segments(S),ahead=[];let exhausted=false,firstItem=true;
   const readySec=()=>{let t=0;for(const i of ahead)if(i.done&&i.sec)t+=i.sec;return t};
   /* Keep two passages queued in the worker whenever less than the chosen number of minutes is ready ahead.
      Runs again each time a passage finishes, so it carries on while you listen and even while paused. */
   const fill=()=>{
    if(stale())return;
    let pending=0;for(const i of ahead)if(!i.done)pending++;
    const target=bufferTarget();
    while(pending<MAX_PENDING&&!exhausted&&readySec()<target&&ahead.length<MAX_AHEAD){
     const n=it.next();if(n.done){exhausted=true;break}
     const item={seg:n.value,done:false,sec:0};
     item.job=synth(n.value.text,s.voice,{stale,onGenerate:()=>{if(!stale())sink=null}});
     item.job.then(res=>{item.done=true;item.sec=res.audioSec;fill();bufInfo.ready=readySec();renderBuffer()},()=>{item.done=true});
     ahead.push(item);pending++;
    }
    bufInfo.target=target;bufInfo.ready=readySec();
   };
   fill();
   while(!stale()){
    if(!ahead.length)fill();
    const item=ahead.shift();
    if(!item){status('Finished book');break}
    fill();
    await unpause(s);if(stale())return;
    let waitedFrom=0;
    if(!item.done&&engineReady){waitedFrom=Date.now();bufInfo.waiting=waitedFrom;status('George is catching up…');renderBuffer()}
    const res=await item.job;if(stale())return;
    if(waitedFrom){
     const w=(Date.now()-waitedFrom)/1000;bufInfo.waiting=0;
     if(!firstItem&&w>=0.4){bufInfo.waits++;bufInfo.waitSec+=w}
    }
    firstItem=false;
    const g=item.seg;
    if(g.ci!==S.index){S.index=g.ci;S.p=g.p;render()}else if(S.p!==g.p){S.p=g.p;update()}
    status('George is reading…');
    bufInfo.ready=readySec();renderBuffer();
    window.readerTracking?.start?.(g.text,g.p,()=>{const duration=player.duration||res.audioSec;return duration>0?player.currentTime/duration:0});
    await playback(res.blob,s);
    window.readerTracking?.clear?.();
    if(stale())return;
    if(g.last){S.p=g.p+1;update()}
   }
  }catch(e){if(!stale()&&e!==CANCELLED)status('George encountered an error: '+e.message)}
  finally{if(!s.cancelled&&token===serial){stop();S.playing=false;S.paused=false;$('play').textContent='▶ Play'}}
 })();
}

function showRecommendation(){
 const el=$('recommended-speed');if(!el)return;
 const name=mode==='fast'?'Fast':'Low Memory';
 el.textContent=preference==='auto'?'✓ Automatic · '+name+' selected for this device.':'✓ '+name+' selected. You can switch back to Automatic at any time.';
}
/* ───────── Panel wiring ───────── */
(function wirePanels(){
 const sel=$('test-voice');
 if(sel){sel.replaceChildren(...Object.entries(VOICES).map(([id,label])=>new Option(label,id)));sel.value=currentVoice();sel.hidden=Object.keys(VOICES).length<2}
 const ta=$('test-text'),count=$('test-count');
 if(ta&&count){const update=()=>{count.textContent=ta.value.length+' / '+MAX_TEST_CHARS};ta.addEventListener('input',update);update()}
 const ms=$('mode-select');
 if(ms){
  ms.replaceChildren(new Option('Automatic (recommended)','auto'),new Option('Fast — for powerful computers','fast'),new Option('Low Memory — for phones and older devices','standard'));
  ms.value=preference;ms.onchange=()=>{haltAll();setMode(ms.value);ms.value=preference;showRecommendation()};
 }
 const bs=$('buffer-select');
 if(bs){bs.value=String(Math.round(bufferTarget()/60));if(bs.value!==String(Math.round(bufferTarget()/60)))bs.value='6';bs.onchange=()=>{store.set('cv-buffer',bs.value);renderBuffer()}}
 renderEngine();renderBuffer();showRecommendation();
})();
window.chapterKokoro={toggle,stop,testVoice,stopTest,testActive,prefetch,setMode,getMode:()=>mode,recommendMode:suggestedMode,isMobile:mobileDevice,generateClip:(text,id)=>synth(text,VOICES[id]?id:currentVoice()),currentVoice,voices:VOICES,splitText:(text)=>chunks(text),version:VERSION,
 refreshNarrator:()=>{renderEngine();renderBuffer()},stats:()=>({speed:lastSpeed,engine:{...eng},buffer:{...bufInfo},mode}),measured:()=>Number(store.get('cv-measured-'+mode,'0'))};
})();
