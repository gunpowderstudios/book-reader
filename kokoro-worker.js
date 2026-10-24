/* Chapter & Verse v1.4.1 — Kokoro inference worker.
   Model download, phonemising and ONNX inference all run here, off the page's main thread,
   so the interface stays responsive while George is generating speech.
   Protocol (main -> worker): {type:'init',voice,mode} · {type:'generate',id,text,voice}
   Protocol (worker -> main): stage · progress · net · ready · init-error{mode} · audio · error */
const KOKORO_URL='https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js';
const MODEL_ID='onnx-community/Kokoro-82M-v1.0-ONNX';
/* standard: 8-bit model, one core (~92 MB).  fast: full-precision model, all cores when the page is
   cross-origin isolated (~326 MB).  gpu: full-precision model on the graphics card (~326 MB, experimental). */
const MODES={standard:{device:'wasm',dtype:'q8'},fast:{device:'wasm',dtype:'fp32'},gpu:{device:'webgpu',dtype:'fp32'}};

let lib=null,tts=null,loading=null,chain=Promise.resolve(),preparedVoices=new Set();
const say=(m,transfer)=>self.postMessage(m,transfer||[]);
const describe=e=>String((e&&e.message)||e||'Unknown error');

/* ───── Count the bytes that really come over the network (cache hits do not count) ───── */
const net={bytes:0};let lastNet=0;
function postNet(force){const now=Date.now();if(!force&&now-lastNet<250)return;lastNet=now;say({type:'net',bytes:net.bytes+moduleBytes()})}
function moduleBytes(){ /* script/module/wasm loads that bypass fetch(); only counted when the browser reports a real transfer */
 try{let n=0;for(const e of performance.getEntriesByType('resource'))if(e.initiatorType!=='fetch'&&e.initiatorType!=='xmlhttprequest'&&e.transferSize>0)n+=e.transferSize;return n}catch(_){return 0}
}
if(typeof self.fetch==='function'&&typeof TransformStream==='function'){
 const origFetch=self.fetch.bind(self);
 self.fetch=async function(input,init){
  const res=await origFetch(input,init);
  try{
   if(!res.body||!res.ok)return res;
   const counter=new TransformStream({
    transform(chunk,ctl){net.bytes+=chunk.byteLength;postNet(false);ctl.enqueue(chunk)},
    flush(){postNet(true)}
   });
   const wrapped=new Response(res.body.pipeThrough(counter),{status:res.status,statusText:res.statusText,headers:res.headers});
   try{Object.defineProperty(wrapped,'url',{value:res.url})}catch(_){}
   try{Object.defineProperty(wrapped,'redirected',{value:res.redirected})}catch(_){}
   return wrapped;
  }catch(_){return res}
 };
}

/* ───── Model download progress: one figure across all files, led by the big model file ───── */
const files=new Map();let lastProgress=0;
function onProgress(p){
 if(!p||!p.file)return;
 if(p.status==='progress'&&p.total)files.set(p.file,{loaded:p.loaded,total:p.total});
 else if(p.status==='done'){const f=files.get(p.file);if(f)f.loaded=f.total}
 else return;
 const now=Date.now();if(p.status!=='done'&&now-lastProgress<150)return;lastProgress=now;
 let loaded=0,total=0,big=false;
 for(const f of files.values())if(f.total>1048576)big=true;
 for(const f of files.values()){if(big&&f.total<=1048576)continue;loaded+=f.loaded;total+=f.total}
 say({type:'progress',loaded,total,file:p.file});
 postNet(false);
}

async function build(mode,voice){
 const o=MODES[mode];
 files.clear();
 say({type:'stage',stage:'model',mode});
 const model=await lib.KokoroTTS.from_pretrained(MODEL_ID,{dtype:o.dtype,device:o.device,progress_callback:onProgress});
 say({type:'stage',stage:'voice',voice,mode});
 /* A tiny first generation fetches the voice file, starts the phonemiser and initialises ONNX now,
    so any failure shows up as a clear loading error (or a fallback) instead of mid-playback. */
 await model.generate('Ready.',{voice});
 preparedVoices.add(voice);
 return model;
}

function load(voice,mode){
 /* Tries exactly the requested mode. A failed attempt can leave WebAssembly memory held by this worker, so any
    fallback to a lighter mode is done by the page in a brand-new worker (see init-error.next). */
 if(!loading)loading=(async()=>{
  const t0=Date.now();
  if(!MODES[mode])mode='standard';
  say({type:'stage',stage:'library'});
  lib=await import(KOKORO_URL);
  if(mode==='gpu'){
   if(!self.navigator||!self.navigator.gpu)throw new Error('WebGPU is not available in this browser');
   if(!(await self.navigator.gpu.requestAdapter()))throw new Error('no compatible graphics adapter was found');
  }
  /* Threads must be chosen explicitly: Standard is always single-threaded (even on an isolated page, where the
     library would otherwise pick several threads and need far more memory). */
  try{
   const cores=(self.navigator&&self.navigator.hardwareConcurrency)||2;
   const wasm=lib.env&&lib.env.backends&&lib.env.backends.onnx&&lib.env.backends.onnx.wasm;
   if(wasm)wasm.numThreads=mode==='fast'&&self.crossOriginIsolated===true?Math.max(1,Math.min(4,Math.ceil(cores/2))):1;
  }catch(_){}
  tts=await build(mode,voice);
  return {ms:Date.now()-t0,mode,isolated:self.crossOriginIsolated===true,cores:(self.navigator&&self.navigator.hardwareConcurrency)||0};
 })().catch(e=>{loading=null;throw e});
 return loading;
}

self.onmessage=ev=>{
 const m=ev.data||{};
 if(m.type==='init'){
  load(m.voice,m.mode||'standard').then(info=>{postNet(true);say({type:'ready',...info})},e=>say({type:'init-error',message:describe(e),mode:m.mode||'standard'}));
 }else if(m.type==='generate'){
  /* One generation at a time; requests simply wait their turn. */
  chain=chain.then(async()=>{
   try{
    await load(m.voice,m.mode||'standard');
    const t0=Date.now();
    if(!preparedVoices.has(m.voice))say({type:'voice-start',voice:m.voice});
    const out=await tts.generate(m.text,{voice:m.voice});
    if(!preparedVoices.has(m.voice)){preparedVoices.add(m.voice);say({type:'voice-ready',voice:m.voice})}
    let samples=out.audio;
    if(samples.byteOffset!==0||samples.byteLength!==samples.buffer.byteLength)samples=samples.slice();
    say({type:'audio',id:m.id,samples,rate:out.sampling_rate,ms:Date.now()-t0},[samples.buffer]);
   }catch(e){say({type:'error',id:m.id,message:describe(e)})}
  });
 }
};
self.addEventListener('unhandledrejection',e=>{say({type:'error',id:0,message:describe(e.reason)})});
