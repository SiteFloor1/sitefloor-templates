// @ts-check
/**
 * Your usual. When a visitor taps a Book or "Ask for" on a set or a shade, the phone remembers what it was; next visit,
 * one line offers it again. Kept only in this browser's storage; "Forget it" clears it. Nothing is sent anywhere.
 */
import { usualText } from "../../lib/messages.js";

const KEY = "sf-nails-usual";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  // Every page carries a listener (in the look's header) so a tap anywhere is remembered; only the section shows it.
  if (root.hasAttribute("data-yu-listen")) {
    if (!document.querySelector("section[data-feature=usual-set]")) remember(null);
    return;
  }
  const cfg = /** @type {any} */ (ctx.data).usual;
  const what = root.querySelector("[data-yu-what]"), book = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-yu-book]")), forget = root.querySelector("[data-yu-forget]");
  if (!cfg || !what || !book || !forget) throw new Error("your usual markup missing");
  /** @param {string} v */
  const show = (v) => {
    if (!v) { root.hidden = true; return; }
    what.textContent = v;
    book.href = ctx.bookHref(usualText(cfg.message, v));
    root.hidden = false;
  };
  let saved = "";
  try { saved = localStorage.getItem(KEY) ?? ""; } catch { /* storage off: the line just never shows */ }
  show(saved.slice(0, 160));
  remember(book);
  forget.addEventListener("click", () => { try { localStorage.removeItem(KEY); } catch { /* storage off */ } show(""); });
}

/** Remembers the set or shade behind any Book or "Ask for" the visitor taps. @param {HTMLElement|null} skip */
function remember(skip) {
  document.addEventListener("click", (e) => {
    const a = /** @type {HTMLElement|null} */ (/** @type {Element} */ (e.target).closest("a[data-usual]"));
    if (!a || a === skip || !a.dataset.usual) return;
    try { localStorage.setItem(KEY, a.dataset.usual.slice(0, 160)); } catch { /* storage off */ }
  });
}
