/* Book Reader v1.6.1 — approximate word-following for generated narration.
   Kokoro does not provide word alignment; words advance proportionally to audio time. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
let active=null,timer=null,enabled=true,lastParagraph=null,nextWord=0;
try{enabled=localStorage.getItem('br-highlight')!=='off'}catch(_){}
function clear(){
 if(timer){clearInterval(timer);timer=null}
 if(active?.element){active.element.replaceChildren(document.createTextNode(active.original));active.element.classList.remove('speaking')}
 active=null;
}
function setEnabled(v){enabled=!!v;try{localStorage.setItem('br-highlight',enabled?'on':'off')}catch(_){}if(!enabled)clear();const c=$('highlight-toggle');if(c)c.checked=enabled;}
function start(text,p,progress){
 clear();if(!enabled)return;
 const el=$('text')?.querySelector('[data-p="'+p+'"]');if(!el)return;
 const original=el.textContent;
 const all=[...original.matchAll(/\S+/g)],spoken=[...String(text).matchAll(/\S+/g)].map(x=>x[0]);
 if(!all.length||!spoken.length)return;
 // Find the generated passage within the paragraph; handle minor punctuation variations.
 const canon=x=>x.toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
 const target=spoken.map(canon).filter(Boolean),tokens=all.map(x=>canon(x[0]));
 let from=p===lastParagraph?nextWord:0;
 let startAt=-1,best=-1;
 for(let i=from;i<all.length;i++){
  if(tokens[i]!==target[0])continue;
  let score=0;for(let j=0;j<Math.min(6,target.length)&&i+j<tokens.length;j++)if(tokens[i+j]===target[j])score++;
  if(score>best){startAt=i;best=score}
  if(score>=Math.min(4,target.length))break;
 }
 if(startAt<0)startAt=Math.min(from,all.length-1);
 const endAt=Math.min(all.length,startAt+spoken.length);
 lastParagraph=p;nextWord=endAt;
 let pos=0;const spans=[];
 const parts=[];
 all.forEach((m,i)=>{if(m.index>pos)parts.push(document.createTextNode(original.slice(pos,m.index)));const span=document.createElement('span');span.textContent=m[0];span.className='spoken-word';parts.push(span);spans.push(span);pos=m.index+m[0].length});
 if(pos<original.length)parts.push(document.createTextNode(original.slice(pos)));
 el.replaceChildren(...parts);el.classList.add('speaking');
 active={element:el,original,spans,startAt,endAt,last:-1};
 // Keep the current passage near the top without scrolling every word.
 const top=el.getBoundingClientRect().top;
 if(Math.abs(top-150)>90)window.scrollBy({top:top-150,behavior:'smooth'});
 function tick(){
  if(!active||!enabled)return;
  const fraction=Math.max(0,Math.min(0.999,Number(progress())||0));
  const at=Math.min(endAt-1,startAt+Math.floor((endAt-startAt)*fraction));
  if(active.last===at)return;
  if(active.last>=0)active.spans[active.last]?.classList.remove('word-now');
  active.last=at;active.spans[at]?.classList.add('word-now');
 }
 tick();timer=setInterval(tick,120);
}
function init(){const c=$('highlight-toggle');if(c){c.checked=enabled;c.onchange=()=>setEnabled(c.checked)}}
window.readerTracking={start,clear,setEnabled};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();