// @ts-check
/**
 * DEMO ONLY. Never bundled into client sites (scripts/build.js only imports it
 * when site.mode === "demo", and the build fails if demo markup reaches a client build).
 *
 *  - Plan switcher: shows the site as Starter / Plus / Signature.
 *  - WhatsApp preview: intercepts wa.me links and shows the message instead of sending it.
 *  - Payment preview: Stripe test-mode deposit links explain themselves instead of opening.
 *  - "Try your colours": the look's accent and type options, as a client would choose them in site.json → brand.
 */
import { inkFor } from "../core/lib/brand.js";

const PLANS = ["starter", "plus", "signature"];
const STORAGE_KEY = "sitefloor-demo-plan";
const TOAST_MS = 4200;

/** @param {import("../core/js/core.js").Ctx} _ctx */
export function initDemo(_ctx) {
  planSwitcher();
  whatsappPreview();
  paymentPreview();
  demoNotes();
  lookPicker();
}

/** Stripe test-mode links (demo deposits) say what would happen instead of opening a checkout. */
function paymentPreview() {
  const toast = /** @type {HTMLElement|null} */ (document.querySelector("[data-tier-toast]"));
  document.addEventListener("click", (e) => {
    const a = /** @type {HTMLAnchorElement|null} */ (/** @type {Element} */ (e.target).closest('a[href^="https://buy.stripe.com/test_"]'));
    if (!a || !toast) return;
    e.preventDefault();
    toast.textContent = "On a live site this opens the studio's own Stripe page to pay the deposit. Nothing is charged in this demo.";
    toast.classList.add("on");
    setTimeout(() => toast.classList.remove("on"), TOAST_MS);
  });
}

/** Links a demo can't really follow (a made-up Google Form, say) carry data-demo-note: show that instead of opening them. */
function demoNotes() {
  const toast = /** @type {HTMLElement|null} */ (document.querySelector("[data-tier-toast]"));
  document.addEventListener("click", (e) => {
    const a = /** @type {HTMLElement|null} */ (/** @type {Element} */ (e.target).closest("a[data-demo-note]"));
    if (!a || !toast) return;
    e.preventDefault();
    toast.textContent = a.dataset.demoNote ?? "";
    toast.classList.add("on");
    setTimeout(() => toast.classList.remove("on"), TOAST_MS);
  });
}

const INKS = ["#140F0A", "#F5EFE6"]; // Noir's dark and light text; the demo kit only has Noir

/** Accent and type options from the look, applied live. Kept for this visit only. */
function lookPicker() {
  const toggle = /** @type {HTMLButtonElement|null} */ (document.querySelector("[data-look-toggle]"));
  const panel = /** @type {HTMLElement|null} */ (document.querySelector("[data-look-panel]"));
  if (!toggle || !panel) return;
  const root = document.documentElement;
  toggle.hidden = false; // only useful with JavaScript
  toggle.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute("aria-expanded", String(!panel.hidden));
  });
  panel.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement|null} */ (/** @type {Element} */ (e.target).closest("button"));
    if (!b) return;
    const accent = b.dataset.accent;
    const type = b.dataset.typePick;
    if (accent) {
      root.style.setProperty("--accent", accent);
      root.style.setProperty("--accent-2", `color-mix(in srgb, ${accent} 72%, ${INKS[1]})`);
      root.style.setProperty("--on-accent", inkFor(accent, INKS));
    }
    if (type) root.dataset.type = type;
    for (const x of panel.querySelectorAll(accent ? "[data-accent]" : "[data-type-pick]")) x.setAttribute("aria-pressed", String(x === b));
  });
}

function planSwitcher() {
  const toast = /** @type {HTMLElement|null} */ (document.querySelector("[data-tier-toast]"));
  const gate = /** @type {HTMLElement|null} */ (document.querySelector("[data-tier-gate]"));
  const pagePlan = document.body.dataset.pagePlan ?? "starter";
  const rank = (/** @type {string} */ p) => PLANS.indexOf(p);
  /** @type {ReturnType<typeof setTimeout>|undefined} */
  let toastTimer;

  /** @param {string} plan @param {boolean} announce */
  const apply = (plan, announce) => {
    try { localStorage.setItem(STORAGE_KEY, plan); } catch { /* storage unavailable: plan just won't persist */ }
    for (const b of document.querySelectorAll("[data-tier-pick]")) {
      if (/** @type {HTMLElement} */ (b).closest("[data-demo-ribbon]")) b.setAttribute("aria-pressed", String(/** @type {HTMLElement} */ (b).dataset.tierPick === plan));
    }
    for (const el of document.querySelectorAll("[data-tier]")) {
      el.classList.toggle("tier-off", rank(/** @type {HTMLElement} */ (el).dataset.tier ?? "starter") > rank(plan));
    }
    if (gate) gate.hidden = rank(pagePlan) <= rank(plan);
    if (announce && toast) {
      // Each kit words its own plans (src/kits/<kit>/demo.json), carried on the ribbon.
      const ribbon = /** @type {HTMLElement|null} */ (document.querySelector("[data-demo-ribbon]"));
      toast.textContent = ribbon?.dataset[`plan${plan[0].toUpperCase()}${plan.slice(1)}`] ?? "";
      toast.classList.add("on");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("on"), TOAST_MS);
      document.querySelectorAll(".rv").forEach((el) => el.classList.add("in"));
    }
  };

  let saved = "signature";
  try { saved = localStorage.getItem(STORAGE_KEY) ?? "signature"; } catch { /* default */ }
  apply(PLANS.includes(saved) ? saved : "signature", false);
  document.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement|null} */ (/** @type {Element} */ (e.target).closest("[data-tier-pick]"));
    if (b) apply(b.dataset.tierPick ?? "signature", true);
  });
}

function whatsappPreview() {
  const sheet = /** @type {HTMLElement|null} */ (document.querySelector("[data-wa-preview]"));
  if (!sheet) return;
  const bubble = /** @type {HTMLElement} */ (sheet.querySelector("[data-wa-bubble]"));
  const send = /** @type {HTMLAnchorElement} */ (sheet.querySelector("[data-wa-send]"));
  const close = /** @type {HTMLButtonElement} */ (sheet.querySelector("[data-wa-close]"));
  /** @type {HTMLElement|null} */
  let returnFocus = null;

  const hide = () => { sheet.hidden = true; sheet.classList.remove("on"); returnFocus?.focus(); };
  document.addEventListener("click", (e) => {
    const a = /** @type {HTMLAnchorElement|null} */ (/** @type {Element} */ (e.target).closest('a[href^="https://wa.me/"]'));
    if (!a || a === send) return;
    e.preventDefault();
    returnFocus = a;
    const text = new URL(a.href).searchParams.get("text") ?? "";
    bubble.textContent = text;
    const time = document.createElement("small");
    time.textContent = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    bubble.append(time);
    send.href = a.href;
    sheet.hidden = false;
    requestAnimationFrame(() => sheet.classList.add("on"));
    close.focus();
  });
  close.addEventListener("click", hide);
  sheet.addEventListener("click", (e) => { if (e.target === sheet) hide(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !sheet.hidden) hide(); });
}
