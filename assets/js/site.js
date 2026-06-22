/* Spectral Renovation & Design — shared site JS (multi-page) */
(function () {
  "use strict";

  // ---------- Header: scroll state + active nav ----------
  var header = document.getElementById("siteHeader");
  var isHome = document.body.classList.contains("home");

  function updateHeader() {
    if (!header) return;
    if (!isHome || window.scrollY > 60) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  if (header) {
    if (!isHome) header.classList.add("scrolled");
    window.addEventListener("scroll", updateHeader, { passive: true });
    updateHeader();
  }

  // active nav link by current path
  var path = location.pathname.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
  if (path === "") path = "/";
  document.querySelectorAll(".nav__link").forEach(function (a) {
    var href = a.getAttribute("href").replace(/\.html$/, "");
    if (href === path || (href !== "/" && path.indexOf(href) === 0)) a.classList.add("active");
  });

  // ---------- Mobile nav ----------
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ---------- Year ----------
  var yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();

  // ---------- Portfolio filters ----------
  var filters = document.querySelectorAll(".filter");
  if (filters.length) {
    filters.forEach(function (b) {
      b.addEventListener("click", function () {
        filters.forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        var f = b.dataset.filter;
        document.querySelectorAll("#pfGrid .pf-item").forEach(function (it) {
          it.style.display = (f === "all" || it.dataset.type === f) ? "" : "none";
        });
      });
    });
  }

  // ---------- Radio cards ----------
  document.querySelectorAll(".radio-card input").forEach(function (i) {
    i.addEventListener("change", function () {
      document.querySelectorAll('.radio-card input[name="' + i.name + '"]').forEach(function (x) {
        x.closest(".radio-card").classList.toggle("checked", x.checked);
      });
    });
  });

  // ---------- Multi-step consultation form ----------
  var form = document.getElementById("consultForm");
  if (!form) return;

  var steps = Array.prototype.slice.call(document.querySelectorAll(".form-step"));
  var TOTAL = steps.length;
  var cur = 1;
  var back = document.getElementById("fBack");
  var next = document.getElementById("fNext");
  var send = document.getElementById("fSend");

  // ----- File upload: show selected files -----
  var MAX_FILES = 5;
  var fileInput = document.getElementById("im");
  if (fileInput) {
    fileInput.addEventListener("change", function () {
      var label = fileInput.closest(".upload");
      if (!label) return;
      var t = label.querySelector(".upload__t");
      var d = label.querySelector(".upload__d");
      var n = fileInput.files.length;
      if (n === 0) {
        if (t) t.textContent = "Drop images, or browse";
        if (d) d.textContent = "JPG, PNG, HEIC · up to 5 files";
        return;
      }
      var names = Array.prototype.slice.call(fileInput.files).slice(0, MAX_FILES)
        .map(function (f) { return f.name; }).join(", ");
      if (t) t.textContent = n === 1 ? "1 photo selected" : n + " photos selected";
      if (d) d.textContent = (n > MAX_FILES ? "First " + MAX_FILES + " will be sent: " : "") + names;
    });
  }

  // Downscale an image file to a base64 JPEG (keeps payload small). Falls back to raw.
  function fileToBase64(file, maxEdge, quality) {
    return new Promise(function (resolve) {
      if (!/^image\//i.test(file.type) && !/\.(jpe?g|png|gif|webp|heic|heif)$/i.test(file.name)) {
        resolve(null); return;
      }
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        try {
          var scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
          var w = Math.max(1, Math.round(img.width * scale));
          var h = Math.max(1, Math.round(img.height * scale));
          var c = document.createElement("canvas");
          c.width = w; c.height = h;
          c.getContext("2d").drawImage(img, 0, 0, w, h);
          var dataUrl = c.toDataURL("image/jpeg", quality);
          URL.revokeObjectURL(url);
          resolve(dataUrl.split(",")[1] || null);
        } catch (e) { URL.revokeObjectURL(url); resolve(null); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  function collectAttachments() {
    if (!fileInput || !fileInput.files.length) return Promise.resolve([]);
    var files = Array.prototype.slice.call(fileInput.files).slice(0, MAX_FILES);
    var budget = 3.0 * 1024 * 1024; // ~3MB of image bytes, stays under platform request limit
    var used = 0;
    var out = [];
    var chain = Promise.resolve();
    files.forEach(function (f) {
      chain = chain.then(function () {
        return fileToBase64(f, 1600, 0.72).then(function (b64) {
          if (!b64) return;
          var bytes = b64.length * 0.75;
          if (used + bytes > budget) return; // skip if over budget
          used += bytes;
          out.push({ filename: f.name.replace(/\.(heic|heif)$/i, ".jpg"), content: b64 });
        });
      });
    });
    return chain.then(function () { return out; });
  }

  function esc(s) {
    return String(s || "").replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function val(n) {
    var el = form.querySelector('[name="' + n + '"]');
    if (el && el.type === "radio") {
      var c = form.querySelector('[name="' + n + '"]:checked');
      return c ? c.value : "";
    }
    return el ? el.value : "";
  }
  function show(n) {
    cur = Math.max(1, Math.min(TOTAL, n));
    steps.forEach(function (s) { s.classList.toggle("active", parseInt(s.dataset.step) === cur); });
    document.querySelectorAll(".form-progress__item").forEach(function (p) {
      var s = parseInt(p.dataset.s);
      p.classList.remove("done", "current");
      if (s < cur) p.classList.add("done");
      else if (s === cur) p.classList.add("current");
    });
    back.style.visibility = cur === 1 ? "hidden" : "visible";
    if (cur === TOTAL) { next.style.display = "none"; send.style.display = "inline-flex"; review(); }
    else { next.style.display = "inline-flex"; send.style.display = "none"; }
  }
  function valid(n) {
    var st = steps[n - 1], ok = true;
    st.querySelectorAll("input[required]").forEach(function (i) {
      if (!i.value.trim()) { i.style.borderColor = "#a44a3f"; ok = false; }
      else { i.style.borderColor = ""; }
    });
    if (n === 3 && !st.querySelector('input[name="projectType"]:checked')) {
      ok = false; alert("Please choose a project type.");
    }
    return ok;
  }
  function review() {
    var n = fileInput ? fileInput.files.length : 0;
    document.getElementById("reviewBox").innerHTML =
      '<div><strong>Name:</strong> ' + esc(val("firstName")) + " " + esc(val("lastName")) + "</div>" +
      '<div><strong>Email:</strong> ' + esc(val("email")) + "</div>" +
      '<div><strong>Phone:</strong> ' + esc(val("phone") || "(none)") + " (" + esc(val("contactMethod")) + ")</div>" +
      '<div style="margin-top:8px"><strong>Location:</strong> ' + esc(val("address") || "(none)") + ", " + esc(val("city") || "(none)") + " " + esc(val("zip")) + "</div>" +
      "<div><strong>Project:</strong> " + esc(val("projectType") || "(none)") + "</div>" +
      '<div style="margin-top:8px"><strong>Budget:</strong> ' + esc(val("budget") || "(none)") + "</div>" +
      "<div><strong>Timing:</strong> " + esc(val("timing") || "(none)") + "</div>" +
      (n ? '<div style="margin-top:8px"><strong>Photos:</strong> ' + n + " attached</div>" : "");
  }

  next.addEventListener("click", function () { if (valid(cur)) show(cur + 1); });
  back.addEventListener("click", function () { show(cur - 1); });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!document.getElementById("cn").checked) { alert("Please agree to be contacted to submit."); return; }

    var payload = {};
    ["firstName", "lastName", "email", "phone", "contactMethod", "address", "city", "zip",
     "serviceArea", "projectType", "description", "designStatus", "budget", "timing", "urgency",
     "company"].forEach(function (k) { payload[k] = val(k); });
    payload.source = location.href;

    send.disabled = true;
    var sendLabel = send.innerHTML;
    send.innerHTML = "Sending...";
    var errEl = document.getElementById("formError");
    if (errEl) errEl.style.display = "none";

    collectAttachments().then(function (attachments) {
      payload.attachments = attachments;
      return fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }).then(function (r) {
      if (!r.ok) throw new Error("Request failed");
      return r.json();
    }).then(function () {
      form.style.display = "none";
      var fp = document.getElementById("formProgress");
      if (fp) fp.style.display = "none";
      document.getElementById("thanks").style.display = "block";
      window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 140, behavior: "smooth" });
    }).catch(function () {
      send.disabled = false;
      send.innerHTML = sendLabel;
      if (errEl) errEl.style.display = "block";
    });
  });

  show(1);
})();
