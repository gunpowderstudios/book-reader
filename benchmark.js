/* Book Reader 1.5.1: voluntary diagnostic only. Never auto-start generation. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
let running=false;
const samples=[
 'Across the silent courtyard, the last torch flickered while the guards listened to footsteps beyond the heavy iron gate.',
 'The captain raised his lantern. Far above, an owl called twice, and the distant thunder answered across the sleeping hills.',
 'At sunrise the traveller found the bridge deserted. A cold wind crossed the river, carrying the scent of autumn leaves.'
];
const say=s=>{const e=$('bench-result');if(e)e.textContent=s};
function modeLabel(){const m=window.chapterKokoro?.getMode?.();return m==='fast'?'Fast':m==='gpu'?'GPU':'Standard'}
function time(f){return (f/1000).toFixed(1)+'s'}
async function run(){
 if(running)return;
 const k=window.chapterKokoro;if(!k){say('George is not ready. Refresh and try again.');return}
 running=true;$('bench-run').disabled=true;window.chapterApp?.stop?.();window.bookOffline?.stopAudio?.();
 let maxLag=0,lagEvents=0,prev=performance.now();
 const interval=setInterval(()=>{const n=performance.now(),lag=Math.max(0,n-prev-250);prev=n;maxLag=Math.max(maxLag,lag);if(lag>300)lagEvents++},250);
 const timing=[],started=performance.now();
 try{
  say('Benchmarking '+modeLabel()+' mode: loading the model, then generating three short speech samples. Keep this page open.');
  // These generated samples are reusable, but the first benchmark on a mode times its actual work.
  for(let i=0;i<samples.length;i++){
   say('Benchmark '+(i+1)+'/3: preparing speech in '+modeLabel()+' mode…');
   const a=performance.now();
   const res=await k.generateClip(samples[i]);
   const elapsed=performance.now()-a;
   const hdr=new DataView(await res.blob.slice(0,44).arrayBuffer());
   const hz=hdr.getUint32(24,true);
   const duration=hz>0?(res.blob.size-44)/2/hz:0;
   timing.push({elapsed,duration,cached:!!res.cached});
  }
  const t=timing.filter(x=>!x.cached);
  const secs=t.reduce((s,x)=>s+x.duration,0),work=t.reduce((s,x)=>s+x.elapsed/1000,0);
  const speed=work>0?secs/work:0;
  const cacheNote=t.length!==3?'Some samples came from cache; rerun with fresh text to measure uncached generation. ':'';
  const verdict=speed>=1.35?'Suitable for read-ahead at normal speed.':speed>=1?'Near real time; a larger buffer may help.':'Slower than real-time playback; prepare the chapter first for uninterrupted listening.';
  say('Mode: '+modeLabel()+' | Real speech generated: '+secs.toFixed(1)+'s | Generation rate: '+(t.length?speed.toFixed(2)+'× real time':'all cached')+' | Total elapsed (including model start): '+time(performance.now()-started)+' | Long UI stalls: '+lagEvents+' | Worst UI delay: '+Math.round(maxLag)+'ms. '+cacheNote+verdict);
 }catch(e){say('Benchmark stopped: '+e.message+'. If memory failed, try Standard mode.')}
 finally{clearInterval(interval);running=false;$('bench-run').disabled=false}
}
function setup(){const b=$('bench-run');if(b)b.onclick=run}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();