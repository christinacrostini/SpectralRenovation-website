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
    document.getElementById("reviewBox").innerHTML =
      '<div><strong>Name:</strong> ' + esc(val("firstName")) + " " + esc(val("lastName")) + "</div>" +
      '<div><strong>Email:</strong> ' + esc(val("email")) + "</div>" +
      '<div><strong>Phone:</strong> ' + esc(val("phone") || "(none)") + " (" + esc(val("contactMethod")) + ")</div>" +
      '<div style="margin-top:8px"><strong>Location:</strong> ' + esc(val("address") || "(none)") + ", " + esc(val("city") || "(none)") + " " + esc(val("zip")) + "</div>" +
      "<div><strong>Project:</strong> " + esc(val("projectType") || "(none)") + "</div>" +
      '<div style="margin-top:8px"><strong>Budget:</strong> ' + esc(val("budget") || "(none)") + "</div>" +
      "<div><strong>Timing:</strong> " + esc(val("timing") || "(none)") + "</div>";
  }

  next.addEventListener("click", function () { if (valid(cur)) show(cur + 1); });
  back.addEventListener("click", function () { show(cur - 1); });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!document.getElementById("cn").checked) { alert("Please agree to be contacted to submit."); return; }

    // Collect text fields only (skip file input)
    var payload = {};
    ["firstName", "lastName", "email", "phone", "contactMethod", "address", "city", "zip",
     "serviceArea", "projectType", "description", "designStatus", "budget", "timing", "urgency",
     "company"].forEach(function (k) { payload[k] = val(k); });
    payload.source = location.href;

    send.disabled = true;
    var sendLabel = send.innerHTML;
    send.innerHTML = "Sending...";

    fetch("/api/consultation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
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
      var err = document.getElementById("formError");
      if (err) err.style.display = "block";
    });
  });

  show(1);
})();
