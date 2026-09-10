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
    if (!wrap.contains(e.target)) wrap.classList.remove('is-open');
  });
})();
