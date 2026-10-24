/* Book Reader v1.7.0 — local bookmarks and portable reading-place links. */
(()=>{'use strict';
const $=id=>document.getElementById(id),app=()=>window.chapterApp;
const key=id=>'br-bookmarks:'+id;
function current(){const s=app()?.state;return s?.key&&s.chapters?.length?s:null}
function list(s){try{return JSON.parse(localStorage.getItem(key(s.key))||'[]')}catch(_){return []}}
function saveList(s,rows){try{localStorage.setItem(key(s.key),JSON.stringify(rows))}catch(e){message('Could not save bookmarks: '+e.message)}}
function message(s){const e=$('bookmark-status');if(e)e.textContent=s}
function jump(index,p){const s=current();if(!s)return;app().stop();s.index=Math.max(0,Math.min(s.chapters.length-1,index));s.p=Math.max(0,Math.min(s.chapters[s.index].paragraphs.length-1,p));app().render();document.querySelector('#text .current')?.scrollIntoView({block:'start',behavior:'smooth'});}
function add(){const s=current();if(!s)return message('Open a book first.');const ch=s.chapters[s.index];const label=prompt('Bookmark name:',ch.title+' — paragraph '+(s.p+1));if(label===null)return;const rows=list(s);rows.push({id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),name:label.trim().slice(0,100)||'Bookmark',index:s.index,p:s.p});saveList(s,rows);draw();message('Bookmark saved on this device.')}
function draw(){const s=current(),e=$('bookmark-list');if(!e)return;e.replaceChildren();if(!s){message('Open a book to save bookmarks.');return}const rows=list(s);if(!rows.length){const t=document.createElement('small');t.textContent='No bookmarks for this book yet.';e.append(t);return}
 for(const row of rows){const wrap=document.createElement('div');wrap.className='bookmark-row';const go=document.createElement('button');go.textContent=row.name+' · '+(s.chapters[row.index]?.title||'Chapter')+' ¶'+(row.p+1);go.onclick=()=>jump(row.index,row.p);const del=document.createElement('button');del.textContent='Remove';del.setAttribute('aria-label','Remove '+row.name);del.onclick=()=>{saveList(s,list(s).filter(x=>x.id!==row.id));draw()};wrap.append(go,del);e.append(wrap)}
}
async function share(){const s=current();if(!s)return message('Open a book first.');const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('book',s.key);u.searchParams.set('chapter',String(s.index));u.searchParams.set('paragraph',String(s.p));const link=u.toString();
 try{await navigator.clipboard.writeText(link);message('Reading-place link copied. The other device must have the same EPUB in My Library.')}
 catch(_){const box=$('bookmark-link');box.hidden=false;box.value=link;box.select();message('Copy this link. The other device needs its own copy of the same EPUB.')}
}
function pending(){const u=new URL(location.href),id=u.searchParams.get('book'),ch=Number(u.searchParams.get('chapter')),p=Number(u.searchParams.get('paragraph'));if(!id||!Number.isSafeInteger(ch)||!Number.isSafeInteger(p)||ch<0||p<0)return null;return{id,ch,p}}
let incoming=pending(),working=false;
async function tryLink(){
 if(!incoming||working)return;const lib=window.chapterLibrary;if(!lib?.available)return;
 working=true;
 try{const rec=await lib.get(incoming.id);if(!rec){message('Shared place: add the same EPUB to My Library on this device, then open it.');return}
 const s=current();if(s?.key!==incoming.id){await app().openFromLibrary(incoming.id)}
 const now=current();if(now?.key!==incoming.id)return;
 jump(incoming.ch,incoming.p);message('Opened the shared reading position.');incoming=null;
 const u=new URL(location.href);u.searchParams.delete('book');u.searchParams.delete('chapter');u.searchParams.delete('paragraph');history.replaceState(null,'',u);
 }catch(e){message('Unable to open shared place: '+e.message)}
 finally{working=false}
}
function onBookOpen(){draw();if(incoming){const s=current();if(s?.key===incoming.id){jump(incoming.ch,incoming.p);message('Opened shared reading position.');incoming=null;const u=new URL(location.href);['book','chapter','paragraph'].forEach(x=>u.searchParams.delete(x));history.replaceState(null,'',u)}else message('Shared link received. Open the matching EPUB to jump to the shared place.')} }
function init(){$('bookmark-add').onclick=add;$('bookmark-share').onclick=share;draw();setTimeout(tryLink,1300)}
window.readerBookmarks={onBookOpen,tryLink};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();