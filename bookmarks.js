/* E.D.D.i. bookmarks (v1.12.223)
   A bookmark remembers a place in a book (chapter/page and paragraph) with a short snippet of the text.
   Saved in this browser only (localStorage, one list per book), and included in "Save Book & Progress" zips so they travel to other devices. */
(()=>{
 const $=id=>document.getElementById(id);
 const text=$('text'),main=$('book-main');if(!text||!main)return;
 const KEY=k=>'cv-bookmarks-'+k,MAX=200;
 const S=()=>window.chapterApp&&window.chapterApp.state;
 const read=()=>{const s=S();if(!s||!s.key)return [];try{const a=JSON.parse(localStorage.getItem(KEY(s.key))||'[]');return Array.isArray(a)?a.filter(b=>b&&Number.isInteger(b.i)&&Number.isInteger(b.p)):[]}catch(_){return []}};
 const write=a=>{const s=S();if(!s||!s.key)return;try{localStorage.setItem(KEY(s.key),JSON.stringify(a.slice(-MAX)))}catch(_){}};
 const style=document.createElement('style');
 style.textContent=`
#eddi-head-tools{float:right;display:flex;gap:8px;align-items:center;margin:2px 0 6px 12px}
#eddi-head-tools #eddi-pdf-bar{float:none;margin:0}
#eddi-bm-btn{font:700 14px system-ui,sans-serif;background:#2b5a3d;color:#fff;border:1px solid #6e9a7e;border-radius:8px;min-height:38px;min-width:38px;padding:4px 10px;cursor:pointer;white-space:nowrap}
#eddi-bm-btn[aria-pressed=true]{background:#f8d36e;color:#08150c;border-color:#f8d36e}
#eddi-pdf-ctrl #eddi-bm-btn{padding:4px 8px}
#eddi-bm-list{margin:10px 0 12px;border:1px solid #415a49;border-radius:10px;background:#142a1f}
#eddi-bm-list summary{cursor:pointer;font-weight:700;padding:10px 12px;color:#cef579}
#eddi-bm-list ul{list-style:none;margin:0;padding:0 8px 8px;max-height:260px;overflow:auto}
#eddi-bm-list li{display:flex;gap:6px;align-items:stretch;margin:0 0 6px}
#eddi-bm-list li button.go{flex:1;text-align:left;background:#0c1512;color:#e9f5ed;border:1px solid #355444;border-radius:8px;padding:8px 10px;cursor:pointer;font:13px/1.35 system-ui,sans-serif}
#eddi-bm-list li button.go b{display:block;color:#cef579;font-size:12px;margin-bottom:2px}
#eddi-bm-list li button.del{background:transparent;color:#e9f5ed;border:1px solid #415a49;border-radius:8px;width:36px;cursor:pointer}
#eddi-bm-list .empty{padding:0 12px 12px;color:#a9c2b3;font-size:13px}
#eddi-bm-toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:#000c;color:#fff;padding:8px 14px;border-radius:9px;font:600 14px system-ui,sans-serif;z-index:2147483200;pointer-events:none}`;
 document.head.appendChild(style);
 const tools=document.createElement('div');tools.id='eddi-head-tools';
 const btn=document.createElement('button');btn.type='button';btn.id='eddi-bm-btn';btn.innerHTML='🔖<span class="w"> Bookmark</span>';btn.title='Bookmark this place';btn.setAttribute('aria-pressed','false');
 const bar=$('eddi-pdf-bar'),heading=$('heading')||text;
 heading.before(tools);tools.append(btn);if(bar)tools.append(bar);
 const list=document.createElement('details');list.id='eddi-bm-list';const sum=document.createElement('summary');sum.textContent='🔖 Bookmarks';const ul=document.createElement('ul');const empty=document.createElement('div');empty.className='empty';
 list.append(sum,empty,ul);
 const sel=$('chapter-select');(sel||$('chapters')||text).after(list);

 const snippet=(s,i,p)=>{const t=((s.chapters[i]||{}).paragraphs||[])[p]||'';return t.replace(/\s+/g,' ').trim().slice(0,90)};
 const where=(s,i,b)=>{const c=s.chapters[i];return (c&&c.title)||('Chapter '+(i+1))};
 const toast=m=>{let t=$('eddi-bm-toast');if(t)t.remove();t=document.createElement('div');t.id='eddi-bm-toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),1600)};
 function refresh(){
  const s=S();if(!s)return;const a=read(),here=a.findIndex(b=>b.i===s.index&&b.p===s.p);
  btn.setAttribute('aria-pressed',String(here>=0));btn.title=here>=0?'Remove the bookmark here':'Bookmark this place';
  btn.querySelector('.w').textContent=here>=0?' Bookmarked':' Bookmark';
  sum.textContent='🔖 Bookmarks'+(a.length?' ('+a.length+')':'');
  empty.textContent=a.length?'':'No bookmarks yet. Press 🔖 to save your place.';empty.hidden=!!a.length;
  ul.replaceChildren(...a.slice().sort((x,y)=>x.i-y.i||x.p-y.p).map(b=>{
   const li=document.createElement('li'),g=document.createElement('button');g.type='button';g.className='go';
   g.innerHTML='<b></b><span></span>';g.firstChild.textContent=where(s,b.i,b)+' · paragraph '+(b.p+1);g.lastChild.textContent=b.label||snippet(s,b.i,b.p);
   g.onclick=()=>{const st=S();try{window.chapterApp.stop()}catch(_){}st.index=b.i;st.p=b.p;window.chapterApp.render();try{document.getElementById('tab-book')?.click()}catch(_){}requestAnimationFrame(()=>{const el=text.querySelector('[data-p="'+b.p+'"]');if(el)el.scrollIntoView({block:'center'})});refresh()};
   const d=document.createElement('button');d.type='button';d.className='del';d.textContent='✕';d.title='Remove this bookmark';d.setAttribute('aria-label','Remove this bookmark');d.onclick=()=>{write(read().filter(x=>!(x.i===b.i&&x.p===b.p)));refresh()};
   li.append(g,d);return li}));
 }
 btn.onclick=()=>{
  const s=S();if(!s||!s.chapters.length)return;const a=read(),k=a.findIndex(b=>b.i===s.index&&b.p===s.p);
  if(k>=0){a.splice(k,1);write(a);toast('Bookmark removed')}
  else{a.push({i:s.index,p:s.p,t:Date.now(),label:snippet(s,s.index,s.p)});write(a);toast('Bookmarked')}
  refresh();
 };
 /* when the paragraph or book changes, update the button */
 let raf=0;new MutationObserver(()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(refresh)}).observe(text,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
 /* in Page view the toolbar row has its own place for the button */
 new MutationObserver(()=>{const ctrl=$('eddi-pdf-ctrl'),on=main.classList.contains('eddi-pdf-on');if(!ctrl)return;if(on){const fsb=ctrl.querySelector('button[title="Full screen"],button[title="Close full screen"]');ctrl.insertBefore(btn,fsb||null)}else tools.prepend(btn)}).observe(main,{attributes:true,attributeFilter:['class']});
 window.eddiBookmarks={list:read,set(k,a){try{if(k&&Array.isArray(a))localStorage.setItem(KEY(k),JSON.stringify(a.filter(b=>b&&Number.isInteger(b.i)&&Number.isInteger(b.p)).slice(0,MAX)))}catch(_){}refresh()},refresh};
 refresh();
})();
