// @ts-check
/**
 * The lookbook: arrows and keys turn spread by spread (the rail scrolls; nothing is hijacked), the contact sheet jumps
 * to a look, and each look's marks open a slip with the piece, its price and what's left.
 */
import { paintStock } from "../../browser/stock.js";

/** @param {HTMLElement} root */
export function init(root) {
  const rail = /** @type {HTMLElement|null} */ (root.querySelector("[data-spreads]"));
  const nav = /** @type {HTMLElement|null} */ (root.querySelector(".wr-book-nav"));
  if (!rail) return;
  const smooth = () => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");
  const spreads = /** @type {HTMLElement[]} */ ([...rail.querySelectorAll(".wr-spread")]);
  const current = () => {
    const x = rail.scrollLeft + rail.clientWidth / 2;
    return Math.max(0, spreads.findIndex((s) => s.offsetLeft <= x && s.offsetLeft + s.offsetWidth > x));
  };
  const go = (/** @type {number} */ i) => {
    const s = spreads[Math.min(spreads.length - 1, Math.max(0, i))];
    rail.scrollTo({ left: s.offsetLeft - (rail.clientWidth - s.offsetWidth) / 2, behavior: smooth() });
  };
  if (nav) {
    nav.hidden = false;
    nav.querySelectorAll("[data-book-dir]").forEach((b) => b.addEventListener("click", () => go(current() + Number(/** @type {HTMLElement} */ (b).dataset.bookDir))));
  }
  rail.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); go(current() + (e.key === "ArrowRight" ? 1 : -1)); }
  });
  root.querySelectorAll("[data-jump]").forEach((a) => a.addEventListener("click", (e) => {
    const look = /** @type {HTMLElement|null} */ (root.querySelector(`#look-${/** @type {HTMLElement} */ (a).dataset.jump}`));
    const spread = /** @type {HTMLElement|null} */ (look?.closest(".wr-spread"));
    if (!spread) return;
    e.preventDefault();
    rail.scrollIntoView({ behavior: smooth(), block: "start" });
    go(spreads.indexOf(spread));
    history.replaceState(null, "", `#look-${/** @type {HTMLElement} */ (a).dataset.jump}`);
  }));
  // A link straight to a look opens the book at its spread.
  const hash = /^#look-(\d+)$/.exec(location.hash);
  if (hash) { const spread = /** @type {HTMLElement|null} */ (root.querySelector(`#look-${hash[1]}`)?.closest(".wr-spread")); if (spread) requestAnimationFrame(() => { rail.scrollLeft = spread.offsetLeft; }); }

  const closeAll = (/** @type {Element|null} */ except) => root.querySelectorAll("[data-mark][aria-expanded='true']").forEach((b) => {
    if (b === except) return;
    b.setAttribute("aria-expanded", "false");
    const slip = document.getElementById(b.getAttribute("aria-controls") ?? "");
    if (slip) slip.hidden = true;
  });
  root.querySelectorAll("[data-mark]").forEach((b) => b.addEventListener("click", () => {
    const open = b.getAttribute("aria-expanded") === "true";
    closeAll(b);
    b.setAttribute("aria-expanded", String(!open));
    const slip = document.getElementById(b.getAttribute("aria-controls") ?? "");
    if (slip) { slip.hidden = open; if (!open) paintStock(/** @type {HTMLElement} */ (slip.parentElement)); }
  }));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(null); });
}
