/* Chapter & Verse Kokoro local narrator. Uses the public Kokoro 82M model; no API key. */
(()=>{'use strict';
let model=null,loading=null,audio=null,url=null,run=0,paused=false,generating=false;
const $=id=>document.getElementById(id);
function message(s){$('status').textContent=s}
function release(){if(audio){audio.pause();audio.onended=null;audio.onerror=null;audio.src='';audio=null}if(url){URL.revokeObjectURL(url);url=null}}
function stop(){run++;paused=false;generating=false;release()}
async function load(){
 if(model)return model;
 if(!loading)loading=(async()=>{
  message('Preparing George… downloading the browser-compatible model.');
  const {KokoroTTS}=await import('https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js');
  const t=await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX',{
   dtype:'q8',device:'wasm',progress_callback:p=>{
    if(p.status==='progress'&&p.progress!=null)message('Downloading George model: '+Math.round(p.progress)+'%');
   }
  });
  model=t;return t;
 })().catch(e=>{loading=null;throw e});
 return loading;
}
function pieces(s){let words=s.match(/\S+\s*/g)||[s],out=[],part='';for(const w of words){if(part.length+w.length>230&&part){out.push(part.trim());part=''}part+=w}if(part.trim())out.push(part.trim());return out}
function toggle({S,update,render}){
 if(paused&&audio){paused=false;S.playing=true;audio.play().catch(e=>message('Audio blocked: '+e.message));$('play').textContent='Ⅱ Pause';message('Reading with George');return}
 if(S.playing){paused=true;S.playing=false;audio?.pause();$('play').textContent='▶ Resume';message('Paused');return}
 stop();S.playing=true;S.paused=false;$('play').textContent='Ⅱ Pause';const id=run;
 (async()=>{
  try{
   const engine=await load();if(id!==run)return;
   while(id===run&&S.playing){
    let chapter=S.chapters[S.index];if(!chapter)break;
    if(S.p>=chapter.paragraphs.length){
     if(S.index>=S.chapters.length-1){message('Finished book');break}
     S.index++;S.p=0;render();chapter=S.chapters[S.index];
    }
    const current=S.p,parts=pieces(chapter.paragraphs[current]);
    for(const text of parts){
     if(id!==run)return;
     message('George is narrating…');generating=true;
     const output=await engine.generate(text,{voice:'bm_george'});
     generating=false;if(id!==run)return;
     url=URL.createObjectURL(output.toBlob());audio=new Audio(url);
     audio.playbackRate=Number($('rate').value)||1;
     if(!S.playing&&paused){ // Paused while synthesising: wait for resume.
       await new Promise(resolve=>{const check=setInterval(()=>{if(id!==run||S.playing){clearInterval(check);resolve()}},120)});
       if(id!==run)return;
     }
     await new Promise((resolve,reject)=>{
      audio.onended=resolve;audio.onerror=()=>reject(new Error('Audio playback failed'));
      audio.play().catch(reject);
     });
     release();
    }
    if(id!==run)return;
    S.p=current+1;update();
   }
  }catch(e){if(id===run)message('George could not load: '+e.message)}
  finally{if(id===run){stop();S.playing=false;S.paused=false;$('play').textContent='▶ Play'}}
 })();
}
window.chapterKokoro={toggle,stop};
})();
