(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");

  // Current-year copyright
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Header shadow on scroll
  var header = document.querySelector(".site-header");
  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Mobile navigation
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");
  var toggleLabel = toggle.querySelector(".sr-only");

  function setMenu(open) {
    toggle.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("is-open", open);
    toggleLabel.textContent = open ? "Close menu" : "Open menu";
  }

  toggle.addEventListener("click", function () {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });
  menu.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      toggle.focus();
    }
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".primary-nav")) setMenu(false);
  });

  // Move focus to section targets after in-page navigation (for keyboard / screen reader users)
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function () {
      var id = link.getAttribute("href").slice(1);
      var target = id && document.getElementById(id);
      if (!target || id === "top") return;
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      setTimeout(function () { target.focus({ preventScroll: true }); }, 0);
    });
  });

  // Reveal-on-scroll with light staggering
  var reveals = document.querySelectorAll(".reveal");
  var groups = new Map();
  reveals.forEach(function (el) {
    var parent = el.parentElement;
    var i = groups.get(parent) || 0;
    el.style.setProperty("--delay", Math.min(i * 0.08, 0.4) + "s");
    groups.set(parent, i + 1);
  });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // Highlight the nav link for the section in view
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-menu a[href^="#"]:not(.btn)'));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          var active = a.getAttribute("href") === "#" + entry.target.id;
          a.classList.toggle("is-active", active);
          if (active) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }
})();

// Partner With Us form (modal) — submissions are emailed via FormSubmit
(function () {
  "use strict";

  var modal = document.getElementById("partner-modal");
  var form = document.getElementById("partner-form");
  if (!modal || !form || typeof modal.showModal !== "function") return; // fall back to mailto links

  var ENDPOINT = "https://formsubmit.co/ajax/business@sweeticeusa.com";
  var status = form.querySelector(".form-status");
  var submit = form.querySelector(".form-submit");
  var email = form.querySelector("#pf-email");

  function setStatus(text, type) {
    status.textContent = text;
    status.className = "form-status" + (type ? " is-" + type : "");
  }

  document.querySelectorAll("[data-partner-form]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      setStatus("");
      modal.showModal();
      form.querySelector("#pf-first").focus();
    });
  });

  modal.querySelector("[data-close-modal]").addEventListener("click", function () { modal.close(); });
  modal.addEventListener("click", function (e) { if (e.target === modal) modal.close(); });

  email.addEventListener("input", function () { email.removeAttribute("aria-invalid"); });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!email.value.trim() || !email.checkValidity()) {
      email.setAttribute("aria-invalid", "true");
      setStatus("Please enter a valid email address.", "error");
      email.focus();
      return;
    }

    var data = {};
    new FormData(form).forEach(function (value, key) { data[key] = value; });
    if (data._honey) return; // spam bot
    var name = [data["First name"], data["Last name"]].filter(Boolean).join(" ");
    data._subject = "Partnership Inquiry – Sweet Ice" + (name ? " (" + name + ")" : "");
    data._template = "table";
    data._captcha = "false";

    submit.disabled = true;
    submit.textContent = "Sending…";
    setStatus("");

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data)
    })
      .then(function (res) { return res.json().then(function (json) { return { ok: res.ok, json: json }; }); })
      .then(function (r) {
        if (!r.ok || String(r.json.success) !== "true") throw new Error(r.json.message || "Send failed");
        form.reset();
        setStatus("Thank you! Your message has been sent. We’ll be in touch soon.", "success");
      })
      .catch(function () {
        setStatus("Sorry, something went wrong. Please email us at business@sweeticeusa.com.", "error");
      })
      .then(function () {
        submit.disabled = false;
        submit.textContent = "Submit";
      });
  });
})();
