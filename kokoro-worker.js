/* Chapter & Verse v1.3.0 — Kokoro inference worker.
   Model download, phonemising and ONNX inference all run here, off the page's main thread,
   so the interface stays responsive while George is generating speech.
   Protocol (main -> worker): {type:'init',voice} · {type:'generate',id,text,voice}
   Protocol (worker -> main): stage · progress · ready · init-error · audio · error */
const KOKORO_URL='https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js';
const MODEL_ID='onnx-community/Kokoro-82M-v1.0-ONNX';
const MODEL_OPTIONS={dtype:'q8',device:'wasm'}; /* q8 (~90 MB) is the smallest model that runs well on WASM */

let tts=null,loading=null,chain=Promise.resolve();
const say=(m,transfer)=>self.postMessage(m,transfer||[]);
const describe=e=>String((e&&e.message)||e||'Unknown error');

/* Download progress is reported per file by transformers.js; add the files up into one figure. */
const files=new Map();let lastPost=0;
function onProgress(p){
 if(!p||!p.file)return;
 if(p.status==='progress'&&p.total)files.set(p.file,{loaded:p.loaded,total:p.total});
 else if(p.status==='done'){const f=files.get(p.file);if(f)f.loaded=f.total}
 else return;
 const now=Date.now();if(p.status!=='done'&&now-lastPost<150)return;lastPost=now;
 let loaded=0,total=0;for(const f of files.values()){loaded+=f.loaded;total+=f.total}
 say({type:'progress',loaded,total});
}

function load(voice){
 if(!loading)loading=(async()=>{
  const t0=Date.now();
  say({type:'stage',stage:'library'});
  const {KokoroTTS}=await import(KOKORO_URL);
  say({type:'stage',stage:'model'});
  const model=await KokoroTTS.from_pretrained(MODEL_ID,{...MODEL_OPTIONS,progress_callback:onProgress});
  say({type:'stage',stage:'warmup'});
  /* A tiny first generation fetches the voice file, starts the phonemiser and initialises ONNX now,
     so any failure shows up as a clear loading error instead of mid-playback. */
  await model.generate('Ready.',{voice});
  tts=model;
  return {ms:Date.now()-t0};
 })().catch(e=>{loading=null;throw e});
 return loading;
}

self.onmessage=ev=>{
 const m=ev.data||{};
 if(m.type==='init'){
  load(m.voice).then(info=>say({type:'ready',ms:info.ms}),e=>say({type:'init-error',message:describe(e)}));
 }else if(m.type==='generate'){
  /* One generation at a time; requests simply wait their turn. */
  chain=chain.then(async()=>{
   try{
    await load(m.voice);
    const t0=Date.now();
    const out=await tts.generate(m.text,{voice:m.voice});
    let samples=out.audio;
    if(samples.byteOffset!==0||samples.byteLength!==samples.buffer.byteLength)samples=samples.slice();
    say({type:'audio',id:m.id,samples,rate:out.sampling_rate,ms:Date.now()-t0},[samples.buffer]);
   }catch(e){say({type:'error',id:m.id,message:describe(e)})}
  });
 }
};
self.addEventListener('unhandledrejection',e=>{say({type:'error',id:0,message:describe(e.reason)})});
