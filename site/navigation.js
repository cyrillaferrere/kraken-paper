/* Kraken Paper — navigation de présentation, aucune écriture d'état de simulation. */
(() => {
  "use strict";
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("dash-nav");
  if (!toggle || !nav) return;
  const desktop = window.matchMedia("(min-width: 1025px)");
  const links = Array.from(nav.querySelectorAll('a[href^="#"]'));
  let compact = false;
  try { compact = localStorage.getItem("kp-nav-compact") === "1"; } catch (_) {}
  function closeMobileMenu({ restoreFocus = false, keepLinkFocus = false } = {}) {
    if (!document.body.classList.contains("nav-open")) return;
    const focusWasInside = nav.contains(document.activeElement);
    document.body.classList.remove("nav-open");
    sync();
    if (restoreFocus || (focusWasInside && !keepLinkFocus)) toggle.focus();
  }
  function sync() {
    const isDesktop = desktop.matches;
    if (isDesktop) document.body.classList.remove("nav-open");
    document.body.classList.toggle("nav-collapsed", isDesktop && compact);
    const expanded = isDesktop ? !compact : document.body.classList.contains("nav-open");
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.setAttribute("aria-label", isDesktop ? (compact ? "Développer le menu" : "Réduire le menu") : (expanded ? "Fermer le menu" : "Ouvrir le menu"));
    nav.setAttribute("aria-hidden", String(!isDesktop && !expanded));
    links.forEach((a) => {
      a.title = a.querySelector(".nav-label")?.textContent || a.textContent.trim();
    });
    if (!isDesktop && !expanded) nav.setAttribute("inert", "");
    else nav.removeAttribute("inert");
  }
  toggle.addEventListener("click", () => {
    if (desktop.matches) {
      compact = !compact;
      try { localStorage.setItem("kp-nav-compact", compact ? "1" : "0"); } catch (_) {}
    } else document.body.classList.toggle("nav-open");
    sync();
  });
  links.forEach((a) => a.addEventListener("click", () => {
    if (!desktop.matches) closeMobileMenu({ keepLinkFocus: true });
    links.forEach((item) => item.removeAttribute("aria-current"));
    a.setAttribute("aria-current", "location");
  }));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("nav-open")) {
      closeMobileMenu({ restoreFocus: true });
    }
  });
  document.addEventListener("pointerdown", (e) => {
    if (!desktop.matches && document.body.classList.contains("nav-open") && !nav.contains(e.target) && !toggle.contains(e.target)) {
      closeMobileMenu();
    }
  });
  if (desktop.addEventListener) desktop.addEventListener("change", sync);
  else desktop.addListener(sync);
  window.addEventListener("hashchange", () => {
    if (!desktop.matches) closeMobileMenu();
    const active = links.find((a) => a.getAttribute("href") === location.hash);
    if (active) {
      links.forEach((a) => a.removeAttribute("aria-current"));
      active.setAttribute("aria-current", "location");
    }
  });
  const initial = links.find((a) => a.getAttribute("href") === location.hash) || links[0];
  if (initial) initial.setAttribute("aria-current", "location");
  sync();
})();
