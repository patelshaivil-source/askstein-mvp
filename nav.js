/* shared header/sidebar behavior for AskStein sub-pages */
/* Progressive-enhancement flag: style.css only hides [data-reveal]
   content once this class is present, so content stays visible by
   default if this script never runs (JS disabled/blocked/errors). */
document.documentElement.classList.add('js');

/* ── page-entrance fade ────────────────────────────────────────
   The page you land on (About, Corpus, Documentation, Contact, etc.)
   fades + rises in on arrival, instead of just snapping into view.
   Double rAF: the first frame lets the browser paint the hidden
   ".js .page-shift" state from CSS, the second flips on ".in" so the
   transition actually has something to animate from. Skipped
   entirely under prefers-reduced-motion (CSS makes it a no-op there
   too, but no sense doing the rAF dance for nothing). */
if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const pg = document.querySelector('.page-shift');
      if(pg) pg.classList.add('in');
    });
  });
}

const $ = id => document.getElementById(id);

function sidebarFocusable(){
  return Array.from($('sidebar').querySelectorAll('a[href], button'))
    .filter(el => el.offsetParent !== null);
}
/* While the sidebar is open, the rest of the page (main content +
   footer, where present) is marked inert — removed from the tab
   order and from assistive-tech navigation — so keyboard and screen
   reader users can't accidentally wander into content sitting behind
   an open panel. Guarded with null checks so this is a no-op on any
   page that doesn't yet have a #main-content element. */
function setBackgroundInert(on){
  const main = document.getElementById('main-content');
  const footer = document.querySelector('.site-footer');
  if(main) main.toggleAttribute('inert', on);
  if(footer) footer.toggleAttribute('inert', on);
}
function toggleSidebar(){
  const open = !$('sidebar').classList.contains('on');
  $('sidebar').classList.toggle('on', open);
  $('sidebar-overlay').classList.toggle('on', open);
  document.body.classList.toggle('sidebar-open', open);
  $('sidebar').setAttribute('aria-hidden', String(!open));
  /* inert removes the closed panel from the accessibility tree and
     the tab order entirely (aria-hidden alone doesn't stop a focused
     link from receiving focus) — pulled before focusing into the
     panel so the newly-visible links are actually reachable */
  $('sidebar').toggleAttribute('inert', !open);
  $('hamburgerBtn').setAttribute('aria-expanded', String(open));
  setBackgroundInert(open);
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
  $('sidebar').setAttribute('inert','');
  $('hamburgerBtn').setAttribute('aria-expanded','false');
  setBackgroundInert(false);
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
   Fade + rise, staggered by position within each immediate parent,
   fires once as content enters the lower ~80% of the viewport.
   Motion here always serves the same purpose: reveal, never decorate. */
(function(){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const els = Array.from(document.querySelectorAll('[data-reveal]'));
  if(!els.length) return;
  if(reduceMotion || !('IntersectionObserver' in window)){
    els.forEach(el => el.classList.add('in'));
    return;
  }
  const groups = new Map();
  els.forEach(el => {
    const parent = el.parentElement;
    const i = groups.get(parent) || 0;
    el.style.setProperty('--reveal-i', i % 6);
    groups.set(parent, i + 1);
  });
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('in');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px -20% 0px' });
  els.forEach(el => io.observe(el));
})();
