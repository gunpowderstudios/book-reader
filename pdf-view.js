/* E.D.D.i. PDF "Page view" (v1.12.213)
   Shows the designed PDF page as a picture and moves a soft green box over the paragraph being read.
   Needs the original PDF (kept in memory while the book is open) and the paragraph positions found by document-import.js. */
(()=>{
 const $=id=>document.getElementById(id);
 let fs=false,aspect=0.75,file=null,doc=null,docLoading=null,on=false,shownPage=0,shownW=0,vp=null,token=0,raf=0;
 const text=$('text'),main=$('book-main');
 if(!text||!main)return;
 const style=document.createElement('style');
 style.textContent=`
#eddi-pdf-bar{display:flex;justify-content:flex-end;margin:0 0 8px}
#eddi-pdf-bar[hidden],#eddi-pdf-view[hidden]{display:none!important}
#eddi-pdf-bar button{font:700 14px system-ui,sans-serif;background:#2b5a3d;color:#fff;border:1px solid #6e9a7e;border-radius:9px;padding:8px 14px;min-height:40px;cursor:pointer}
#eddi-pdf-bar button[aria-pressed=true]{background:#d1f869;color:#08150c;border-color:#d1f869}
#eddi-pdf-view{margin:0 auto 12px;max-width:900px}
#eddi-pdf-view .wrap{position:relative;margin:0 auto;background:#fff;box-shadow:0 2px 14px rgba(0,0,0,.5);line-height:0}
#eddi-pdf-view canvas{display:block;width:100%;height:auto}
#eddi-pdf-view .hl{position:absolute;pointer-events:none;background:rgba(209,248,105,.30);border:2px solid #d1f869;border-radius:4px;box-sizing:border-box;transition:top .25s,left .25s,width .25s,height .25s}
#eddi-pdf-view .note{font:13px/1.4 system-ui,sans-serif;color:#c1d7c6;padding:6px 2px;text-align:center}
#book-main.eddi-pdf-on #text{display:none!important}
#eddi-pdf-ctrl{display:flex;gap:6px;align-items:center;justify-content:flex-end;margin:0 0 6px;flex-wrap:nowrap}
#eddi-pdf-ctrl button{font:700 14px system-ui,sans-serif;background:#2b5a3d;color:#fff;border:1px solid #6e9a7e;border-radius:8px;min-width:38px;min-height:38px;padding:4px 10px;cursor:pointer;white-space:nowrap}
#eddi-pdf-ctrl button:disabled{opacity:.35}
#eddi-pdf-ctrl #eddi-pdf-toggle{background:#d1f869;color:#08150c;border-color:#d1f869;margin-left:8px}
#eddi-pdf-ctrl .lbl{font:500 12px system-ui,sans-serif;color:#c1d7c6;margin-right:auto;white-space:nowrap}
#eddi-pdf-ctrl .short{display:none}
@media(max-width:560px){#eddi-pdf-ctrl .long,#eddi-pdf-ctrl .w{display:none}#eddi-pdf-ctrl .short{display:inline}#eddi-pdf-ctrl button{padding:4px 8px}#eddi-pdf-ctrl #eddi-pdf-toggle{margin-left:4px}}
#book-main.eddi-pdf-on #heading{display:none!important}
#eddi-pdf-view.fs{position:fixed;inset:0;z-index:2147483000;margin:0;max-width:none;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;overflow:hidden}
#eddi-pdf-view.fs .wrap{margin:0;flex:0 0 auto}
#eddi-pdf-view.fs #eddi-pdf-ctrl{position:absolute;left:0;right:0;bottom:0;margin:0;padding:8px 8px calc(8px + env(safe-area-inset-bottom,0px));background:rgba(0,0,0,.72);z-index:2;justify-content:center}
#eddi-pdf-view.fs #eddi-pdf-ctrl .lbl{margin-right:0}
#eddi-pdf-view.fs #eddi-pdf-ctrl #eddi-pdf-toggle{display:none}
#eddi-pdf-view.fs .note{position:absolute;top:6px;left:0;right:0;color:#c1d7c6;z-index:2;pointer-events:none}
@media(prefers-reduced-motion:reduce){#eddi-pdf-view .hl{transition:none}}`;
 document.head.appendChild(style);
 const bar=document.createElement('div');bar.id='eddi-pdf-bar';bar.hidden=true;
 const btn=document.createElement('button');btn.type='button';btn.id='eddi-pdf-toggle';btn.setAttribute('aria-pressed','false');btn.textContent='🖼 Page view';
 btn.title='Show the PDF page as designed, with the paragraph being read highlighted';bar.appendChild(btn);
 const panel=document.createElement('div');panel.id='eddi-pdf-view';panel.hidden=true;
 const wrap=document.createElement('div');wrap.className='wrap';
 const cv=document.createElement('canvas');const hlBox=document.createElement('div');hlBox.style.cssText='position:absolute;inset:0;pointer-events:none';
 wrap.append(cv,hlBox);const note=document.createElement('div');note.className='note';
 const ctrl=document.createElement('div');ctrl.id='eddi-pdf-ctrl';
 const mk=(t,title,fn)=>{const b=document.createElement('button');b.type='button';b.innerHTML=t;b.title=title;b.setAttribute('aria-label',title);b.onclick=fn;return b};
 const bPrev=mk('◀','Previous page',()=>go(-1)),bNext=mk('▶','Next page',()=>go(1)),bPlay=mk('▶','Play or pause the reading',()=>$('play')?.click()),bFs=mk('⛶','Full screen',()=>setFs(!fs));
 const lbl=document.createElement('span');lbl.className='lbl';lbl.innerHTML='<span class="long">Page</span><span class="short"></span>';
 bPrev.innerHTML='⏮<span class="w"> Back</span>';bNext.innerHTML='<span class="w">Next </span>⏭';
 ctrl.append(lbl,bPrev,bNext,bPlay,bFs);
 panel.append(ctrl,wrap,note);
 text.before(bar);text.before(panel);

 const st=()=>window.chapterApp&&window.chapterApp.state;
 const cur=()=>{const s=st();if(!s)return null;const c=s.chapters[s.index];return c?{c,s,rects:(c.rects&&c.rects[s.p])||[]}:null};
 async function loadDoc(){
  if(doc)return doc;
  if(!docLoading){docLoading=(async()=>{
   const lib=await window.eddiPdfjs();const d=await lib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;doc=d;return d})().catch(e=>{docLoading=null;throw e})}
  return docLoading;
 }
 async function showPage(p){
  const my=++token;
  const d=await loadDoc();if(my!==token)return;
  const page=await d.getPage(p);if(my!==token)return;
  const v0=page.getViewport({scale:1});aspect=v0.width/v0.height;
  let cssW;
  if(fs){const availH=Math.max(200,innerHeight-76);cssW=Math.floor(Math.min(innerWidth,availH*aspect));wrap.style.width=cssW+'px'}
  else{wrap.style.width='';cssW=Math.max(240,wrap.clientWidth||panel.clientWidth||320)}
  const scale=cssW/v0.width,dpr=Math.min(2,window.devicePixelRatio||1);
  const v=page.getViewport({scale}),vr=page.getViewport({scale:scale*dpr});
  cv.width=Math.ceil(vr.width);cv.height=Math.ceil(vr.height);
  await page.render({canvasContext:cv.getContext('2d'),viewport:vr}).promise;if(my!==token)return;
  vp=v;shownPage=p;shownW=cssW;
 }
 function draw(rects,p){
  hlBox.replaceChildren();if(!vp)return;let first=null;
  for(const q of rects){if(q.p!==p)continue;const [ax,ay,bx,by]=vp.convertToViewportRectangle([q.x0,q.y0,q.x1,q.y1]);
   const d=document.createElement('div');d.className='hl';d.style.left=Math.min(ax,bx)+'px';d.style.top=Math.min(ay,by)+'px';d.style.width=Math.abs(bx-ax)+'px';d.style.height=Math.abs(by-ay)+'px';hlBox.appendChild(d);if(!first)first=d}
  note.textContent=first?'':'(This paragraph has no position on the page, so it is read without a highlight.)';
  if(first&&!fs){const r=first.getBoundingClientRect(),h=innerHeight,pad=130;if(r.top<pad||r.bottom>h-pad){window.scrollBy({top:r.top-h/3,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'})}}
 }
 async function update(){
  if(!on||!file)return;const k=cur();if(!k)return;
  const p=(k.rects[0]&&k.rects[0].p)||k.c.page||1;
  try{
   const w=fs?Math.floor(Math.min(innerWidth,Math.max(200,innerHeight-76)*aspect)):(wrap.clientWidth||panel.clientWidth);
   if(p!==shownPage||Math.abs(w-shownW)>8||!vp)await showPage(p);
   draw(k.rects,p);
   const total=doc?doc.numPages:'';lbl.querySelector('.long').textContent='Page '+p+(total?' of '+total:'');lbl.querySelector('.short').textContent=p+(total?' / '+total:'');
   bPrev.disabled=k.s.index<=0;bNext.disabled=k.s.index>=k.s.chapters.length-1;
  }catch(e){note.textContent='The page picture could not be shown: '+(e&&e.message||e);}
 }
 const later=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(update)};
 new MutationObserver(later).observe(text,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
 let rt=0;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{if(on){vp=null;update()}},250)});
 function go(dir){
  const s=st();if(!s)return;const was=!!s.playing,t=dir>0?$('next'):$('previous');if(!t||t.disabled)return;
  t.click();if(was)setTimeout(()=>$('play')?.click(),0);
 }
 async function setFs(v){
  fs=!!v;panel.classList.toggle('fs',fs);bFs.textContent=fs?'✕':'⛶';bFs.title=bFs.ariaLabel=fs?'Close full screen':'Full screen';
  document.documentElement.style.overflow=fs?'hidden':'';
  try{if(fs&&panel.requestFullscreen&&!document.fullscreenElement)await panel.requestFullscreen({navigationUI:'hide'});else if(!fs&&document.fullscreenElement)await document.exitFullscreen()}catch(_){}
  vp=null;update();
 }
 document.addEventListener('fullscreenchange',()=>{if(fs&&!document.fullscreenElement){fs=false;panel.classList.remove('fs');bFs.textContent='⛶';document.documentElement.style.overflow='';vp=null;update()}});
 document.addEventListener('keydown',e=>{
  if(!on||e.ctrlKey||e.metaKey||e.altKey)return;const t=e.target,tag=t&&t.tagName;if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT')return;
  if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();go(1)}
  else if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();go(-1)}
  else if(e.key==='Escape'&&fs){e.preventDefault();setFs(false)}
  else if((e.key==='f'||e.key==='F')&&!e.repeat){e.preventDefault();setFs(!fs)}
 });
 let tx=0,ty=0;wrap.addEventListener('touchstart',e=>{const t=e.changedTouches[0];tx=t.clientX;ty=t.clientY},{passive:true});
 wrap.addEventListener('touchend',e=>{const t=e.changedTouches[0],dx=t.clientX-tx,dy=t.clientY-ty;if(Math.abs(dx)>70&&Math.abs(dy)<60){go(dx<0?1:-1)}},{passive:true});
 const playBtn=$('play');if(playBtn)new MutationObserver(()=>{bPlay.textContent=/Pause/.test(playBtn.textContent)?'⏸':'▶'}).observe(playBtn,{childList:true,characterData:true,subtree:true});
 btn.onclick=()=>{
  if(on&&fs)setFs(false);on=!on;btn.setAttribute('aria-pressed',String(on));btn.textContent=on?'📖 Text view':'🖼 Page view';panel.hidden=!on;main.classList.toggle('eddi-pdf-on',on);
  if(on){ctrl.appendChild(btn);bar.hidden=true;note.textContent='Loading the page…';update()}else{bar.appendChild(btn);bar.hidden=!file}
 };
 /* tap a highlighted paragraph on the page to start reading from there */
 wrap.addEventListener('click',e=>{
  const k=cur();if(!k||!vp)return;const r=cv.getBoundingClientRect(),[x,y]=vp.convertToPdfPoint(e.clientX-r.left,e.clientY-r.top);
  const list=k.c.rects||[];for(let i=0;i<list.length;i++){for(const q of list[i]||[]){if(q.p===shownPage&&x>=q.x0&&x<=q.x1&&y>=q.y0&&y<=q.y1){const el=text.querySelector('[data-p="'+i+'"]');if(el)el.click();return}}}
 });
 window.eddiPdfView={setBook(f){
  token++;if(doc){try{doc.destroy()}catch(_){}}doc=null;docLoading=null;vp=null;shownPage=0;file=f||null;
  if(!file){on=false;bar.appendChild(btn);bar.hidden=true;panel.hidden=true;btn.setAttribute('aria-pressed','false');btn.textContent='🖼 Page view';main.classList.remove('eddi-pdf-on');return}
  bar.hidden=on;if(on)update();
 }};
})();
