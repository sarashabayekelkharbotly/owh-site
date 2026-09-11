/* Grow the booking frame only while someone is actually using it.
   A dropdown inside a cross-origin iframe cannot escape the frame, so the frame
   must be tall enough for the open date picker — which would leave a slab of dead
   white space the rest of the time. Clicking into the frame moves focus to the
   iframe element in THIS document, which is the one signal that crosses the origin
   boundary, so poll for it and expand. Collapse again on a click outside (clicks
   inside the iframe never bubble out here, so this only fires for real ones). */
(function () {
  var wrap = document.querySelector('.booking-embed');
  if (!wrap) return;
  var frame = wrap.querySelector('iframe');
  if (!frame) return;

  window.setInterval(function () {
    if (document.activeElement === frame) wrap.classList.add('is-open');
  }, 200);

  document.addEventListener('click', function (e) {
    if (wrap.contains(e.target)) return;
    wrap.classList.remove('is-open');
    // blur too, or the poll above sees the iframe still focused and reopens it
    if (document.activeElement === frame) frame.blur();
  });
})();

/* Fade each block up as it arrives.
   The CSS hides .reveal only under .js-reveal, which is set here — so if this
   script is blocked or throws, nothing is ever hidden and the page reads exactly
   as it does today. Anyone who has asked for reduced motion, or whose browser
   has no IntersectionObserver, gets everything shown at once. */
(function () {
  var blocks = document.querySelectorAll('.reveal');
  if (!blocks.length) return;

  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still || !('IntersectionObserver' in window)) return;

  document.documentElement.classList.add('js-reveal');

  var fired = false;

  var seen = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      fired = true;
      entry.target.classList.add('in');
      seen.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

  blocks.forEach(function (b) { seen.observe(b); });

  function showAll() {
    blocks.forEach(function (b) { b.classList.add('in'); });
  }

  /* The whole page is hidden until something reveals it, so never trust the
     observer alone. If it has not fired once by the time the page has settled,
     assume it is not going to (an embedded webview, a snapshot renderer, an
     extension that stubbed it out) and simply show everything. */
  window.setTimeout(function () { if (!fired) showAll(); }, 2500);
  window.addEventListener('error', showAll);
})();
