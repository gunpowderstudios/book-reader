/* E.D.D.i. Piper Voice Lab — isolated experimental worker, never used by Kokoro. */
const PACKAGE='https://esm.sh/@mintplex-labs/piper-tts-web@1.0.5?bundle';
self.onmessage=async e=>{
 const m=e.data||{};if(m.type!=='generate')return;
 const send=(type,other={})=>self.postMessage({type,...other});
 try{
  send('status',{message:'Loading the Piper browser engine…'});
  const tts=await import(PACKAGE);
  send('status',{message:'Loading voice model and generating speech…'});
  const callback=p=>{
   if(!p||!Number.isFinite(p.loaded)||!Number.isFinite(p.total)||p.total<=0)return;
   send('progress',{percent:Math.max(0,Math.min(100,Math.round(p.loaded/p.total*100)))});
  };
  const wav=await tts.predict({text:m.text,voiceId:m.voiceId},callback);
  if(!(wav instanceof Blob))throw Error('Piper did not return an audio file.');
  const data=await wav.arrayBuffer();
  if(data.byteLength<44)throw Error('The audio file was empty.');
  const view=new DataView(data),hz=view.getUint32(24,true),channels=view.getUint16(22,true),bits=view.getUint16(34,true);
  const seconds=hz&&channels&&bits?Math.max(0,data.byteLength-44)/(hz*channels*bits/8):0;
  self.postMessage({type:'result',data,seconds},[data]);
 }catch(err){send('error',{message:String(err?.message||err)})}
};