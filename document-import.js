/* E.D.D.i optional PDF and plain-text imports. EPUB parsing is unchanged. */
(function(){
 'use strict';
 const PDF_JS='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
 const PDF_WORKER='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
 let pdfModule;
 function clean(s){return String(s||'').replace(/\s+/g,' ').trim()}
 function splitText(text){
  const blocks=String(text).replace(/\r\n?/g,'\n').split(/\n\s*\n/).map(clean).filter(Boolean);
  if(blocks.length>1)return blocks;
  return String(text).replace(/\r\n?/g,'\n').split(/\n/).map(clean).filter(Boolean);
 }
 async function pdfjs(){
  if(!pdfModule)pdfModule=import(PDF_JS).then(mod=>{mod.GlobalWorkerOptions.workerSrc=PDF_WORKER;return mod}).catch(err=>{pdfModule=null;throw new Error('PDF reader could not load. Check your internet connection: '+err.message)});
  return pdfModule;
 }
 async function readPdf(file){
  const pdfLib=await pdfjs();
  const task=pdfLib.getDocument({data:new Uint8Array(await file.arrayBuffer())});
  let pdf;
  try{
   pdf=await task.promise;
   const chapters=[];
   for(let pageNo=1;pageNo<=pdf.numPages;pageNo++){
    const page=await pdf.getPage(pageNo);
    const data=await page.getTextContent();
    let lines=[],line='';
    for(const item of data.items){
     if(typeof item.str!=='string')continue;
     const word=item.str;
     line+=word+(item.hasEOL?'':' ');
     if(item.hasEOL){if(clean(line))lines.push(clean(line));line=''}
    }
    if(clean(line))lines.push(clean(line));
    // One chapter per page makes PDF navigation usable without changing the EPUB renderer.
    const text=lines.join('\n');
    const paragraphs=splitText(text);
    if(paragraphs.length)chapters.push({title:'Page '+pageNo,paragraphs});
   }
   if(!chapters.length)throw new Error('No selectable text found. Scanned PDFs need OCR, which is not supported yet.');
   return {title:file.name.replace(/\.pdf$/i,''),author:'PDF document',cover:null,chapters};
  }finally{if(pdf)await pdf.destroy().catch(()=>{});else await task.destroy().catch(()=>{})}
 }
 async function readTxt(file){
  const raw=await file.text();
  const paragraphs=splitText(raw.replace(/^\uFEFF/,''));
  if(!paragraphs.length)throw new Error('The text file is empty.');
  return {title:file.name.replace(/\.txt$/i,''),author:'Text document',cover:null,chapters:[{title:'Text',paragraphs}]};
 }
 window.eddiParseDocument=async function(file){
  const name=(file?.name||'').toLowerCase();
  if(name.endsWith('.pdf'))return readPdf(file);
  if(name.endsWith('.txt'))return readTxt(file);
  throw new Error('Unsupported format. Choose an EPUB, PDF or TXT file.');
 };
})();
