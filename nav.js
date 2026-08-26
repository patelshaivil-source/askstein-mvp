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

/* ── scroll reveal ─────────────────────────────────────────
   Continuous, scroll-scrubbed: each [data-reveal] element's progress
   (0 at rest below the fold, 1 once it's reached reading position)
   is written to --rp every frame and read by CSS to drive fade,
   rise, and — on heading-tier elements — a grow-into-focus scale.
   Reversible by design, so it scrubs directly with the reader's
   scroll rather than firing once. Motion here always serves the
   same purpose: reveal content as it's scrolled to, never decorate. */
(function(){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const els = Array.from(document.querySelectorAll('[data-reveal]'));
  if(!els.length) return;
  if(reduceMotion){
    els.forEach(el => el.style.setProperty('--rp','1'));
    return;
  }
  let raf = null;
  function update(){
    const vh = window.innerHeight;
    const start = vh * 0.92, end = vh * 0.42;
    for(const el of els){
      const top = el.getBoundingClientRect().top;
      let p = (start - top) / (start - end);
      if(p < 0) p = 0; else if(p > 1) p = 1;
      el.style.setProperty('--rp', p.toFixed(3));
    }
    raf = null;
  }
  function request(){ if(raf === null) raf = requestAnimationFrame(update); }
  update();
  window.addEventListener('scroll', request, { passive:true });
  window.addEventListener('resize', request);
})();
