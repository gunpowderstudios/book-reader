/* E.D.D.i. Piper reader adapter. Models are fetched by exact reviewed upstream revision. */
'use strict';
const REV='2f358b6a560e3a913ebf509b2f3344f20b367f94';
const BASE='https://huggingface.co/rhasspy/piper-voices/resolve/'+REV+'/en/';
const WASM='https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/';
const ORT='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/';
const VOICES={
 'en_GB-alba-medium':'en_GB/alba/medium',
 'en_GB-cori-medium':'en_GB/cori/medium',
 'en_GB-jenny_dioco-medium':'en_GB/jenny_dioco/medium',
 'en_US-joe-medium':'en_US/joe/medium'
};
let config,session,phonemizerData,phonemizerBinary,active='',first=true;
const send=(type,detail={})=>self.postMessage({type,...detail});
async function modelFile(name){
 const url=BASE+name;
 // Do not reuse the lab's cache, which can contain the older model with the same name.
 const cache=await self.caches?.open('eddi-piper-'+REV).catch(()=>null);
 const saved=await cache?.match(url).catch(()=>null);
 if(saved)return saved;
 const response=await fetch(url);
 if(!response.ok)throw Error('Piper download returned HTTP '+response.status);
 if(!name.endsWith('.onnx')){
  if(cache)await cache.put(url,response.clone()).catch(()=>{});
  return response;
 }
 const total=Number(response.headers.get('content-length'))||0;
 let loaded=0,last=0;
 const tap=new TransformStream({transform(chunk,ctrl){
  loaded+=chunk.byteLength;
  if(loaded-last>256*1024||loaded===total){send('progress',{loaded,total,net:loaded});last=loaded}
  ctrl.enqueue(chunk);
 }});
 const stream=new Response(response.body.pipeThrough(tap),{headers:response.headers});
 const save=cache?cache.put(url,stream.clone()).catch(()=>{}):Promise.resolve();
 const buffer=await stream.arrayBuffer();
 await save;
 return new Response(buffer);
}
async function init(voice){
 const id=voice.replace(/^piper:/,'');
 if(!Object.hasOwn(VOICES,id))throw Error('Unknown Piper voice.');
 const name=VOICES[id]+'/'+id+'.onnx';
 send('stage',{stage:'library'});
 if(!self.ort)importScripts(ORT+'ort.wasm.min.js');
 if(!self.createPiperPhonemize)importScripts(WASM+'piper_phonemize.js');
 ort.env.wasm.wasmPaths=ORT;
 ort.env.wasm.numThreads=1;
 send('stage',{stage:'model'});
 const asset=async file=>{const r=await fetch(WASM+file);if(!r.ok)throw Error('Piper speech support download returned HTTP '+r.status);return r.arrayBuffer()};
 const [json,model,data,binary]=await Promise.all([modelFile(name+'.json'),modelFile(name),asset('piper_phonemize.data'),asset('piper_phonemize.wasm')]);
 phonemizerData=data;phonemizerBinary=binary;
 config=await json.json();
 send('stage',{stage:'warmup'});
 session=await ort.InferenceSession.create(await model.arrayBuffer(),{executionProviders:['wasm']});
 active=voice;first=true;
}
function phonemeIds(phones,model){
 const map=model.phoneme_id_map, clusters=(model.vowel_clusters||[]).slice().sort((a,b)=>b.length-a.length);
 const ids=[...map['^'],...map['_']];
 for(let i=0;i<phones.length;){
  const cluster=clusters.find(c=>c.every((p,j)=>phones[i+j]===p));
  const phone=cluster?cluster.join(''):phones[i];
  i+=cluster?cluster.length:1;
  if(map[phone])ids.push(...map[phone],...map['_']);
 }
 ids.push(...map['$']);
 return ids;
}
async function phonemize(text){
 const input=JSON.stringify([{text}]);let phones;
 const module=await createPiperPhonemize({
  print:line=>{try{const data=JSON.parse(line);if(Array.isArray(data.phonemes))phones=data.phonemes}catch(_){}},
  getPreloadedPackage:()=>phonemizerData,
  wasmBinary:phonemizerBinary,
  locateFile:file=>WASM+file
 });
 module.callMain(['-l',config.espeak.voice,'--allow-missing-phonemes','--input',input,'--espeak_data','/espeak-ng-data']);
 if(!phones?.length)throw Error('Piper could not turn this passage into speech sounds.');
 return phonemeIds(phones,config);
}
async function generate(m){
 if(m.voice!==active||!session)throw Error('Piper voice is not loaded.');
 const start=performance.now(),ids=await phonemize(m.text);
 const opts=config.inference,speed=Math.max(.5,Math.min(2,Number(m.speed)||1));
 const int=(data)=>new ort.Tensor('int64',BigInt64Array.from(data,BigInt),[data.length]);
 const inputs={
  input:new ort.Tensor('int64',BigInt64Array.from(ids,BigInt),[1,ids.length]),
  input_lengths:int([ids.length]),
  scales:new ort.Tensor('float32',Float32Array.of(opts.noise_scale,opts.length_scale/speed,opts.noise_w),[3])
 };
 if(session.inputNames.includes('sid'))inputs.sid=int([0]);
 const output=await session.run(inputs),samples=output.output.data,rate=config.audio.sample_rate;
 if(!(samples instanceof Float32Array)||!samples.length)throw Error('Piper returned no audio.');
 self.postMessage({type:'audio',id:m.id,samples,rate,ms:performance.now()-start,cold:first},[samples.buffer]);
 first=false;
}
self.onmessage=async ({data:m})=>{
 const start=performance.now();
 try{
  if(m.type==='init'){await init(m.voice);send('ready',{mode:'piper',threads:1,ms:performance.now()-start})}
  else if(m.type==='generate')await generate(m);
 }catch(e){send(m.type==='init'?'piper-init-error':'error',{id:m.id,message:e?.message||String(e)})}
};
