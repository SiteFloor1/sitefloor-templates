// @ts-check
/**
 * Browser entry shared by every site. The build generates a small entry file
 * that imports this plus only the features a site uses, then calls boot().
 *
 * Responsibilities: live open/closed status, mobile menu, scroll reveals,
 * starting each feature found on the page, and a tiny shared store so
 * features can share data (e.g. the chair board tells build-your-cut who is free).
 */
import { zonedNow, openStatus, statusLabel, formatTime12 } from "../lib/hours.js";
import { waUrl } from "../lib/whatsapp.js";
import { bookingHref } from "../lib/booking.js";

/**
 * @typedef {object} SiteData  runtime subset of site.json (see scripts/build.js → clientData)
 * @property {"demo"|"client"} mode
 * @property {string} name
 * @property {string} whatsapp
 * @property {string} phone
 * @property {import("../lib/booking.js").Booking} booking
 * @property {import("../lib/hours.js").Hours} hours
 * @property {Record<string, string>} messages
 * @property {string[]} staff
 * @property {any[]} services
 * @property {any[]} extras
 * @property {any} chairBoard
 * @property {any} [queue]
 * @property {any} [loyalty]
 * @property {any} [memberships]
 * @property {any} [vouchers]
 */
/**
 * @typedef {object} Ctx
 * @property {SiteData} data
 * @property {Record<string, any>} providers
 * @property {() => import("../lib/hours.js").ZonedNow} now
 * @property {() => import("../lib/hours.js").OpenStatus} status
 * @property {(text: string) => string} waHref
 * @property {(text: string) => string} bookHref where Book buttons go (WhatsApp with the message, or the shop's booking app)
 * @property {(key: string, value: unknown) => void} share
 * @property {(key: string, fn: (value: any) => void) => void} watch
 * @property {(fn: () => void) => void} everyMinute
 */
/** @typedef {(root: HTMLElement, ctx: Ctx) => void} FeatureInit */

const REFRESH_MS = 30_000;

/**
 * @param {{ features: Record<string, FeatureInit>, providers: Record<string, any>, demo: ((ctx: Ctx) => void) | null }} setup
 */
export function boot({ features, providers, demo }) {
  const raw = document.getElementById("site-data")?.textContent;
  if (!raw) { console.error("[sitefloor] #site-data is missing; interactive features are disabled"); return; }
  /** @type {SiteData} */
  const data = JSON.parse(raw);

  /** @type {Map<string, unknown>} */ const store = new Map();
  /** @type {Map<string, Set<(v: any) => void>>} */ const watchers = new Map();
  /** @type {Set<() => void>} */ const tickers = new Set();

  /** @type {Ctx} */
  const ctx = {
    data,
    providers,
    now: () => zonedNow(new Date(), data.hours.timezone),
    status: () => openStatus(data.hours, ctx.now()),
    waHref: (text) => waUrl(data.whatsapp, text),
    bookHref: (text) => bookingHref(data.booking, data, text),
    share(key, value) { store.set(key, value); watchers.get(key)?.forEach((fn) => fn(value)); },
    watch(key, fn) {
      if (!watchers.has(key)) watchers.set(key, new Set());
      watchers.get(key)?.add(fn);
      if (store.has(key)) fn(store.get(key));
    },
    everyMinute(fn) { tickers.add(fn); },
  };

  liveStatus(ctx);
  mobileMenu();
  motionPause();
  if (demo) demo(ctx);

  // Features start in page order. Every ~40 ms the loop hands the phone back for a moment, so starting a
  // page with many features never blocks taps and scrolling in one long task.
  const start = async () => {
    let since = performance.now();
    for (const el of document.querySelectorAll("[data-feature]")) {
      const root = /** @type {HTMLElement} */ (el);
      const id = root.dataset.feature ?? "";
      const init = features[id];
      if (!init) continue; // feature has no browser code
      try { init(root, ctx); root.dataset.ready = ""; } catch (err) {
        console.error(`[sitefloor] feature "${id}" failed to start`, err);
        root.dataset.featureError = "true";
      }
      if (performance.now() - since > 40) { await new Promise((r) => setTimeout(r, 0)); since = performance.now(); }
    }
    reveals();
  };
  start();

  const tick = () => { for (const fn of tickers) { try { fn(); } catch (err) { console.error("[sitefloor] refresh failed", err); } } };
  setInterval(tick, REFRESH_MS);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) tick(); });
}

