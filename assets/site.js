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

/* ---------------------------------------------------------------
   Tour lightbox. The grid crops every photo to 4:3; this shows the
   whole frame with its caption. Built from the markup already on the
   page, so a tour with no JS still works — it just doesn't zoom.
   --------------------------------------------------------------- */
(function () {
  var grid = document.querySelector('.tour-grid');
  if (!grid) return;

  var figures = [].slice.call(grid.querySelectorAll('figure'));
  if (!figures.length) return;

  var shots = figures.map(function (fig) {
    var img = fig.querySelector('img');
    var cap = fig.querySelector('figcaption');
    return { src: img.getAttribute('src'), alt: img.getAttribute('alt') || '',
             caption: cap ? cap.textContent.trim() : '' };
  });

  // make each tile operable by keyboard as well as mouse
  figures.forEach(function (fig, i) {
    var img = fig.querySelector('img');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tour-open';
    btn.setAttribute('aria-label', (shots[i].caption || shots[i].alt) + ' — open larger');
    img.parentNode.insertBefore(btn, img);
    btn.appendChild(img);
    btn.addEventListener('click', function () { open(i); });
  });

  var rtl = document.documentElement.getAttribute('dir') === 'rtl';
  var box = document.createElement('div');
  box.className = 'lb' + (shots.length < 2 ? ' single' : '');
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', rtl ? 'معرض الصور' : 'Photo gallery');
  box.innerHTML =
    '<img alt="">' +
    '<p class="lb-cap"><span class="lb-text"></span><span class="lb-count"></span></p>' +
    '<button type="button" class="lb-close" aria-label="' + (rtl ? 'إغلاق' : 'Close') + '">\u2715</button>' +
    '<button type="button" class="lb-prev" aria-label="' + (rtl ? 'السابق' : 'Previous') + '">\u2039</button>' +
    '<button type="button" class="lb-next" aria-label="' + (rtl ? 'التالي' : 'Next') + '">\u203A</button>';
  document.body.appendChild(box);

  var lbImg = box.querySelector('img'),
      lbText = box.querySelector('.lb-text'),
      lbCount = box.querySelector('.lb-count'),
      current = 0, lastFocus = null;

  function show(i) {
    current = (i + shots.length) % shots.length;
    var s = shots[current];
    lbImg.src = s.src;
    lbImg.alt = s.alt;
    lbText.textContent = s.caption;
    lbCount.textContent = (current + 1) + ' / ' + shots.length;
  }
  function open(i) {
    lastFocus = document.activeElement;
    show(i);
    box.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    box.querySelector('.lb-close').focus();
  }
  function close() {
    box.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  box.querySelector('.lb-close').addEventListener('click', close);
  box.querySelector('.lb-prev').addEventListener('click', function () { show(current - 1); });
  box.querySelector('.lb-next').addEventListener('click', function () { show(current + 1); });
  box.addEventListener('click', function (e) { if (e.target === box) close(); });

  document.addEventListener('keydown', function (e) {
    if (!box.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    // in RTL the left arrow should still move the way the eye expects
    else if (e.key === 'ArrowLeft')  show(current + (rtl ? 1 : -1));
    else if (e.key === 'ArrowRight') show(current + (rtl ? -1 : 1));
  });
})();

/* The burger used to carry its own onclick attribute, copied into all 24 pages.
   One copy lives here instead, so the behaviour cannot drift between them. */
(function () {
  var btn = document.querySelector('.nav-toggle');
  var list = document.querySelector('.nav-links');
  if (!btn || !list) return;
  btn.addEventListener('click', function () {
    var open = list.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
})();

/* Dropdowns open on hover and on keyboard focus, both in CSS. Touch has
   neither: a tap would follow the link before the menu was ever seen. So on a
   touch screen wide enough to still be showing the desktop nav, the first tap
   opens the menu and the second follows the link. Everywhere else this does
   nothing — under 860px the burger panel already shows every sub-link. */
(function () {
  var nav = document.querySelector('.nav-links');
  if (!nav || !document.documentElement.closest) return;

  function shut() {
    var open = nav.querySelectorAll('.nav-item.open');
    for (var i = 0; i < open.length; i++) open[i].classList.remove('open');
  }

  nav.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('.nav-item > a');
    if (!link) return;
    if (window.innerWidth <= 860) return;
    if (!(window.matchMedia && window.matchMedia('(hover: none)').matches)) return;
    var item = link.parentNode;
    if (item.classList.contains('open')) return;   // second tap: let it through
    e.preventDefault();
    shut();
    item.classList.add('open');
  });

  document.addEventListener('click', function (e) { if (!nav.contains(e.target)) shut(); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    shut();
    if (document.activeElement && nav.contains(document.activeElement)) document.activeElement.blur();
  });
})();
