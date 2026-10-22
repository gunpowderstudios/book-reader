/* Chapter & Verse v1.1.3 — stability-first Kokoro narration.
   Only one generation at a time, no background synthesis or unbounded queues. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
let engine=null,loading=null,session=null,audio=null,audioURL=null,serial=0;
function status(s){$('status').textContent=s}
function cleanAudio(){if(audio){audio.pause();audio.onended=null;audio.onerror=null;audio.removeAttribute('src');audio=null}if(audioURL){URL.revokeObjectURL(audioURL);audioURL=null}}
function stop(){
 serial++;if(session){session.cancelled=true;session.wake?.();session.done?.();session=null}
 cleanAudio();
}
async function getEngine(){
 if(engine)return engine;
 if(!loading)loading=(async()=>{
  status('Loading George (first-time model download may take a while)…');
  const {KokoroTTS}=await import('https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js');
  const t=await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX',{dtype:'q8',device:'wasm',progress_callback:p=>{
   if(p.status==='progress'&&p.progress!=null)status('Loading George: '+Math.round(p.progress)+'%');
  }});
  engine=t;return t;
 })().catch(e=>{loading=null;throw e});
 return loading;
}
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
 cleanAudio();audioURL=URL.createObjectURL(blob);audio=new Audio(audioURL);
 audio.playbackRate=Number($('rate').value)||1;
 await unpause(s);if(s.cancelled)return;
 await new Promise((resolve,reject)=>{
  s.done=resolve;audio.onended=resolve;audio.onerror=()=>reject(new Error('Audio playback failed'));
  audio.play().catch(reject);
 });
 s.done=null;cleanAudio();
}
function toggle({S,update,render}){
 if(session&&!session.cancelled){
  session.paused=!session.paused;S.playing=!session.paused;
  $('play').textContent=session.paused?'▶ Resume':'Ⅱ Pause';
  if(session.paused){audio?.pause();status('Paused')}
  else {session.wake?.();if(audio?.paused)audio.play().catch(e=>status('Playback error: '+e.message));status('Reading with George')}
  return;
 }
 stop();const token=serial,s={cancelled:false,paused:false,wake:null,done:null};session=s;
 S.playing=true;S.paused=false;$('play').textContent='Ⅱ Pause';
 (async()=>{
  try{
   const tts=await getEngine();if(s.cancelled||token!==serial)return;
   while(!s.cancelled&&token===serial&&S.index<S.chapters.length){
    await unpause(s);if(s.cancelled)return;
    const chapter=S.chapters[S.index];if(!chapter)break;
    if(S.p>=chapter.paragraphs.length){
     if(S.index===S.chapters.length-1){status('Finished book');break}
     S.index++;S.p=0;render();continue;
    }
    const paragraph=S.p,parts=chunks(chapter.paragraphs[paragraph]);
    for(const part of parts){
     await unpause(s);if(s.cancelled)return;
     status('George is preparing audio…');
     const generated=await tts.generate(part,{voice:'bm_george'});
     if(s.cancelled)return;
     status('George is reading…');
     await playback(generated.toBlob(),s);
     if(s.cancelled)return;
    }
    S.p=paragraph+1;update();
   }
  }catch(e){if(!s.cancelled)status('George encountered an error: '+e.message)}
  finally{if(!s.cancelled&&token===serial){stop();S.playing=false;S.paused=false;$('play').textContent='▶ Play'}}
 })();
}
window.chapterKokoro={toggle,stop};
})();
