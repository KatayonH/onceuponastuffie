/* Once Upon a Stuffie */

// Amanda's Cal.com booking link, e.g. "amanda-stuffie/party" (from cal.com/amanda-stuffie/party).
const CAL_LINK = "";
const BRAND = "#D9405A";

document.documentElement.classList.add("js");

/* Mobile nav */
const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("site-nav");
if (toggle && nav) {
  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("is-open", open);
  };
  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
}

/* Footer year */
document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

/* Reveal on scroll */
const revealEls = document.querySelectorAll(".step, .about-photo, .about-copy, .section-head, .card, .booking-panel, .contact-intro, .contact-form");
if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("is-in"); io.unobserve(entry.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  revealEls.forEach((el, i) => {
    el.classList.add("reveal");
    el.style.transitionDelay = `${(i % 4) * 70}ms`;
    io.observe(el);
  });
}

/* Package picked -> shown in booking + passed to Cal.com notes */
let pickedPackage = "";
const pickedWrap = document.querySelector(".booking-picked");
document.querySelectorAll("[data-package]").forEach((btn) => {
  btn.addEventListener("click", () => {
    pickedPackage = btn.dataset.package;
    if (pickedWrap) {
      pickedWrap.hidden = false;
      pickedWrap.querySelector("[data-picked]").textContent = pickedPackage;
    }
    loadCal();
  });
});

/* Cal.com inline embed, loaded only when the booking section gets close */
const calEl = document.getElementById("cal-booking");
let calLoaded = false;

function loadCal() {
  if (calLoaded || !calEl) return;
  calLoaded = true;

  if (!CAL_LINK) {
    calEl.innerHTML = `
      <div class="cal-missing">
        <p><strong>The booking calendar is almost ready.</strong><br>In the meantime, send a note and we'll check your date.</p>
        <a class="btn btn-coral" href="#contact">Ask About My Date</a>
      </div>`;
    return;
  }

  (function (C, A, L) {
    const p = function (a, ar) { a.q.push(ar); };
    const d = C.document;
    C.Cal = C.Cal || function () {
      const cal = C.Cal; const ar = arguments;
      if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; }
      if (ar[0] === L) {
        const api = function () { p(api, arguments); };
        const namespace = ar[1]; api.q = api.q || [];
        if (typeof namespace === "string") { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]); }
        else p(cal, ar);
        return;
      }
      p(cal, ar);
    };
  })(window, "https://app.cal.com/embed/embed.js", "init");

  Cal("init", "booking", { origin: "https://cal.com" });
  calEl.innerHTML = "";
  Cal.ns.booking("inline", {
    elementOrSelector: "#cal-booking",
    calLink: CAL_LINK,
    config: Object.assign({ layout: "month_view", theme: "light" }, pickedPackage ? { notes: `Package: ${pickedPackage}` } : {}),
  });
  Cal.ns.booking("ui", {
    theme: "light",
    layout: "month_view",
    hideEventTypeDetails: false,
    cssVarsPerTheme: { light: { "cal-brand": BRAND } },
  });
}

if (calEl) {
  if ("IntersectionObserver" in window) {
    const calIO = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { loadCal(); calIO.disconnect(); }
    }, { rootMargin: "600px 0px" });
    calIO.observe(calEl);
  } else {
    loadCal();
  }
}

/* Contact form (Netlify Forms, sent without leaving the page) */
const form = document.querySelector(".contact-form");
if (form) {
  const status = form.querySelector(".form-status");
  const button = form.querySelector('button[type="submit"]');
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.classList.remove("is-error");
    status.textContent = "Sending…";
    button.disabled = true;
    try {
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(new FormData(form)).toString(),
      });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      status.textContent = "Thank you! Your note is on its way. I'll be in touch soon.";
    } catch {
      status.classList.add("is-error");
      status.textContent = "Something went wrong. Please try again in a moment.";
    } finally {
      button.disabled = false;
    }
  });
}
