/* =========================================================================
   Resume publisher.

   GitHub Pages is static hosting: a file picked in a browser has nowhere to
   persist. The only way it reaches other visitors is by landing in the repo,
   so this commits it through the GitHub Contents API.

   The token is read from the field at the moment you press Publish, held in a
   local variable for the duration of that request, and never written to
   localStorage, sessionStorage, a cookie, or any host other than api.github.com.
   ========================================================================= */
(function () {
  "use strict";

  var form = document.getElementById("pub-form");
  if (!form) return;

  var OWNER = "saikeshavareddych";
  var REPO = "saikeshavareddych.github.io";
  var PATH = "assets/Sai-Keshava-DevOps.pdf";
  var BRANCH = "main";
  var API = "https://api.github.com";

  var MAX_BYTES = 20 * 1024 * 1024;   /* hard stop */
  var WARN_BYTES = 5 * 1024 * 1024;   /* recruiters do not download 5MB PDFs */

  var drop = document.getElementById("drop");
  var picker = document.getElementById("file");
  var chosen = document.getElementById("chosen");
  var previewWrap = document.getElementById("preview");
  var tokenField = document.getElementById("token");
  var submit = document.getElementById("publish");
  var logEl = document.getElementById("log");

  var file = null;
  var blobURL = null;

  /* --- log ------------------------------------------------------------- */
  function log(msg, cls) {
    var line = document.createElement("div");
    if (cls) line.className = cls;
    line.textContent = msg;
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function bytes(n) {
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(0) + " KB";
    return (n / 1024 / 1024).toFixed(1) + " MB";
  }

  /* --- file selection -------------------------------------------------- */
  function accept(f) {
    if (!f) return;

    if (f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) {
      log("Rejected " + f.name + ": the resume has to be a PDF.", "is-alert");
      return;
    }
    if (f.size > MAX_BYTES) {
      log("Rejected " + f.name + ": " + bytes(f.size) + " is over the " + bytes(MAX_BYTES) + " limit.", "is-alert");
      return;
    }

    file = f;
    chosen.hidden = false;
    chosen.textContent = f.name + "  (" + bytes(f.size) + ")";
    submit.disabled = false;

    if (f.size > WARN_BYTES) {
      log("Note: " + bytes(f.size) + " is large for a resume. It will still publish.", "is-dim");
    }

    if (blobURL) URL.revokeObjectURL(blobURL);
    blobURL = URL.createObjectURL(f);
    previewWrap.innerHTML =
      '<div class="panel__bar"><i class="dot dot--ok"></i><span>preview, not yet published</span></div>';
    var frame = document.createElement("iframe");
    frame.className = "viewer";
    frame.src = blobURL;
    frame.title = "Preview of the resume you selected";
    previewWrap.appendChild(frame);
    previewWrap.hidden = false;

    log("Loaded " + f.name + ". This preview is local to your browser.", "is-dim");
  }

  picker.addEventListener("change", function () { accept(picker.files[0]); });

  drop.addEventListener("click", function () { picker.click(); });
  drop.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); picker.click(); }
  });

  ["dragenter", "dragover"].forEach(function (ev) {
    drop.addEventListener(ev, function (e) {
      e.preventDefault();
      drop.classList.add("is-over");
    });
  });
  ["dragleave", "drop"].forEach(function (ev) {
    drop.addEventListener(ev, function (e) {
      e.preventDefault();
      drop.classList.remove("is-over");
    });
  });
  drop.addEventListener("drop", function (e) {
    if (e.dataTransfer.files && e.dataTransfer.files[0]) accept(e.dataTransfer.files[0]);
  });

  /* --- base64 ---------------------------------------------------------- */
  function toBase64(f) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () {
        var s = String(fr.result);
        var comma = s.indexOf(",");
        resolve(comma === -1 ? s : s.slice(comma + 1));
      };
      fr.onerror = function () { reject(new Error("Could not read the file.")); };
      fr.readAsDataURL(f);
    });
  }

  /* --- publish --------------------------------------------------------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var token = tokenField.value.trim();
    if (!file) { log("Pick a PDF first.", "is-alert"); return; }
    if (!token) { log("A token is required to write to the repository.", "is-alert"); return; }

    submit.disabled = true;
    submit.textContent = "Publishing";

    var headers = {
      "Authorization": "Bearer " + token,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    };
    var contentsURL = API + "/repos/" + OWNER + "/" + REPO + "/contents/" + PATH;

    log("");
    log("Checking for an existing file at " + PATH);

    /* Does it already exist? If so we need its blob sha to replace it. */
    fetch(contentsURL + "?ref=" + BRANCH, { headers: headers })
      .then(function (r) {
        if (r.status === 404) { log("No file there yet. This will create one.", "is-dim"); return null; }
        if (r.status === 401) throw new Error("Token rejected (401). Check it has not expired.");
        if (r.status === 403) throw new Error("Forbidden (403). The token needs Contents: write on this repository.");
        if (!r.ok) throw new Error("GitHub returned " + r.status + " while checking the path.");
        return r.json();
      })
      .then(function (existing) {
        log("Encoding " + file.name);
        return toBase64(file).then(function (b64) {
          var body = {
            message: "chore: publish resume PDF",
            content: b64,
            branch: BRANCH
          };
          if (existing && existing.sha) {
            body.sha = existing.sha;
            log("Replacing the existing file.", "is-dim");
          }
          log("Committing to " + OWNER + "/" + REPO + " on " + BRANCH);
          return fetch(contentsURL, {
            method: "PUT",
            headers: headers,
            body: JSON.stringify(body)
          });
        });
      })
      .then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok) {
            throw new Error(data && data.message ? data.message : "Commit failed with " + r.status);
          }
          return data;
        });
      })
      .then(function (data) {
        log("");
        log("Published.", "is-ok");
        if (data.commit && data.commit.sha) {
          log("Commit " + data.commit.sha.slice(0, 7), "is-ok");
        }
        log("GitHub Pages usually rebuilds within a minute. The resume page will", "is-dim");
        log("show the document once the rebuild finishes.", "is-dim");

        var a = document.createElement("a");
        a.href = "resume.html";
        a.textContent = "Open the resume page";
        var wrap = document.createElement("div");
        wrap.appendChild(a);
        logEl.appendChild(wrap);

        submit.textContent = "Published";
      })
      .catch(function (err) {
        log("");
        log(err.message || "Publish failed.", "is-alert");
        submit.disabled = false;
        submit.textContent = "Publish to the site";
      })
      .then(function () {
        /* Drop the token regardless of outcome. */
        token = null;
        tokenField.value = "";
      });
  });

  window.addEventListener("pagehide", function () {
    tokenField.value = "";
    if (blobURL) URL.revokeObjectURL(blobURL);
  });
})();
