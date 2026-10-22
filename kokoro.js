/* Chapter & Verse — Kokoro George. Browser-only TTS, with buffered playback. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
let engine=null, loading=null, player=null, objectURL=null, generation=0, active=null;
function status(s){$('status').textContent=s}
function cleanupAudio(){
 if(player){player.pause();player.onended=null;player.onerror=null;player.removeAttribute('src');player.load();player=null}
 if(objectURL){URL.revokeObjectURL(objectURL);objectURL=null}
}
function stop(){
 generation++;
 if(active){active.cancelled=true;active.wake?.();active.resolvePlayback?.();active=null}
 cleanupAudio();
}
async function model(){
 if(engine)return engine;
 if(!loading)loading=(async()=>{
  status('Loading George’s AI voice (first use downloads the model)…');
  const {KokoroTTS}=await import('https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js');
  engine=await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX',{
   dtype:'q8',device:'wasm',progress_callback:p=>{
    if(p.status==='progress'&&p.progress!=null)status('Loading George: '+Math.round(p.progress)+'%');
   }
  });
  return engine;
 })().catch(e=>{loading=null;throw e});
 return loading;
}
function splitParagraph(value){
 const words=value.match(/\S+\s*/g)||[],parts=[];let s='';
 for(const word of words){if(s.length+word.length>380&&s){parts.push(s.trim());s=''}s+=word}
 if(s.trim())parts.push(s.trim());return parts;
}
async function waitForResume(a){
 while(!a.cancelled&&a.paused){
  status('Paused');await new Promise(resolve=>a.wake=resolve);a.wake=null;
 }
}
function toggle({S,update,render}){
 if(active&&!active.cancelled){
  active.paused=!active.paused;S.playing=!active.paused;
  if(active.paused){player?.pause();$('play').textContent='▶ Resume';status('Paused')}
  else{active.wake?.();if(player?.paused)player.play().catch(e=>status('Playback error: '+e.message));$('play').textContent='Ⅱ Pause';status('Reading with George')}
  return;
 }
 stop();
 const token=generation,a={cancelled:false,paused:false,wake:null,resolvePlayback:null};active=a;
 S.playing=true;S.paused=false;$('play').textContent='Ⅱ Pause';
 (async()=>{
  try{
   const tts=await model();if(a.cancelled||token!==generation)return;
   let queue=[],finished=false,producerError=null;
   const wake=()=>{a.queueWake?.();a.queueWake=null};
   const produce=async()=>{
    try{
     let idx=S.index,paragraph=S.p;
     while(!a.cancelled&&token===generation&&idx<S.chapters.length){
      let chapter=S.chapters[idx];
      if(paragraph>=chapter.paragraphs.length){idx++;paragraph=0;continue}
      for(const piece of splitParagraph(chapter.paragraphs[paragraph])){
       if(a.cancelled)return;
       while(queue.length>=3&&!a.cancelled)await new Promise(resolve=>a.producerWake=resolve);
       if(a.cancelled)return;
       status(queue.length?'George is preparing the next passage…':'George is preparing audio…');
       const result=await tts.generate(piece,{voice:'bm_george'});
       if(a.cancelled)return;
       queue.push({blob:result.toBlob(),chapter:idx,paragraph});wake();
      }
      paragraph++;
     }
    }catch(e){producerError=e}
    finally{finished=true;wake()}
   };
   const task=produce();
   while(!a.cancelled&&token===generation){
    await waitForResume(a);if(a.cancelled)return;
    if(!queue.length){
     if(finished)break;
     status('George is preparing the next passage…');
     await new Promise(resolve=>a.queueWake=resolve);a.queueWake=null;continue;
    }
    const next=queue.shift();a.producerWake?.();a.producerWake=null;
    if(S.index!==next.chapter){S.index=next.chapter;S.p=next.paragraph;render()}
    else if(S.p!==next.paragraph){S.p=next.paragraph;update()}
    cleanupAudio();objectURL=URL.createObjectURL(next.blob);player=new Audio(objectURL);
    player.playbackRate=Number($('rate').value)||1;
    await waitForResume(a);if(a.cancelled)return;
    status(queue.length?'George is reading…':'George is reading (buffering the next passage)…');
    await new Promise((resolve,reject)=>{
     a.resolvePlayback=resolve;
     player.onended=resolve;player.onerror=()=>reject(new Error('Audio playback failed'));
     player.play().catch(reject);
    });a.resolvePlayback=null;
   }
   await task;
   if(producerError)throw producerError;
   if(!a.cancelled&&token===generation){status('Finished book');S.p=S.chapters.at(-1).paragraphs.length-1;update()}
  }catch(e){if(!a.cancelled&&token===generation)status('George encountered an error: '+e.message)}
  finally{if(!a.cancelled&&token===generation){stop();S.playing=false;S.paused=false;$('play').textContent='▶ Play'}}
 })();
}
window.chapterKokoro={toggle,stop};
})();
