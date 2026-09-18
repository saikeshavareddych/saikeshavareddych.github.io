/* =========================================================================
   Resume viewer.

   The PDF lives in the repo; until it does, show the empty state rather than
   a broken embed.

   Embedding a PDF in an iframe is reliable on desktop and unreliable on
   phones - iOS Safari and several Android browsers render a blank box or
   silently refuse. So on touch/narrow viewports we hand over an explicit
   open-and-download card instead of pretending the embed works.
   ========================================================================= */
(function () {
  "use strict";

  var wrap = document.getElementById("resume-viewer");
  if (!wrap) return;

  var PDF = wrap.dataset.src;
  var ready = document.getElementById("resume-ready");
  var empty = document.getElementById("resume-empty");
  var dl = document.getElementById("resume-download");
  var slot = ready.querySelector(".viewer-slot");

  function show(el) {
    ready.hidden = el !== ready;
    empty.hidden = el !== empty;
  }

  function embeddable() {
    if (window.matchMedia("(pointer: coarse)").matches) return false;
    return window.innerWidth >= 760;
  }

  /* Assume missing until proven otherwise, so a 404 never renders as a
     broken grey box. */
  show(empty);

  fetch(PDF, { method: "HEAD" })
    .then(function (r) {
      if (!r.ok) return;
      var type = r.headers.get("content-type") || "";
      if (type && type.indexOf("pdf") === -1 && type.indexOf("octet-stream") === -1) return;

      if (embeddable()) {
        var frame = document.createElement("iframe");
        frame.className = "viewer";
        frame.src = PDF + "#view=FitH";
        frame.title = "Resume of Sai Keshava Reddy Chinthala";
        frame.loading = "lazy";
        slot.appendChild(frame);
      } else {
        slot.innerHTML =
          '<div class="viewer-empty">' +
          '<p class="lede" style="margin-inline:auto">The resume is a two-page PDF.</p>' +
          '<p style="margin-inline:auto;color:var(--ink-dim);font-size:var(--t-sm)">' +
          'Phone browsers do not embed PDFs reliably, so here is the document itself. ' +
          'Everything in it is also on this page.</p>' +
          '<div class="btn-row" style="justify-content:center;margin-top:1.25rem">' +
          '<a class="btn btn--primary" href="' + PDF + '" target="_blank" rel="noopener">Open the PDF</a>' +
          '<a class="btn btn--ghost" href="' + PDF + '" download>Download</a>' +
          "</div></div>";
      }

      if (dl) dl.hidden = false;
      show(ready);
    })
    .catch(function () { /* offline or blocked: the empty state already stands */ });
})();
