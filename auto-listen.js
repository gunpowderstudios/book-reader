/* Book Reader v1.6.0 — practical automatic listening advice, no surprise model downloads. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
let previous='';
function update(){
 const k=window.chapterKokoro,el=$('listen-advice');if(!el||!k)return;
 const stats=k.stats(),speed=stats.speed||k.measured(),name=stats.engine.used||stats.mode,buffer=stats.buffer;
 const loading=['library','downloading','starting'].includes(stats.engine.phase);
 let line;
 if(loading)line='George is loading. First use may download '+(name==='standard'?'around 92 MB':'around 326 MB')+'. Later visits usually use the browser cache.';
 else if(!speed)line='George will measure how quickly he narrates during normal listening. No extra benchmark or download is required.';
 else if(speed>=1.35)line='George is generating about '+speed.toFixed(1)+'× real-time speech on this device. Listen Now is recommended.';
 else if(speed>=1)line='George generates about '+speed.toFixed(1)+'× real time. Listen Now should work, but occasional pauses are possible.';
 else line='George generates about '+speed.toFixed(1)+'× real time on this device. For smooth playback, choose Save for Later and prepare the chapter.';
 if(buffer?.waits>0)line+=' Detected '+buffer.waits+' buffering pause'+(buffer.waits===1?'':'s')+'.';
 if(el.textContent!==line){el.textContent=line;if(previous!==line&&speed){window.bookLog?.('Listening advice: '+line);previous=line}}
}
function start(){update();setInterval(update,2500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();