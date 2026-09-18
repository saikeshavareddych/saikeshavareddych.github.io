/* =========================================================================
   Resume viewer. The PDF lives in the repo; until it does, show the empty
   state instead of a broken embed.
   ========================================================================= */
(function () {
  "use strict";

  var wrap = document.getElementById("resume-viewer");
  if (!wrap) return;

  var PDF = wrap.dataset.src;
  var ready = document.getElementById("resume-ready");
  var empty = document.getElementById("resume-empty");
  var dl = document.getElementById("resume-download");

  function show(el) {
    ready.hidden = el !== ready;
    empty.hidden = el !== empty;
  }

  /* Assume missing until proven otherwise, so a 404 never renders as a
     broken grey box. */
  show(empty);

  fetch(PDF, { method: "HEAD" })
    .then(function (r) {
      if (!r.ok) return;
      var type = r.headers.get("content-type") || "";
      if (type && type.indexOf("pdf") === -1 && type.indexOf("octet-stream") === -1) return;

      var frame = document.createElement("iframe");
      frame.className = "viewer";
      frame.src = PDF + "#view=FitH";
      frame.title = "Resume of Sai Keshava Reddy";
      frame.loading = "lazy";
      ready.querySelector(".viewer-slot").appendChild(frame);

      if (dl) dl.hidden = false;
      show(ready);
    })
    .catch(function () { /* offline or blocked: the empty state already stands */ });
})();
