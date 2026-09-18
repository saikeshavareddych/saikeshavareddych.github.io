/* =========================================================================
   Access gate for the publish page.

   What this is: a lock that keeps the publish UI out of the hands of anyone
   who wanders onto the page. The key is never stored here in plaintext - only
   a PBKDF2-SHA256 derivation of it, at 210,000 iterations with a random salt.

   What this is NOT: a security boundary. This file is public, so the check
   itself is readable and, given enough time, a weak key is guessable offline.
   The thing that actually protects the repository is the GitHub token: without
   one, someone who gets past this gate still cannot write a single byte.

   Two ways in, both keeping the key out of any network request:
     upload.html#<key>   - read from the fragment, which browsers never send
     the prompt on the page
   The fragment is wiped from the address bar as soon as it is read, so it does
   not sit in the URL bar or in a screenshot.
   ========================================================================= */
(function () {
  "use strict";

  var SALT = "a855703cccb3a5491eb62c9674f2919b";
  var EXPECT = "6fce53378b977952a48dfe10dba023855d57432d75e83a18f1281cad166b0352";
  var ITER = 210000;

  var gate = document.getElementById("gate");
  var vault = document.getElementById("vault");
  var form = document.getElementById("gate-form");
  var input = document.getElementById("gate-key");
  var msg = document.getElementById("gate-msg");
  var btn = document.getElementById("gate-go");
  if (!gate || !vault) return;

  function hexToBytes(hex) {
    var out = new Uint8Array(hex.length / 2);
    for (var i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
    return out;
  }

  function bytesToHex(buf) {
    var v = new Uint8Array(buf), s = "";
    for (var i = 0; i < v.length; i++) s += ("0" + v[i].toString(16)).slice(-2);
    return s;
  }

  /* Constant-time-ish compare. The real defence is the token, but there is no
     reason to leak timing on the way. */
  function same(a, b) {
    if (a.length !== b.length) return false;
    var diff = 0;
    for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  function derive(key) {
    var enc = new TextEncoder();
    return crypto.subtle
      .importKey("raw", enc.encode(key), { name: "PBKDF2" }, false, ["deriveBits"])
      .then(function (material) {
        return crypto.subtle.deriveBits(
          { name: "PBKDF2", salt: hexToBytes(SALT), iterations: ITER, hash: "SHA-256" },
          material,
          256
        );
      })
      .then(bytesToHex);
  }

  function unlock() {
    gate.hidden = true;
    vault.hidden = false;
    document.dispatchEvent(new CustomEvent("gate:open"));
  }

  function reject(text) {
    msg.textContent = text;
    msg.hidden = false;
    input.value = "";
    input.focus();
    btn.disabled = false;
    btn.textContent = "Unlock";
  }

  function attempt(key, fromURL) {
    if (!key) return;
    if (!window.crypto || !crypto.subtle) {
      reject("This browser cannot run the check. Open the page over https.");
      return;
    }
    btn.disabled = true;
    btn.textContent = "Checking";
    derive(key).then(function (got) {
      if (same(got, EXPECT)) {
        unlock();
      } else {
        reject(fromURL ? "That key in the address did not match." : "That key did not match.");
      }
    }).catch(function () {
      reject("The check could not run. Open the page over https rather than from a file.");
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    msg.hidden = true;
    attempt(input.value, false);
  });

  /* Key supplied in the fragment: read it, then wipe it from the address bar
     before anything else can see it. */
  function tryFragment() {
    var frag = window.location.hash.replace(/^#/, "");
    if (!frag) return false;
    var key = decodeURIComponent(frag.replace(/^k=/, ""));
    history.replaceState(null, "", window.location.pathname + window.location.search);
    attempt(key, true);
    return true;
  }

  /* Editing the fragment on an already-open page is a same-document
     navigation, so nothing reloads and this script never re-runs. Listen for
     it, otherwise pasting the key onto an open tab does nothing. */
  window.addEventListener("hashchange", function () {
    if (vault.hidden) tryFragment();
  });

  if (!tryFragment()) input.focus();
})();