/**
 * "Pause" for moving hero parts (WCAG 2.2.2). Sets <html data-motion="paused"> (CSS stops animations under [data-motion];
 * the hero film listens for "sf-motion"), remembered for the visit. Hidden when the visitor already asks for reduced motion.
 */
function motionPause() {
  const btns = /** @type {HTMLButtonElement[]} */ ([...document.querySelectorAll("[data-motion-pause]")]);
  if (!btns.length || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const KEY = "sf-motion";
  /** @param {boolean} paused */
  const apply = (paused) => {
    if (paused) document.documentElement.dataset.motion = "paused"; else delete document.documentElement.dataset.motion;
    for (const b of btns) {
      // One pattern (WCAG): the label says what pressing does; no aria-pressed on top of it.
      const label = b.querySelector("[data-motion-label]");
      if (label) label.textContent = paused ? "Play" : "Pause";
      b.setAttribute("aria-label", paused ? "Play the moving background" : "Pause the moving background");
    }
    document.dispatchEvent(new CustomEvent("sf-motion", { detail: { paused } }));
  };
  let saved = false;
  try { saved = sessionStorage.getItem(KEY) === "paused"; } catch { /* storage unavailable */ }
  for (const b of btns) {
    b.hidden = false;
    b.addEventListener("click", () => {
      const paused = document.documentElement.dataset.motion !== "paused";
      try { sessionStorage.setItem(KEY, paused ? "paused" : "playing"); } catch { /* storage unavailable */ }
      apply(paused);
    });
  }
  apply(saved);
}

/** Open/closed chips, the visit card detail line and today's row in the hours table. @param {Ctx} ctx */
function liveStatus(ctx) {
  const paint = () => {
    const now = ctx.now();
    const s = openStatus(ctx.data.hours, now);
    const label = statusLabel(s, now);
    for (const el of document.querySelectorAll("[data-live-status]")) {
      el.classList.toggle("is-closed", !s.open);
      const text = el.querySelector("[data-status-text]");
      if (text) text.textContent = label;
    }
    const detail = document.querySelector("[data-status-detail]");
    if (detail) {
      const base = s.open && s.closesAt !== null
        ? `Open until ${formatTime12(s.closesAt)} today.`
        : "You can still message us on WhatsApp to book ahead.";
      detail.textContent = s.note ? `${s.note}. ${base}` : base;
    }
    for (const row of document.querySelectorAll("tr[data-day]")) {
      row.classList.toggle("today", Number(/** @type {HTMLElement} */ (row).dataset.day) === now.weekday);
    }
  };
  paint();
  ctx.everyMinute(paint);
}

/** Full-screen menu on small screens: Escape closes it and focus returns to the button. */
function mobileMenu() {
  const button = /** @type {HTMLButtonElement|null} */ (document.querySelector(".burger"));
  const menu = /** @type {HTMLElement|null} */ (document.getElementById("mnav"));
  const header = document.querySelector(".nav");
  if (!button || !menu || !header) return;
  /** @param {boolean} open */
  const set = (open) => {
    menu.style.top = `${Math.max(0, header.getBoundingClientRect().bottom)}px`;
    menu.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);
    if (open) menu.querySelector("a")?.focus();
  };
  button.addEventListener("click", () => set(menu.hidden));
  menu.addEventListener("click", (e) => { if (/** @type {Element} */ (e.target).closest("a")) set(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) { set(false); button.focus(); }
  });
}

/** Fade sections in as they scroll into view. Everything is visible without JS (see .js-reveal in core.css). */
function reveals() {
  const items = document.querySelectorAll(".rv");
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    items.forEach((el) => el.classList.add("in"));
    return;
  }
  document.documentElement.classList.add("js-reveal");
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }, { rootMargin: "0px 0px -8% 0px" });
  items.forEach((el) => io.observe(el));
}
