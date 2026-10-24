/* Book Reader v1.5.2 — local diagnostic log; no book text is captured. */
(()=>{'use strict';
const rows=[];let last='',lastAt=0;
const stamp=()=>new Date().toLocaleTimeString();
function log(message,level='info'){
 const msg=String(message||'').trim();if(!msg)return;
 const now=Date.now();if(msg===last&&now-lastAt<2000)return;
 last=msg;lastAt=now;
 rows.push({time:stamp(),level,message:msg});if(rows.length>250)rows.shift();
 draw();
}
function draw(){
 const e=document.getElementById('activity-lines');if(!e)return;
 const atBottom=e.scrollTop+e.clientHeight>=e.scrollHeight-50;
 e.replaceChildren();
 for(const r of rows){const line=document.createElement('div');line.className='log-'+r.level;line.textContent='['+r.time+'] '+r.message;e.append(line)}
 if(atBottom)e.scrollTop=e.scrollHeight;
 const count=document.getElementById('activity-count');if(count)count.textContent=rows.length+' events';
}
function statusWatch(id,label){const el=document.getElementById(id);if(!el)return;
 let old=el.textContent.trim();if(old)log(label+': '+old);
 new MutationObserver(()=>{const current=el.textContent.trim();if(current&&current!==old){old=current;log(label+': '+current,/error|failed|stopp|out of memory|could not/i.test(current)?'error':'info')}}).observe(el,{childList:true,subtree:true,characterData:true});
}
function init(){
 const ids=[['eng-text','George'],['status','Reader'],['buf-text','Buffer'],['offline-status','Preparation'],['bench-result','Benchmark'],['test-status','Voice test']];
 for(const [id,name] of ids)statusWatch(id,name);
 document.getElementById('activity-clear')?.addEventListener('click',()=>{rows.length=0;last='';draw();log('Log cleared')});
 document.getElementById('activity-copy')?.addEventListener('click',async()=>{
  const output='Book Reader diagnostics (no book content)\n'+rows.map(x=>'['+x.time+'] '+x.level.toUpperCase()+': '+x.message).join('\n');
  try{await navigator.clipboard.writeText(output);log('Log copied to clipboard')}
  catch(_){const t=document.createElement('textarea');t.value=output;document.body.append(t);t.select();try{document.execCommand('copy');log('Log copied to clipboard')}catch(e){log('Could not copy log: '+e.message,'error')}t.remove()}
 });
 window.addEventListener('error',e=>log('JavaScript error: '+e.message,'error'));
 window.addEventListener('unhandledrejection',e=>log('Promise error: '+String(e.reason?.message||e.reason),'error'));
 log('Diagnostics started. Logging model, buffer, playback, preparation and benchmark activity.');
}
window.bookLog=log;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
