/* E.D.D.i optional document imports: PDF, text, Word (.docx), OpenDocument (.odt), RTF, Markdown, web pages and FictionBook (.fb2). EPUB parsing is unchanged. */
(function(){
 'use strict';
 const PDF_JS='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
 const PDF_WORKER='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
 let pdfModule;
 function clean(s){return String(s||'').replace(/\s+/g,' ').trim()}
 const END=/[.!?…:;]["'”’)\]]*$/;
 /* Join hard-wrapped lines into real paragraphs so the voice reads whole sentences, not one line at a time. */
 function joinLines(lines){
  let out='';
  for(const raw of lines){
   const l=clean(raw);if(!l)continue;
   if(!out){out=l;continue}
   if(/[A-Za-z]-$/.test(out)&&/^[a-z]/.test(l))out=out.slice(0,-1)+l; // "exam-" + "ple" -> "example"
   else out+=' '+l;
  }
  return out;
 }
 function reflowWrapped(lines){
  // No blank lines to go on: a short line that ends a sentence is the end of a paragraph.
  const ls=lines.map(clean).filter(Boolean);if(!ls.length)return [];
  const sorted=ls.map(l=>l.length).sort((a,b)=>a-b),longest=sorted[Math.floor(sorted.length*0.9)]||0;
  const out=[];let cur=[];
  for(const l of ls){cur.push(l);if(END.test(l)&&l.length<longest*0.75){out.push(joinLines(cur));cur=[]}}
  if(cur.length)out.push(joinLines(cur));
  return out;
 }
 function splitText(text){
  const t=String(text).replace(/\r\n?/g,'\n');
  const blocks=t.split(/\n\s*\n/).map(b=>joinLines(b.split('\n'))).filter(Boolean);
  if(blocks.length>1)return blocks;
  return reflowWrapped(t.split('\n'));
 }
 async function pdfjs(){
  if(!pdfModule)pdfModule=import(PDF_JS).then(mod=>{mod.GlobalWorkerOptions.workerSrc=PDF_WORKER;return mod}).catch(err=>{pdfModule=null;throw new Error('PDF reader could not load. Check your internet connection: '+err.message)});
  return pdfModule;
 }
 /* ALL-CAPS words (usually headings) are read out letter by letter, so make them ordinary words. Short ones (USA, TV) and numerals (XVII) stay as they are. */
 function softCaps(t){
  t=String(t);
  const shout=!/[a-z]/.test(t)&&t.length<=100; // a whole heading in capitals: every real word becomes an ordinary word
  return t.replace(/\b[A-Z][A-Z'’-]{1,}\b/g,w=>{
   if(/^[IVXLCDM]+$/.test(w)||!/[AEIOUY]/.test(w))return w;
   if(w.length>=4||(shout&&w.length>=3))return w[0]+w.slice(1).toLowerCase();
   return w;
  });
 }
 function wrapLines(ctx,text,maxW,maxLines){
  const words=String(text).split(/\s+/),lines=[];let cur='';
  for(const w of words){const t=cur?cur+' '+w:w;if(ctx.measureText(t).width>maxW&&cur){lines.push(cur);cur=w}else cur=t}
  if(cur)lines.push(cur);
  if(lines.length>maxLines){lines.length=maxLines;lines[maxLines-1]=lines[maxLines-1].replace(/\s*\S*$/,'')+'…'}
  return lines;
 }
 /* A small picture for My Library: the first page of a PDF, or a plain card for a text file, with a PDF / TXT label. */
 function badgeCover(kind,title,pageCanvas){
  try{
   const W=240,H=360,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
   g.fillStyle=pageCanvas?'#f1ede2':'#1c3a2a';g.fillRect(0,0,W,H);
   if(pageCanvas){
    const m=14,sc=Math.min((W-2*m)/pageCanvas.width,(H-2*m-34)/pageCanvas.height),w=pageCanvas.width*sc,h=pageCanvas.height*sc;
    g.shadowColor='rgba(0,0,0,.3)';g.shadowBlur=8;g.fillStyle='#fff';g.fillRect((W-w)/2,m,w,h);g.shadowBlur=0;
    g.drawImage(pageCanvas,(W-w)/2,m,w,h);
   }else{
    g.strokeStyle='#698570';g.lineWidth=3;g.strokeRect(12,12,W-24,H-24);
    g.fillStyle='#e9f5ed';g.font='bold 24px Georgia,serif';g.textAlign='center';
    const ls=wrapLines(g,String(title||'Text document'),W-60,6);ls.forEach((l,i)=>g.fillText(l,W/2,70+i*32));
   }
   const label=kind.toUpperCase();
   g.font='bold 20px system-ui,sans-serif';g.textAlign='center';
   const bw=g.measureText(label).width+26;
   g.fillStyle=({pdf:'#c0392b',docx:'#2b579a',odt:'#1f8a70',rtf:'#6b5b95',md:'#7d3c98',html:'#d35400',fb2:'#8d6e3f'})[kind]||'#5f8f6e';g.beginPath();
   if(g.roundRect)g.roundRect(W-bw-10,H-42,bw,30,8);else g.rect(W-bw-10,H-42,bw,30);
   g.fill();g.fillStyle='#fff';g.fillText(label,W-bw/2-10,H-20);
   return c.toDataURL('image/jpeg',0.75);
  }catch(_){return null}
 }
 function isPageNumber(l){return /^(page\s*)?\d{1,4}$/i.test(l)||/^[-–—]\s*\d{1,4}\s*[-–—]$/.test(l)}
 /* Finds clear vertical gutters (columns) on a page from where the text actually sits. Returns the x positions of the gutters, or null for a single column. */
 function findGutters(items){
  if(items.length<12)return null;
  let minX=1e9,maxX=-1e9;for(const it of items){minX=Math.min(minX,it.x);maxX=Math.max(maxX,it.x+it.w)}
  const W=maxX-minX;if(W<200)return null;
  const narrow=items.filter(it=>it.w<=W*0.55);if(narrow.length<10)return null;
  const hs=narrow.map(i=>i.h).sort((p,q)=>p-q),bodyH=hs[Math.floor(hs.length/2)]||10;
  const bin=2,n=Math.ceil(W/bin)+2,cov=new Array(n).fill(0);
  for(const it of narrow){const a=Math.floor((it.x-minX)/bin),b=Math.ceil((it.x+it.w-minX)/bin);for(let k=a;k<=b&&k<n;k++)cov[k]++}
  const minGap=Math.max(10,bodyH*1.2)/bin,gaps=[];let start=-1;
  const lo=Math.floor(n*0.15),hi=Math.ceil(n*0.85);
  for(let k=lo;k<=hi+1;k++){
   const empty=k<=hi&&cov[k]===0;
   if(empty&&start<0)start=k;
   else if(!empty&&start>=0){if(k-start>=minGap)gaps.push({w:k-start,x:minX+((start+k)/2)*bin});start=-1}
  }
  if(!gaps.length)return null;
  const xs=gaps.sort((p,q)=>q.w-p.w).slice(0,2).map(g=>g.x).sort((p,q)=>p-q);
  const edges=[-1e9,...xs,1e9];
  for(let c=0;c<edges.length-1;c++){
   const cnt=narrow.filter(it=>{const m=it.x+it.w/2;return m>=edges[c]&&m<edges[c+1]}).length;
   if(cnt<Math.max(5,narrow.length*0.2))return null;
  }
  return xs;
 }
 /* Group text pieces into lines by position. */
 function itemsToLines(items,sorted){
  const lines=[];let cur=null;
  const list=sorted?items.slice().sort((p,q)=>(q.y-p.y)||(p.x-q.x)):items;
  for(const it of list){
   if(!cur||Math.abs(it.y-cur.y)>it.h*0.5){cur={y:it.y,h:it.h,text:'',x0:1e9,x1:-1e9,parts:[]};lines.push(cur)}
   cur.parts.push(it);
   if(!sorted&&it.eol){cur.eolAfter=true}
   if(!sorted&&it.eol){cur=null}
  }
  for(const l of lines){
   if(sorted)l.parts.sort((p,q)=>p.x-q.x);
   l.text=l.parts.map(p=>p.s).join('');
   for(const p of l.parts)if(p.s.trim()){l.x0=Math.min(l.x0,p.x);l.x1=Math.max(l.x1,p.x+p.w)}
  }
  return lines;
 }
 async function pageParagraphs(page,pageNo){
  const data=await page.getTextContent();
  const items=[],seen=[];
  for(const item of data.items){
   if(typeof item.str!=='string')continue;
   // Some PDFs draw the same text twice (outlines, shadows). Read it once.
   if(item.str.trim()&&item.transform){const x=item.transform[4],y=item.transform[5];if(seen.some(q=>q.s===item.str&&Math.abs(q.x-x)<2&&Math.abs(q.y-y)<2))continue;seen.push({s:item.str,x,y})}
   const y=item.transform?item.transform[5]:0,h=Math.abs(item.height||item.transform&&item.transform[3]||10)||10;
   items.push({s:item.str,x:item.transform?item.transform[4]:0,w:item.width||0,y,h,eol:!!item.hasEOL});
  }
  // Columns: if the page has clear gutters, read each column top to bottom (full-width headings stay in place), instead of across the page.
  const real=items.filter(i=>i.s.trim());
  const gutters=findGutters(real);
  const segments=[];
  if(gutters){
   const crosses=it=>gutters.some(g=>it.x<g-1&&it.x+it.w>g+1);
   const spanners=real.filter(crosses).sort((p,q)=>q.y-p.y),rest=real.filter(i=>!crosses(i));
   // Full-width lines that sit together (a heading, an intro paragraph) stay together as one piece.
   const groups=[];for(const sp of spanners){const last=groups[groups.length-1];if(last&&!rest.some(it=>it.y<last[last.length-1].y-1&&it.y>sp.y+1))last.push(sp);else groups.push([sp])}
   const bandOf=it=>groups.filter(g=>g[0].y>it.y+it.h*0.3).length;
   const colOf=it=>{const m=it.x+it.w/2;let c=0;for(const g of gutters)if(m>g)c++;return c};
   const cells=new Map();
   for(const it of rest){const key=bandOf(it)*10+colOf(it);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(it)}
   for(let b=0;b<=groups.length;b++){
    for(let c=0;c<=gutters.length;c++){const cell=cells.get(b*10+c);if(cell&&cell.length)segments.push(cell)}
    if(b<groups.length)segments.push(groups[b]);
   }
  }else segments.push(items);
  const rows=[];
  segments.forEach((seg,si)=>{
   for(const l of itemsToLines(seg,!!gutters)){const t=clean(l.text);if(t)rows.push({y:l.y,h:l.h,x0:l.x0,x1:l.x1,text:t,seg:si})}
  });
  while(rows.length&&isPageNumber(rows[0].text))rows.shift();      // page numbers at the top or bottom are not read aloud
  while(rows.length&&isPageNumber(rows[rows.length-1].text))rows.pop();
  if(!rows.length)return {paras:[],rects:[]};
  const gaps=[];for(let i=1;i<rows.length;i++){if(rows[i].seg!==rows[i-1].seg)continue;const g=Math.abs(rows[i-1].y-rows[i].y);if(g>0)gaps.push(g)}
  gaps.sort((a,b)=>a-b);const normal=gaps.length?gaps[Math.floor(gaps.length/2)]:0;
  // Lines set in clearly larger type than the rest are headings: keep each one as its own paragraph.
  const hs=rows.map(r=>r.h).sort((a,b)=>a-b),bodyH=hs[Math.floor(hs.length/2)]||10;
  const isHead=r=>r.h>=bodyH*1.3&&r.text.length<=100;
  const paras=[],rects=[];let buf=[],bufRows=[];
  /* where on the page a paragraph sits (PDF page units), so Page view can highlight it: one box per column piece */
  const box=rs=>{const out=[],bySeg=new Map();for(const q of rs){if(!(q.x1>q.x0))continue;if(!bySeg.has(q.seg))bySeg.set(q.seg,[]);bySeg.get(q.seg).push(q)}
   for(const r of bySeg.values())out.push({p:pageNo,x0:Math.min(...r.map(q=>q.x0))-2,x1:Math.max(...r.map(q=>q.x1))+2,y0:Math.min(...r.map(q=>q.y-q.h*0.3)),y1:Math.max(...r.map(q=>q.y+q.h*0.95))});return out};
  for(let i=0;i<rows.length;i++){
   const head=isHead(rows[i]),prevHead=i>0&&isHead(rows[i-1]);
   let brk=false;
   if(i>0){
    if(rows[i].seg!==rows[i-1].seg){ brk=!( !head&&!prevHead&&!END.test(rows[i-1].text)&&/^[a-z]/.test(rows[i].text) ) } // a sentence running from one column into the next stays together
    else brk=head||prevHead||(normal&&Math.abs(rows[i-1].y-rows[i].y)>normal*1.45);
   }
   if(brk){if(buf.length){paras.push(joinLines(buf));rects.push(box(bufRows))}buf=[];bufRows=[]}
   buf.push(rows[i].text);bufRows.push(rows[i]);
  }
  if(buf.length){paras.push(joinLines(buf));rects.push(box(bufRows))}
  // Pages with no clear gaps at all (one huge block): fall back to sentence-ending short lines.
  if(!gutters&&paras.length===1&&rows.length>6){const rf=reflowWrapped(rows.map(r=>r.text)).map(softCaps);return {paras:rf,rects:rf.map(()=>[])}}
  const keep=paras.map((t,i)=>t?i:-1).filter(i=>i>=0);
  return {paras:keep.map(i=>softCaps(paras[i])),rects:keep.map(i=>rects[i])};
 }
 async function readPdf(file){
  const pdfLib=await pdfjs();
  const task=pdfLib.getDocument({data:new Uint8Array(await file.arrayBuffer())});
  let pdf;
  try{
   pdf=await task.promise;
   const chapters=[];let carry='',carryRects=[];
   let cover=null;
   try{const p1=await pdf.getPage(1),v0=p1.getViewport({scale:1}),vp=p1.getViewport({scale:Math.min(2,400/v0.width)}),cv=document.createElement('canvas');cv.width=Math.ceil(vp.width);cv.height=Math.ceil(vp.height);await p1.render({canvasContext:cv.getContext('2d'),viewport:vp}).promise;cover=badgeCover('pdf',file.name,cv)}catch(_){cover=badgeCover('pdf',file.name.replace(/\.pdf$/i,''),null)}
   for(let pageNo=1;pageNo<=pdf.numPages;pageNo++){
    const page=await pdf.getPage(pageNo);
    const pp=await pageParagraphs(page,pageNo),paragraphs=pp.paras,rects=pp.rects;
    // A sentence that runs over the page break is read as one piece: move the start of it to the next page.
    if(carry&&paragraphs.length&&/^[a-z]/.test(paragraphs[0])){paragraphs[0]=carry+' '+paragraphs[0];rects[0]=carryRects.concat(rects[0])}
    else if(carry){const last=chapters[chapters.length-1];if(last){last.paragraphs.push(carry);last.rects.push(carryRects)}}
    carry='';carryRects=[];
    if(paragraphs.length){
     const last=paragraphs[paragraphs.length-1];
     if(pageNo<pdf.numPages&&last&&!END.test(last)&&paragraphs.length>0){carry=paragraphs.pop();carryRects=rects.pop()||[]}
    }
    if(paragraphs.length)chapters.push({title:'Page '+pageNo,paragraphs,rects,page:pageNo});
    else if(carry){/* whole page was one unfinished paragraph: keep carrying it */}
   }
   if(carry){const last=chapters[chapters.length-1];if(last){last.paragraphs.push(carry);last.rects.push(carryRects)}else chapters.push({title:'Page 1',paragraphs:[carry],rects:[carryRects],page:1})}
   if(!chapters.length)throw new Error('No selectable text found. Scanned PDFs need OCR, which is not supported yet.');
   return {title:file.name.replace(/\.pdf$/i,''),author:'PDF document',cover,chapters,pdfFile:file};
  }finally{if(pdf)await pdf.destroy().catch(()=>{});else await task.destroy().catch(()=>{})}
 }
 /* ───── Shared: turn a list of {t:text, h:heading level (0 = body text)} into chapters ───── */
 function buildChapters(blocks){
  blocks=blocks.map(b=>({t:softCaps(clean(b.t)),h:b.h||0})).filter(b=>b.t);
  if(!blocks.length)return [];
  let level=0;
  for(const L of [1,2,3]){if(blocks.filter(b=>b.h>0&&b.h<=L).length>=2){level=L;break}}
  if(level){
   const chapters=[];let cur=null;
   for(const b of blocks){
    if(b.h>0&&b.h<=level){cur={title:b.t.slice(0,120),paragraphs:[b.t]};chapters.push(cur);continue}
    if(!cur){cur={title:'Beginning',paragraphs:[]};chapters.push(cur)}
    cur.paragraphs.push(b.t);
   }
   const out=chapters.filter(c=>c.paragraphs.length);
   if(out.length)return out;
  }
  // No usable headings: parts of about 80 paragraphs, so a long document is still easy to move around in.
  const size=80,out=[];
  for(let i=0;i<blocks.length;i+=size)out.push({title:blocks.length>size*1.5?'Part '+(out.length+1):'Text',paragraphs:blocks.slice(i,i+size).map(b=>b.t)});
  return out;
 }
 const HEADING=/^(chapter|part|book|section|act|canto|prologue|epilogue|preface|foreword|introduction)\b[\s\w.:'’-]{0,60}$/i;
 const LABEL={pdf:'PDF document',txt:'Text document',docx:'Word document',odt:'OpenDocument text',rtf:'Rich text document',md:'Markdown document',html:'Web page',fb2:'FictionBook'};
 const baseName=(f,re)=>f.name.replace(re,'');
 function done(file,re,kind,author,title,chapters){
  if(!chapters.length)throw new Error('No readable text was found in this '+LABEL[kind].toLowerCase()+'.');
  return {title:clean(title)||baseName(file,re),author:clean(author)||LABEL[kind],cover:badgeCover(kind,clean(title)||baseName(file,re),null),chapters};
 }
 async function readTxt(file){
  const raw=await file.text();
  const paras=splitText(raw.replace(/^﻿/,''));
  if(!paras.length)throw new Error('The text file is empty.');
  const blocks=paras.map(p=>({t:p,h:(p.length<=70&&HEADING.test(p))?1:0}));
  return done(file,/\.te?xt$/i,'txt','',baseName(file,/\.te?xt$/i),buildChapters(blocks));
 }

 /* ───── Word (.docx) and OpenDocument (.odt): both are zip files holding XML ───── */
 async function openZip(file,what){
  if(!window.JSZip)throw new Error(what+' support library unavailable. Check your internet connection.');
  try{return await window.JSZip.loadAsync(file)}catch(_){throw new Error('This does not look like a valid '+what+' file.')}
 }
 const xml=(t)=>{const d=new DOMParser().parseFromString(t,'application/xml');if(d.getElementsByTagName('parsererror').length)throw new Error('The document could not be read.');return d};
 const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
 function docxText(p){
  let t='';
  const walk=n=>{
   for(const c of n.childNodes){
    if(c.nodeType!==1)continue;
    const ln=c.localName;
    if(ln==='Fallback'||ln==='pPr'||ln==='rPr')continue;
    if(ln==='t')t+=c.textContent;
    else if(ln==='tab'||ln==='br'||ln==='cr')t+=' ';
    else if(ln==='noBreakHyphen')t+='-';
    else walk(c);
   }
  };
  walk(p);return t;
 }
 async function readDocx(file){
  const zip=await openZip(file,'Word');
  const f=zip.file('word/document.xml');if(!f)throw new Error('This does not look like a Word (.docx) file.');
  const doc=xml(await f.async('string'));
  const styleName={};
  const sf=zip.file('word/styles.xml');
  if(sf){try{for(const st of xml(await sf.async('string')).getElementsByTagNameNS(W,'style')){const id=st.getAttributeNS(W,'styleId'),nm=st.getElementsByTagNameNS(W,'name')[0];if(id&&nm)styleName[id]=nm.getAttributeNS(W,'val')||''}}catch(_){}}
  const blocks=[];
  for(const p of doc.getElementsByTagNameNS(W,'p')){
   const t=clean(docxText(p));if(!t)continue;
   let h=0;
   const ps=p.getElementsByTagNameNS(W,'pStyle')[0];
   if(ps){const id=ps.getAttributeNS(W,'val'),nm=(styleName[id]||id||'').toLowerCase();let m=nm.match(/^heading\s*(\d)/);if(m)h=Math.min(6,+m[1]);else if(/^title$/.test(nm))h=1;}
   if(!h){const ol=p.getElementsByTagNameNS(W,'outlineLvl')[0];if(ol){const v=parseInt(ol.getAttributeNS(W,'val'),10);if(v>=0&&v<6)h=v+1}}
   blocks.push({t,h});
  }
  let title='',author='';
  const cf=zip.file('docProps/core.xml');
  if(cf){try{const c=xml(await cf.async('string'));title=(c.getElementsByTagName('dc:title')[0]||{}).textContent||'';author=(c.getElementsByTagName('dc:creator')[0]||{}).textContent||''}catch(_){}}
  return done(file,/\.docx$/i,'docx',author,title,buildChapters(blocks));
 }
 const T='urn:oasis:names:tc:opendocument:xmlns:text:1.0';
 function odtText(p){
  let t='';
  const walk=n=>{
   for(const c of n.childNodes){
    if(c.nodeType===3){t+=c.nodeValue;continue}
    if(c.nodeType!==1)continue;
    const ln=c.localName;
    if(ln==='note'||ln==='tracked-changes')continue;
    if(ln==='s')t+=' ';else if(ln==='tab'||ln==='line-break')t+=' ';else walk(c);
   }
  };
  walk(p);return t;
 }
 async function readOdt(file){
  const zip=await openZip(file,'OpenDocument');
  const f=zip.file('content.xml');if(!f)throw new Error('This does not look like an OpenDocument (.odt) file.');
  const doc=xml(await f.async('string'));
  const blocks=[];
  const all=doc.getElementsByTagNameNS(T,'*');
  for(const el of all){
   const ln=el.localName;if(ln!=='h'&&ln!=='p')continue;
   if(el.parentNode&&el.parentNode.localName==='note-body')continue;
   const t=clean(odtText(el));if(!t)continue;
   blocks.push({t,h:ln==='h'?Math.min(6,parseInt(el.getAttributeNS(T,'outline-level'),10)||1):0});
  }
  let title='',author='';
  const mf=zip.file('meta.xml');
  if(mf){try{const m=xml(await mf.async('string'));title=(m.getElementsByTagName('dc:title')[0]||{}).textContent||'';author=(m.getElementsByTagName('dc:creator')[0]||{}).textContent||(m.getElementsByTagName('meta:initial-creator')[0]||{}).textContent||''}catch(_){}}
  return done(file,/\.odt$/i,'odt',author,title,buildChapters(blocks));
 }

 /* ───── Rich text (.rtf) ───── */
 const RTF_SKIP=new Set(['fonttbl','colortbl','stylesheet','info','header','footer','headerl','headerr','headerf','footerl','footerr','footerf','pict','object','listtable','listoverridetable','rsidtbl','generator','themedata','datastore','colorschememapping','latentstyles','fldinst','xmlnstbl','revtbl','private','filetbl','footnote']);
 const RTF_CHARS={emdash:'—',endash:'–',lquote:'‘',rquote:'’',ldblquote:'“',rdblquote:'”',bullet:'•',emspace:' ',enspace:' ',tab:' ',line:'\n',par:'\n',page:'\n',sect:'\n'};
 function rtfToText(src){
  const cp=new TextDecoder('windows-1252');
  let out='',stack=[],skip=false,i=0;const n=src.length;
  while(i<n){
   const c=src[i];
   if(c==='{'){stack.push(skip);i++;continue}
   if(c==='}'){skip=stack.length?stack.pop():false;i++;continue}
   if(c==='\\'){
    i++;const d=src[i];
    if(d==='\\'||d==='{'||d==='}'){if(!skip)out+=d;i++;continue}
    if(d==="'"){const h=src.substr(i+1,2);i+=3;if(!skip&&/^[0-9a-f]{2}$/i.test(h))out+=cp.decode(new Uint8Array([parseInt(h,16)]));continue}
    if(d==='*'){skip=true;i++;continue}
    if(d==='~'){if(!skip)out+=' ';i++;continue}
    if(d==='-'||d==='_'){i++;continue}
    const m=/^([a-zA-Z]+)(-?\d+)?\s?/.exec(src.slice(i,i+40));
    if(!m){i++;continue}
    i+=m[0].length;
    const w=m[1];
    if(RTF_SKIP.has(w)){skip=true;continue}
    if(skip)continue;
    if(w==='u'&&m[2]!==undefined){let v=parseInt(m[2],10);if(v<0)v+=65536;out+=String.fromCharCode(v);if(src[i]==='\\'&&src[i+1]==="'")i+=4;else if(src[i]&&src[i]!=='\\'&&src[i]!=='{'&&src[i]!=='}')i++;continue}
    if(w in RTF_CHARS)out+=RTF_CHARS[w];
    continue;
   }
   if(c==='\r'||c==='\n'){i++;continue}
   if(!skip)out+=c;
   i++;
  }
  return out;
 }
 async function readRtf(file){
  const raw=await file.text();
  if(!/^\s*\{\\rtf/.test(raw))throw new Error('This does not look like a valid RTF file.');
  const lines=rtfToText(raw).split('\n').map(clean).filter(Boolean);
  const blocks=lines.map(t=>({t,h:(t.length<=70&&HEADING.test(t))?1:0}));
  return done(file,/\.rtf$/i,'rtf','',baseName(file,/\.rtf$/i),buildChapters(blocks));
 }

 /* ───── Markdown (.md) ───── */
 function mdInline(t){
  return t.replace(/!\[([^\]]*)\]\([^)]*\)/g,'$1').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/<https?:[^>]*>/g,'')
   .replace(/<\/?[a-zA-Z][^>]*>/g,'').replace(/(\*\*|__)(.+?)\1/g,'$2').replace(/(^|[\s(])[*_]([^*_\s][^*_]*?)[*_](?=[\s).,;:!?]|$)/g,'$1$2').replace(/`([^`]*)`/g,'$1').replace(/~~(.+?)~~/g,'$1');
 }
 async function readMd(file){
  let raw=(await file.text()).replace(/^﻿/,'').replace(/\r\n?/g,'\n');
  raw=raw.replace(/^---\n[\s\S]*?\n---\n/,''); // front matter
  const blocks=[];let buf=[],inCode=false;
  const flush=()=>{if(buf.length){blocks.push({t:mdInline(joinLines(buf)),h:0});buf=[]}};
  for(const line of raw.split('\n')){
   if(/^\s*(```|~~~)/.test(line)){flush();inCode=!inCode;continue}
   if(inCode){if(line.trim())blocks.push({t:line.trim(),h:0});continue}
   const hm=/^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
   if(hm){flush();blocks.push({t:mdInline(hm[2]),h:hm[1].length});continue}
   if(!line.trim()){flush();continue}
   if(/^\s*([-*_]\s*){3,}$/.test(line)||/^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(line)){flush();continue}
   if(/^\s*([=-])\1+\s*$/.test(line)&&buf.length){ // setext underline: the line above is a heading
    const t=mdInline(joinLines(buf));buf=[];blocks.push({t,h:line.trim()[0]==='='?1:2});continue}
   let l=line.replace(/^\s*>+\s?/,'');
   const li=/^\s*(?:[-*+]|\d+[.)])\s+(.*)$/.exec(l);
   if(li){flush();blocks.push({t:mdInline(li[1]),h:0});continue}
   if(l.includes('|')&&/^\s*\|/.test(l)){flush();blocks.push({t:mdInline(l.split('|').map(x=>x.trim()).filter(Boolean).join(', ')),h:0});continue}
   buf.push(l);
  }
  flush();
  const first=blocks.find(b=>b.h===1);
  return done(file,/\.(md|markdown)$/i,'md','',first?first.t:baseName(file,/\.(md|markdown)$/i),buildChapters(blocks));
 }

 /* ───── Web pages (.html, .htm, .xhtml) ───── */
 async function readHtml(file){
  const raw=await file.text();
  const doc=new DOMParser().parseFromString(raw,'text/html');
  const ttl=clean((doc.querySelector('title')||{}).textContent),au=(doc.querySelector('meta[name="author" i]')||{}).content||'';
  doc.querySelectorAll('script,style,noscript,template,iframe,svg,nav,form,button,select,head').forEach(e=>e.remove());
  doc.querySelectorAll('br').forEach(b=>b.replaceWith(doc.createTextNode(' ')));
  const sel='h1,h2,h3,h4,h5,h6,p,li,blockquote,pre,dd,dt,figcaption,td,th';
  const blocks=[];
  for(const el of doc.body?doc.body.querySelectorAll(sel):[]){
   if(el.querySelector(sel))continue; // read the inner pieces instead
   const t=clean(el.textContent);if(!t)continue;
   const m=/^H([1-6])$/.exec(el.tagName);
   blocks.push({t,h:m?+m[1]:0});
  }
  if(!blocks.length&&doc.body)splitText(doc.body.textContent||'').forEach(t=>blocks.push({t,h:0}));
  const h1=blocks.find(b=>b.h===1);
  return done(file,/\.(x?html?)$/i,'html',au,ttl||(h1&&h1.t)||'',buildChapters(blocks));
 }

 /* ───── FictionBook (.fb2), a common ebook format ───── */
 async function readFb2(file){
  const buf=await file.arrayBuffer();
  const head=new TextDecoder('latin1').decode(buf.slice(0,200));
  const enc=((/encoding=["']([^"']+)["']/i.exec(head)||[])[1]||'utf-8').toLowerCase();
  let text;try{text=new TextDecoder(enc).decode(buf)}catch(_){text=new TextDecoder('utf-8').decode(buf)}
  const doc=xml(text.replace(/^﻿/,''));
  const kids=(n,name)=>[...n.children].filter(c=>c.localName===name);
  const body=[...doc.getElementsByTagName('body')].find(b=>b.getAttribute('name')!=='notes')||doc.getElementsByTagName('body')[0];
  if(!body)throw new Error('This does not look like a valid FictionBook (.fb2) file.');
  const paraText=n=>clean(n.textContent);
  const gather=sec=>{const out=[];for(const c of sec.children){const ln=c.localName;if(ln==='section'){out.push(...gather(c));continue}if(ln==='title'||ln==='epigraph'||ln==='cite'||ln==='poem'||ln==='stanza'){const inner=[...c.getElementsByTagName('p'),...c.getElementsByTagName('v')].map(paraText).filter(Boolean);if(inner.length)out.push(...inner);continue}if(ln==='p'||ln==='subtitle'||ln==='text-author')out.push(paraText(c))}return out.filter(Boolean)};
  let secs=kids(body,'section');
  while(secs.length===1&&kids(secs[0],'section').length)secs=kids(secs[0],'section');
  let chapters=[];
  if(secs.length){
   for(let i=0;i<secs.length;i++){
    const t=kids(secs[i],'title')[0];const title=t?clean(t.textContent):'Section '+(i+1);
    const paragraphs=gather(secs[i]).map(softCaps);
    if(paragraphs.length)chapters.push({title:title.slice(0,120)||'Section '+(i+1),paragraphs});
   }
  }else chapters=buildChapters([...body.getElementsByTagName('p')].map(p=>({t:paraText(p),h:0})));
  const ti=doc.getElementsByTagName('title-info')[0];
  const bt=ti&&ti.getElementsByTagName('book-title')[0];
  const au=ti&&ti.getElementsByTagName('author')[0];
  const author=au?clean(['first-name','middle-name','last-name'].map(k=>(au.getElementsByTagName(k)[0]||{}).textContent||'').join(' ')):'';
  return done(file,/\.fb2$/i,'fb2',author,bt?bt.textContent:'',chapters);
 }
 const EXT=/\.(pdf|txt|text|docx?|odt|rtf|md|markdown|x?html?|fb2)$/i;
 window.eddiIsDocument=name=>EXT.test(String(name||''));
 window.eddiPdfjs=pdfjs;
 window.eddiParseDocument=async function(file){
  const name=(file?.name||'').toLowerCase();
  if(name.endsWith('.pdf'))return readPdf(file);
  if(/\.te?xt$/.test(name))return readTxt(file);
  if(name.endsWith('.docx'))return readDocx(file);
  if(name.endsWith('.odt'))return readOdt(file);
  if(name.endsWith('.rtf'))return readRtf(file);
  if(/\.(md|markdown)$/.test(name))return readMd(file);
  if(/\.(x?html?)$/.test(name))return readHtml(file);
  if(name.endsWith('.fb2'))return readFb2(file);
  if(name.endsWith('.doc'))throw new Error('Old Word (.doc) files cannot be read. Open it in Word and choose Save As → .docx, then upload that.');
  throw new Error('This file type is not supported. Choose an EPUB, PDF, Word (.docx), text, Markdown, web page, RTF, ODT or FB2 file.');
 };
})();
