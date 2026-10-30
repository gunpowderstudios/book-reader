/* Mobile test ONLY. Built from live v1.12.112 UI. Never loaded by the production reader. */
(()=>{'use strict';
const list=['bella','jasper','luna','bruno','rosie','hugo','kiki','leo'];
const $=id=>document.getElementById(id);
const voice=$('voice'),play=$('play');
if(!voice||!play)return;
const engine=document.createElement('select');engine.id='eddi-test-engine';engine.setAttribute('aria-label','Speech engine');
engine.append(new Option('Kokoro','kokoro'),new Option('Kitten','kitten'));
voice.before(engine);
const kokoroChoices=Array.from(voice.options).map(o=>[o.value,o.textContent]);
const originalVoice=voice.value;
const status=$('status');
let w=null,requests=new Map(),nextId=0,session=null,loading=null;
const player=new Audio();player.preload='auto';
function msg(s){if(status)status.textContent=s}
function cleanup(){if(!session)return;session.cancelled=true;session.queue.forEach(q=>URL.revokeObjectURL(q.url));session.queue=[];session=null;player.pause();player.removeAttribute('src');player.load();play.textContent='▶ Play';}
function dispose(){cleanup();if(w){w.terminate();w=null}for(const r of requests.values())r.reject(Error('Engine stopped'));requests.clear();loading=null}
function call(type,text,chosenVoice,timeout=90000){
 return new Promise((resolve,reject)=>{
  if(!w)return reject(Error('Kitten engine unavailable'));
  const id=++nextId;const timer=setTimeout(()=>{requests.delete(id);reject(Error('Kitten '+type+' timed out'))},timeout);
  requests.set(id,{resolve:v=>{clearTimeout(timer);resolve(v)},reject:e=>{clearTimeout(timer);reject(e)}});
  w.postMessage({id,type,text,voice:chosenVoice});
 });
}
async function ready(){
 if(w&&loading)return loading;
 w=new Worker(new URL('lab/kitten-worker.js',document.baseURI));
 w.onmessage=e=>{const m=e.data||{},r=requests.get(m.id);if(!r)return;requests.delete(m.id);m.type==='error'?r.reject(Error(m.message)):r.resolve(m)};
 w.onerror=e=>{msg('Kitten worker failed: '+(e.message||'Unknown error'));dispose()};
 loading=call('init','',null,30000).then(()=>true).catch(err=>{dispose();throw err});
 return loading;
}
function updateVoice(){
 dispose();
 voice.replaceChildren();
 if(engine.value==='kitten'){for(const v of list)voice.add(new Option('Kitten — '+v.charAt(0).toUpperCase()+v.slice(1),v));voice.value='rosie';msg('Kitten Nano ready to load. Select a book and press Play.');}
 else{for(const [id,label] of kokoroChoices)voice.add(new Option(label,id));voice.value=originalVoice;msg('Kokoro selected.');}
}
engine.addEventListener('change',()=>{try{window.chapterKokoro?.stop?.()}catch(_){}updateVoice()});
const kokoro=()=>window.chapterKokoro;
let installed=false;
function install(){
 const k=kokoro();if(!k||installed)return false;
 installed=true;
 const origToggle=k.toggle.bind(k),origStop=k.stop.bind(k),origSkip=k.skipSeconds?.bind(k);
 k.toggle=function(ctx){if(engine.value!=='kitten')return origToggle(ctx);return kittenToggle(ctx)};
 k.stop=function(...args){dispose();return origStop(...args)};
 if(origSkip)k.skipSeconds=function(delta,...args){if(engine.value!=='kitten')return origSkip(delta,...args);const s=session;if(!s)return;const shift=delta>=0?1:-1;const pos=Math.max(0,Math.min(s.parts.length-1,s.next+shift));dispose();s.S.p=pos;s.update();msg('Moved to paragraph '+(pos+1)+'. Press Play.');};
 return true;
}
let attempts=0;const boot=setInterval(()=>{if(install()||++attempts>150)clearInterval(boot)},100);
async function kittenToggle({S,update}){
 if(session){if(!player.paused){player.pause();S.paused=true;S.playing=false;play.textContent='▶ Resume';return}
 if(session.queue.length){S.paused=false;S.playing=true;play.textContent='⏸ Pause';player.play().catch(e=>msg('Tap Play again: '+e.message));return}
 }
 dispose();
 const chapter=S.chapters[S.index];if(!chapter?.paragraphs?.length)return msg('Open an EPUB first.');
 const s={S,update,cancelled:false,parts:chapter.paragraphs,queue:[],next:S.p,playingIndex:-1,producing:false,voice:voice.value};session=s;
 S.playing=true;S.paused=false;play.textContent='Preparing…';play.disabled=true;msg('Kitten: loading Nano engine and first speech…');
 try{
  await ready();
  if(s.cancelled)return;
  s.producing=true;
  generate(s);
 }catch(e){if(session===s){dispose();msg('Kitten could not start: '+e.message);play.disabled=false}}
}
async function generate(s){
 try{
  while(!s.cancelled&&s.next<s.parts.length){
   if(s.queue.length>3){await new Promise(res=>setTimeout(res,250));continue}
   const idx=s.next++,sentence=s.parts[idx];
   if(!sentence||!sentence.trim())continue;
   const m=await call('generate',sentence,s.voice,90000);
   if(s.cancelled)return;
   const blob=new Blob([m.data],{type:'audio/wav'});
   const url=URL.createObjectURL(blob);
   const q={idx,url};s.queue.push(q);
   if(s.playingIndex<0&&s.queue.length>=2){play.disabled=false;play.textContent='▶ Play Kitten';msg('Kitten buffered '+s.queue.length+' passages. Press Play.');s.playingIndex=-2;}
  }
 }catch(e){if(!s.cancelled)msg('Kitten generation issue: '+e.message)}
 finally{s.producing=false;if(!s.cancelled&&s.queue.length&&s.playingIndex===-1){play.disabled=false;play.textContent='▶ Play Kitten';}}
}
function startItem(s){
 if(s.cancelled)return;
 const q=s.queue[0];
 if(!q){if(!s.producing){msg('Chapter complete.');play.textContent='▶ Play';s.S.playing=false;cleanup();}else{msg('Kitten buffering next passage…');setTimeout(()=>{if(session===s)startItem(s)},300)}return}
 s.playingIndex=q.idx;s.S.p=q.idx;s.S.playing=true;s.update();
 player.src=q.url;play.textContent='⏸ Pause';
 player.play().catch(e=>{play.textContent='▶ Play';msg('Press Play to allow audio: '+e.message)});
}
player.addEventListener('ended',()=>{const s=session;if(!s)return;const old=s.queue.shift();if(old)URL.revokeObjectURL(old.url);startItem(s)});
player.addEventListener('error',()=>{if(session)msg('Kitten playback error. Try Play again.')});
play.addEventListener('click',e=>{
 if(engine.value!=='kitten')return;
 if(!session||session.cancelled)return;
 if(session.playingIndex===-2||session.playingIndex===-1){e.stopImmediatePropagation();startItem(session);}
},true);
voice.addEventListener('change',()=>{if(engine.value==='kitten')dispose()});
window.addEventListener('pagehide',dispose);
})();