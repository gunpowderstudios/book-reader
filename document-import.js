/* E.D.D.i optional PDF and plain-text imports. EPUB parsing is unchanged. */
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
  return String(t).replace(/\b[A-Z][A-Z'’-]{3,}\b/g,w=>(/^[IVXLCDM]+$/.test(w)||!/[AEIOUY]/.test(w))?w:w[0]+w.slice(1).toLowerCase());
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
   g.fillStyle=kind==='pdf'?'#c0392b':'#5f8f6e';g.beginPath();
   if(g.roundRect)g.roundRect(W-bw-10,H-42,bw,30,8);else g.rect(W-bw-10,H-42,bw,30);
   g.fill();g.fillStyle='#fff';g.fillText(label,W-bw/2-10,H-20);
   return c.toDataURL('image/jpeg',0.75);
  }catch(_){return null}
 }
 function isPageNumber(l){return /^(page\s*)?\d{1,4}$/i.test(l)||/^[-–—]\s*\d{1,4}\s*[-–—]$/.test(l)}
 async function pageParagraphs(page){
  const data=await page.getTextContent();
  // Group text pieces into lines using their position, so we know where the real paragraph gaps are.
  const lines=[];let cur=null;
  const seen=[];
  for(const item of data.items){
   if(typeof item.str!=='string')continue;
   // Some PDFs draw the same text twice (outlines, shadows). Read it once.
   if(item.str.trim()&&item.transform){const x=item.transform[4],y=item.transform[5];if(seen.some(q=>q.s===item.str&&Math.abs(q.x-x)<2&&Math.abs(q.y-y)<2))continue;seen.push({s:item.str,x,y})}
   const y=item.transform?item.transform[5]:0,h=Math.abs(item.height||item.transform&&item.transform[3]||10)||10;
   if(!cur||Math.abs(y-cur.y)>h*0.5){cur={y,h,text:''};lines.push(cur)}
   cur.text+=item.str;
   if(item.hasEOL){cur.eol=true;cur=null}
  }
  const rows=lines.map(l=>({y:l.y,h:l.h,text:clean(l.text)})).filter(l=>l.text);
  while(rows.length&&isPageNumber(rows[0].text))rows.shift();      // page numbers at the top or bottom are not read aloud
  while(rows.length&&isPageNumber(rows[rows.length-1].text))rows.pop();
  if(!rows.length)return [];
  const gaps=[];for(let i=1;i<rows.length;i++){const g=Math.abs(rows[i-1].y-rows[i].y);if(g>0)gaps.push(g)}
  gaps.sort((a,b)=>a-b);const normal=gaps.length?gaps[Math.floor(gaps.length/2)]:0;
  // Lines set in clearly larger type than the rest are headings: keep each one as its own paragraph.
  const hs=rows.map(r=>r.h).sort((a,b)=>a-b),bodyH=hs[Math.floor(hs.length/2)]||10;
  const isHead=r=>r.h>=bodyH*1.3&&r.text.length<=100;
  const paras=[];let buf=[];
  for(let i=0;i<rows.length;i++){
   const head=isHead(rows[i]),prevHead=i>0&&isHead(rows[i-1]);
   if(i>0&&(head||prevHead||(normal&&Math.abs(rows[i-1].y-rows[i].y)>normal*1.45))){if(buf.length)paras.push(joinLines(buf));buf=[]}
   buf.push(rows[i].text);
  }
  if(buf.length)paras.push(joinLines(buf));
  // Pages with no clear gaps at all (one huge block): fall back to sentence-ending short lines.
  if(paras.length===1&&rows.length>6)return reflowWrapped(rows.map(r=>r.text)).map(softCaps);
  return paras.filter(Boolean).map(softCaps);
 }
 async function readPdf(file){
  const pdfLib=await pdfjs();
  const task=pdfLib.getDocument({data:new Uint8Array(await file.arrayBuffer())});
  let pdf;
  try{
   pdf=await task.promise;
   const chapters=[];let carry='';
   let cover=null;
   try{const p1=await pdf.getPage(1),v0=p1.getViewport({scale:1}),vp=p1.getViewport({scale:Math.min(2,400/v0.width)}),cv=document.createElement('canvas');cv.width=Math.ceil(vp.width);cv.height=Math.ceil(vp.height);await p1.render({canvasContext:cv.getContext('2d'),viewport:vp}).promise;cover=badgeCover('pdf',file.name,cv)}catch(_){cover=badgeCover('pdf',file.name.replace(/\.pdf$/i,''),null)}
   for(let pageNo=1;pageNo<=pdf.numPages;pageNo++){
    const page=await pdf.getPage(pageNo);
    const paragraphs=await pageParagraphs(page);
    // A sentence that runs over the page break is read as one piece: move the start of it to the next page.
    if(carry&&paragraphs.length&&/^[a-z]/.test(paragraphs[0])){paragraphs[0]=carry+' '+paragraphs[0]}
    else if(carry){const last=chapters[chapters.length-1];if(last)last.paragraphs.push(carry)}
    carry='';
    if(paragraphs.length){
     const last=paragraphs[paragraphs.length-1];
     if(pageNo<pdf.numPages&&last&&!END.test(last)&&paragraphs.length>0){carry=paragraphs.pop()}
    }
    if(paragraphs.length)chapters.push({title:'Page '+pageNo,paragraphs});
    else if(carry){/* whole page was one unfinished paragraph: keep carrying it */}
   }
   if(carry){const last=chapters[chapters.length-1];if(last)last.paragraphs.push(carry);else chapters.push({title:'Page 1',paragraphs:[carry]})}
   if(!chapters.length)throw new Error('No selectable text found. Scanned PDFs need OCR, which is not supported yet.');
   return {title:file.name.replace(/\.pdf$/i,''),author:'PDF document',cover,chapters};
  }finally{if(pdf)await pdf.destroy().catch(()=>{});else await task.destroy().catch(()=>{})}
 }
 const HEADING=/^(chapter|part|book|section|act|canto|prologue|epilogue|preface|foreword|introduction)\b[\s\w.:'’-]{0,60}$/i;
 async function readTxt(file){
  const raw=await file.text();
  const paragraphs=splitText(raw.replace(/^﻿/,''));
  if(!paragraphs.length)throw new Error('The text file is empty.');
  // A whole book in one chapter is hard to move around in, so split at chapter headings, or into parts.
  const chapters=[];let cur=null;
  for(const p of paragraphs){
   if(p.length<=70&&HEADING.test(p)){cur={title:p,paragraphs:[]};chapters.push(cur);continue}
   if(!cur){cur={title:'Beginning',paragraphs:[]};chapters.push(cur)}
   cur.paragraphs.push(p);
  }
  let result=chapters.filter(c=>c.paragraphs.length);
  const headed=chapters.filter(c=>c.title!=='Beginning').length;
  if(headed<2){
   result=[];const size=80;
   for(let i=0;i<paragraphs.length;i+=size)result.push({title:paragraphs.length>size*1.5?'Part '+(result.length+1):'Text',paragraphs:paragraphs.slice(i,i+size)});
  }
  return {title:file.name.replace(/\.txt$/i,''),author:'Text document',cover:badgeCover('txt',file.name.replace(/\.txt$/i,''),null),chapters:result};
 }
 window.eddiParseDocument=async function(file){
  const name=(file?.name||'').toLowerCase();
  if(name.endsWith('.pdf'))return readPdf(file);
  if(name.endsWith('.txt'))return readTxt(file);
  throw new Error('Unsupported format. Choose an EPUB, PDF or TXT file.');
 };
})();
