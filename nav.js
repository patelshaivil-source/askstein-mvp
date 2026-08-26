/* shared header/sidebar behavior for AskStein sub-pages */
const $ = id => document.getElementById(id);

function sidebarFocusable(){
  return Array.from($('sidebar').querySelectorAll('a[href], button'))
    .filter(el => el.offsetParent !== null);
}
function toggleSidebar(){
  const open = !$('sidebar').classList.contains('on');
  $('sidebar').classList.toggle('on', open);
  $('sidebar-overlay').classList.toggle('on', open);
  document.body.classList.toggle('sidebar-open', open);
  $('sidebar').setAttribute('aria-hidden', String(!open));
  $('hamburgerBtn').setAttribute('aria-expanded', String(open));
  if(open){
    const f = sidebarFocusable();
    if(f.length) f[0].focus();
  }
}
function closeSidebar(){
  const wasOpen = $('sidebar').classList.contains('on');
  $('sidebar').classList.remove('on');
  $('sidebar-overlay').classList.remove('on');
  document.body.classList.remove('sidebar-open');
  $('sidebar').setAttribute('aria-hidden','true');
  $('hamburgerBtn').setAttribute('aria-expanded','false');
  if(wasOpen) $('hamburgerBtn').focus();
}
/* Explicitly cycle every Tab press rather than only intervening at the
   first/last boundary — relying on native tab order for the "middle"
   case doesn't hold up under all input methods, so drive focus
   ourselves on every Tab while the sidebar is open. */
document.addEventListener('keydown', e => {
  if(e.key === 'Escape') closeSidebar();
  if(e.key === 'Tab' && $('sidebar').classList.contains('on')){
    const f = sidebarFocusable();
    if(!f.length) return;
    e.preventDefault();
    let idx = f.indexOf(document.activeElement);
    if(idx === -1) idx = 0;
    idx = e.shiftKey ? (idx - 1 + f.length) % f.length : (idx + 1) % f.length;
    f[idx].focus();
  }
});
