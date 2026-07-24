const OBJECTIVE_FIELD = "QUALE OBIETTIVO VUOI RAGGIUNGERE CON QUESTO INTERVENTO?";
const SERVICE_PARAM_KEYS = [
  "servizio",
  "cosa_ti_serve",
  "obiettivo",
  "objective",
  "quale_obiettivo_vuoi_raggiungere_con_questo_intervento",
  "quale-obiettivo-vuoi-raggiungere-con-questo-intervento",
  "Quale obiettivo vuoi raggiungere con questo intervento",
  "Quale obiettivo vuoi raggiungere con questo intervento?",
  OBJECTIVE_FIELD
];
const DEFAULT_SERVICE = "Elettricista";
let selectedService = DEFAULT_SERVICE;
let clientIp = null;
let userAgent = navigator.userAgent;
const submissionGiaTracciate = new Set();

function getCookie(name) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

async function recuperaIp() {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    clientIp = data.ip;
  } catch (e) {
    clientIp = null;
  }
}

function aggiornaUrlTally(iframe) {
  const src = iframe.dataset.tallySrc || iframe.src;
  const url = new URL(src);
  const fbc = getCookie("_fbc");
  const fbp = getCookie("_fbp");

  url.searchParams.set("settore", "elettricista");
  if (selectedService && selectedService !== DEFAULT_SERVICE) {
    SERVICE_PARAM_KEYS.forEach(function(key) {
      url.searchParams.set(key, selectedService);
    });
  } else {
    SERVICE_PARAM_KEYS.forEach(function(key) {
      url.searchParams.delete(key);
    });
  }
  if (fbc) url.searchParams.set("fbc", fbc);
  if (fbp) url.searchParams.set("fbp", fbp);
  if (clientIp) url.searchParams.set("client_ip", clientIp);
  url.searchParams.set("user_agent", userAgent);

  iframe.dataset.tallySrc = url.toString();
  return url.toString();
}

function iniettaParametri() {
  document.querySelectorAll("iframe[data-tally-src]").forEach(function(iframe) {
    aggiornaUrlTally(iframe);
  });
}

function caricaTally() {
  var assegnaSrc = function() {
    document.querySelectorAll("iframe[data-tally-src]:not([src])").forEach(function(e) {
      e.src = e.dataset.tallySrc;
    });
  };
  var d = document, w = "https://tally.so/widgets/embed.js",
    v = function() {
      if ("undefined" != typeof Tally) Tally.loadEmbeds();
      else assegnaSrc();
      window.setTimeout(assegnaSrc, 450);
    };
  if ("undefined" != typeof Tally) v();
  else if (d.querySelector('script[src="' + w + '"]') == null) {
    var s = d.createElement("script");
    s.src = w; s.onload = v; s.onerror = v;
    d.body.appendChild(s);
    window.setTimeout(v, 1400);
  } else {
    window.setTimeout(v, 600);
  }
}

function aggiornaServizio(service, shouldScroll) {
  selectedService = service || DEFAULT_SERVICE;
  const label = document.getElementById("selected-service-label");
  const trigger = document.querySelector('[data-service="' + CSS.escape(selectedService) + '"]');
  const displayLabel = trigger?.dataset.label || selectedService;
  if (label) label.textContent = displayLabel;

  document.querySelectorAll("[data-service]").forEach(function(el) {
    el.classList.toggle("is-selected", el.dataset.service === selectedService);
  });

  document.querySelectorAll("iframe[data-tally-src]").forEach(function(iframe) {
    const nextSrc = aggiornaUrlTally(iframe);
    iframe.src = nextSrc;
  });

  if (shouldScroll) {
    document.getElementById("form").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function setupServiceClicks() {
  document.querySelectorAll("[data-service]").forEach(function(el) {
    el.addEventListener("click", function(event) {
      event.preventDefault();
      const service = el.dataset.service;
      if (service) aggiornaServizio(service, true);
    });
  });
}

function setupCarousel() {
  const carousel = document.querySelector("[data-carousel]");
  if (!carousel) return;

  const slides = Array.from(carousel.querySelectorAll(".testimonial"));
  const dotsWrap = carousel.querySelector(".dots");
  const prev = carousel.querySelector(".prev");
  const next = carousel.querySelector(".next");
  let index = 0;
  let timer = null;

  function visibleSlides() {
    if (window.matchMedia("(max-width: 760px)").matches) return 1;
    if (window.matchMedia("(max-width: 1100px)").matches) return 2;
    return 3;
  }

  function maxIndex() {
    return Math.max(0, slides.length - visibleSlides());
  }

  function render(nextIndex) {
    const track = carousel.querySelector(".testimonial-track");
    const max = maxIndex();
    index = nextIndex > max ? 0 : nextIndex < 0 ? max : nextIndex;
    if (track && slides[0]) {
      const gap = parseFloat(window.getComputedStyle(track).columnGap || window.getComputedStyle(track).gap) || 0;
      const distance = slides[0].getBoundingClientRect().width + gap;
      track.style.transform = "translateX(-" + (index * distance) + "px)";
    }
    slides.forEach(function(slide, i) {
      slide.classList.toggle("active", i === index);
    });
    Array.from(dotsWrap.children).forEach(function(dot, i) {
      dot.classList.toggle("active", i === index);
      dot.setAttribute("aria-current", i === index ? "true" : "false");
    });
  }

  slides.forEach(function(_, i) {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "dot";
    dot.setAttribute("aria-label", "Vai alla recensione " + (i + 1));
    dot.addEventListener("click", function() {
      render(i);
    });
    dotsWrap.appendChild(dot);
  });

  prev.addEventListener("click", function() { render(index - 1); });
  next.addEventListener("click", function() { render(index + 1); });

  function start() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer = window.setInterval(function() {
      render(index + 1);
    }, 5200);
  }

  function stop() {
    if (timer) window.clearInterval(timer);
    timer = null;
  }

  carousel.addEventListener("mouseenter", stop);
  carousel.addEventListener("mouseleave", start);
  carousel.addEventListener("focusin", stop);
  carousel.addEventListener("focusout", start);
  window.addEventListener("resize", function() {
    render(Math.min(index, maxIndex()));
  });

  render(0);
  start();
}

window.addEventListener("message", function(event) {
  if (event.origin !== "https://tally.so") return;
  if (!event.data || event.data.event !== "Tally.FormSubmitted") return;

  const submissionId = event.data.payload && event.data.payload.id;
  if (!submissionId) return;

  if (submissionGiaTracciate.has(submissionId)) return;
  submissionGiaTracciate.add(submissionId);

  if (typeof fbq === "function") {
    fbq("track", "Lead", {
      content_name: event.data.payload.formName || "form"
    }, {
      eventID: submissionId
    });
  }
});

async function init() {
  setupServiceClicks();
  setupCarousel();
  iniettaParametri();
  caricaTally();

  recuperaIp().then(function() {
    iniettaParametri();
    document.querySelectorAll("iframe[data-tally-src]").forEach(function(iframe) {
      if (!iframe.src) iframe.src = iframe.dataset.tallySrc;
    });
  });

  let tentativi = 0;
  const interval = setInterval(function() {
    iniettaParametri();
    tentativi++;
    if (getCookie("_fbp") || tentativi > 10) {
      clearInterval(interval);
    }
  }, 300);
}

init();
