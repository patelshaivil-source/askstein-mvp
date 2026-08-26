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
   Two live values are written to every [data-reveal] element each
   frame, from its current position — not a one-shot trigger:
     --rp  entrance progress: 0 below the fold → 1 once it reaches
           reading position, and it stays at 1 once passed (a normal
           "reveal as you arrive, stay readable" fade + rise).
     --dp  center proximity: 1 exactly at the viewport's vertical
           center, falling off toward 0 the further an element sits
           above OR below center — always live, never sticks. CSS
           uses --dp on heading-tier text to scale it up near the
           middle of the screen and down toward the top/bottom, the
           circular near/far stack effect, and --rp for the general
           fade-in. Reversible by design, so it scrubs directly with
           the reader's scroll. Motion here always serves the same
           purpose: reveal content as it's scrolled to, never decorate. */
(function(){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const els = Array.from(document.querySelectorAll('[data-reveal]'));
  if(!els.length) return;
  if(reduceMotion){
    els.forEach(el => { el.style.setProperty('--rp','1'); el.style.setProperty('--dp','1'); el.style.setProperty('--sd','0'); });
    return;
  }
  let raf = null;
  function update(){
    const vh = window.innerHeight;
    const start = vh * 0.92, end = vh * 0.42;
    const vCenter = vh * 0.5, maxDist = vh * 0.62;
    for(const el of els){
      const r = el.getBoundingClientRect();
      const top = r.top;
      let p = (start - top) / (start - end);
      if(p < 0) p = 0; else if(p > 1) p = 1;
      el.style.setProperty('--rp', p.toFixed(3));

      const centerY = top + r.height / 2;
      const dist = Math.abs(centerY - vCenter);
      let d = 1 - dist / maxDist;
      if(d < 0) d = 0; else if(d > 1) d = 1;
      el.style.setProperty('--dp', d.toFixed(3));

      // signed distance from viewport center, -1..1 — positive above
      // center, negative below, so text tilts away symmetrically on
      // either side like it's wrapped around a cylinder.
      let sd = (vCenter - centerY) / maxDist;
      if(sd > 1) sd = 1; else if(sd < -1) sd = -1;
      el.style.setProperty('--sd', sd.toFixed(3));
    }
    raf = null;
  }
  function request(){ if(raf === null) raf = requestAnimationFrame(update); }
  update();
  window.addEventListener('scroll', request, { passive:true });
  window.addEventListener('resize', request);
  document.addEventListener('visibilitychange', () => { if(!document.hidden) request(); });
})();
