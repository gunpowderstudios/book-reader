/* Shared E.D.D.i. site footer. The main reader's app-version is the version source. */
(()=>{'use strict';
function render(){
 let footer=document.getElementById('credits');
 if(!footer){
  footer=document.createElement('footer');
  footer.id='eddi-site-footer';
  footer.setAttribute('aria-label','Gunpowder Studios copyright and information');
  footer.innerHTML='<p>© 2026 <a href="https://www.gunpowderstudios.co.uk/apps/" target="_blank" rel="noopener noreferrer">Gunpowder Studios</a> <span aria-hidden="true">·</span> <a href="https://eddithereader.co.uk/about.html">About E.D.D.i.</a></p>';
  document.body.appendChild(footer);
 }

}
const style=document.createElement('style');
style.textContent='#eddi-site-footer{position:relative;display:block;clear:both;width:100%;margin:24px auto 0;padding:17px 14px 26px;background:#1b3227;border-top:1px solid #42614b;color:#c1d7c6;text-align:center;font:13px/1.6 system-ui,sans-serif}#eddi-site-footer p{margin:0}#eddi-site-footer a{color:#e6d374}#eddi-site-footer #eddi-site-version{font-size:12px;color:#c1d7c6}#credits #eddi-site-version{font-size:11px}';
document.head.appendChild(style);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
})();