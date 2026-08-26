/* shared header/sidebar behavior for AskStein sub-pages */
const $ = id => document.getElementById(id);

function toggleSidebar(){
  const open = !$('sidebar').classList.contains('on');
  $('sidebar').classList.toggle('on', open);
  $('sidebar-overlay').classList.toggle('on', open);
  document.body.classList.toggle('sidebar-open', open);
  $('sidebar').setAttribute('aria-hidden', String(!open));
  $('hamburgerBtn').setAttribute('aria-expanded', String(open));
}
function closeSidebar(){
  $('sidebar').classList.remove('on');
  $('sidebar-overlay').classList.remove('on');
  document.body.classList.remove('sidebar-open');
  $('sidebar').setAttribute('aria-hidden','true');
  $('hamburgerBtn').setAttribute('aria-expanded','false');
}
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeSidebar(); });
