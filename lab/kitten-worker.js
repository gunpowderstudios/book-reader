/* E.D.D.i. Kitten EPUB Lab worker v1.6 — experimental on iOS Safari. */
'use strict';
self.window=self;
let tts=null;
const sdk='https://cdn.jsdelivr.net/gh/KittenML/KittenTTS-web@main/examples/html/assets/kittentts-web.js';
async function init(){
 if(tts)return;
 importScripts(sdk);
 if(!self.KittenTTSWeb?.KittenTTS)throw Error('KittenTTSWeb not exposed in worker');
 tts=await self.KittenTTSWeb.KittenTTS.create({model:'nano-int8',analytics:false});
}
self.onmessage=async function(event){
 const {id,type,text}=event.data||{};
 try{
  if(type==='init'){await init();self.postMessage({id,type:'ready'});return}
  if(type==='generate'){
   await init();
   const start=performance.now(),result=await tts.generate(text,{voice:'rosie'});
   const raw=result.wavData(),arr=raw instanceof Uint8Array?raw:new Uint8Array(raw);
   const bytes=arr.slice();
   self.postMessage({id,type:'generated',data:bytes.buffer,sampleRate:result.sampleRate,seconds:(performance.now()-start)/1000},[bytes.buffer]);
  }
 }catch(error){self.postMessage({id,type:'error',message:String(error&&error.message||error),stack:String(error&&error.stack||'').slice(0,700)})}
};
