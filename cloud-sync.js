/* Optional Supabase cloud reading-position sync. EPUB files never leave the device. */
(()=>{'use strict';
const cfg=window.EPUB_SYNC_CONFIG||{},enabled=/^https:\/\/[^/]+\.supabase\.co$/.test(cfg.url||'')&&!!cfg.anonKey;
const $=id=>document.getElementById(id);
const storageKey='epub-sync-session';
let session=null,pending=new Map(),timers=new Map(),busy=false;
const base=(cfg.url||'').replace(/\/$/,'');
function message(t){const e=$('sync-status');if(e)e.textContent=t}
function readSession(){try{return JSON.parse(localStorage.getItem(storageKey)||'null')}catch(_){return null}}
function saveSession(){try{if(session)localStorage.setItem(storageKey,JSON.stringify(session));else localStorage.removeItem(storageKey)}catch(_){}}
async function request(path,method='GET',body,authorized=true){
 if(!enabled)throw Error('Cloud sync has not been configured.');
 const headers={'apikey':cfg.anonKey,'Content-Type':'application/json'};
 if(authorized){if(!session?.access_token)throw Error('Not signed in');headers.Authorization='Bearer '+session.access_token}
 const res=await fetch(base+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});
 if(!res.ok){let err;try{err=await res.json()}catch(_){}throw Error(err?.msg||err?.message||err?.error_description||'Sync request failed ('+res.status+')')}
 if(res.status===204)return null;
 const text=await res.text();return text?JSON.parse(text):null;
}
async function renew(){if(!session?.refresh_token)return false;
 if(session.expires_at&&Date.now()<session.expires_at*1000-60000)return true;
 const r=await request('/auth/v1/token?grant_type=refresh_token','POST',{refresh_token:session.refresh_token},false);
 session={...r,expires_at:Math.floor(Date.now()/1000)+(r.expires_in||3600)};saveSession();return true}
async function authorized(path,method,body){await renew();return request(path,method,body)}
async function remotePosition(id){if(!enabled||!session?.access_token||!id)return null;
 try{const rows=await authorized('/rest/v1/reading_positions?book_id=eq.'+encodeURIComponent(id)+'&select=chapter_index,paragraph_index,updated_at&limit=1');return rows?.[0]||null}
 catch(e){message('Could not get saved position: '+e.message);return null}}
async function push(id,position){if(!session?.access_token||!enabled||!id)return;
 try{await authorized('/rest/v1/reading_positions?on_conflict=user_id,book_id','POST',{user_id:session.user.id,book_id:id,chapter_index:position.index,paragraph_index:position.p,updated_at:new Date(position.t||Date.now()).toISOString()});message('Reading place synced across your devices.')}
 catch(e){message('Sync unavailable: '+e.message)}}
function queue(id,position){if(!enabled||!session?.access_token||!id)return;
 pending.set(id,{...position});clearTimeout(timers.get(id));timers.set(id,setTimeout(()=>{const p=pending.get(id);pending.delete(id);if(p)push(id,p)},2500))}
function updateUI(){const button=$('sync-signin'),out=$('sync-signout'),email=$('sync-email'),wrap=$('sync-controls');if(!wrap)return;
 if(!enabled){wrap.hidden=false;message('Cloud sync is not connected yet. It needs a private database project set up by the site owner. Your books and place are still saved on this device.');if(button)button.disabled=true;if(email)email.disabled=true;if(out)out.hidden=true;return}
 wrap.hidden=false;if(out)out.hidden=!session;if(email)email.hidden=!!session;if(button)button.hidden=!!session;
 message(session?'Cloud sync connected. Only your reading position is synced; EPUB files remain on each device.':'Optional: sign in by email to sync your reading position between devices.')}
async function signIn(){const email=$('sync-email')?.value.trim();if(!email||!email.includes('@')){message('Enter your email address first.');return}
 const button=$('sync-signin');button.disabled=true;message('Sending sign-in link…');
 try{await request('/auth/v1/otp','POST',{email,create_user:true,options:{email_redirect_to:location.origin+location.pathname}},false);message('Check your email for the sign-in link, then open it on this device.')}
 catch(e){message('Could not send link: '+e.message)}finally{button.disabled=false}}
async function signOut(){try{if(session)await authorized('/auth/v1/logout','POST')}catch(_){}session=null;saveSession();updateUI()}
function acceptRedirect(){const h=new URLSearchParams(location.hash.slice(1));if(h.get('access_token')&&h.get('refresh_token')){
 session={access_token:h.get('access_token'),refresh_token:h.get('refresh_token'),token_type:'bearer',expires_at:Math.floor(Date.now()/1000)+Number(h.get('expires_in')||3600)};
 // Supabase returns an authenticated user profile via /auth/v1/user; complete it before displaying connected.
 history.replaceState(null,'',location.pathname+location.search);return request('/auth/v1/user').then(user=>{session.user=user;saveSession();updateUI()},()=>{session=null;saveSession();updateUI()});}return Promise.resolve()}
async function init(){session=readSession();await acceptRedirect();if(session&&!session.user){session=null;saveSession()}updateUI();
 $('sync-signin')?.addEventListener('click',signIn);$('sync-signout')?.addEventListener('click',signOut)}
window.epubCloud={enabled,remotePosition,queue,get connected(){return !!session?.user}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();