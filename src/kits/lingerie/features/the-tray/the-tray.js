// @ts-check
/** The tray: toggles pieces (three at most), remembers them (id and name) on this phone, and shares their names with the
    fitting request on any page, including pages that don't show those pieces. */
import { must } from "../dom.js";

const KEY = "sf-tray";
const MAX = 3;

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const count = must(root, "[data-tray-count]");
  /** @type {{ id: string, name: string }[]} */ let items = [];
  try {
    items = JSON.parse(localStorage.getItem(KEY) ?? "[]").filter((/** @type {any} */ x) => x && typeof x.id === "string" && typeof x.name === "string").slice(0, MAX);
  } catch { items = []; }
  const ids = () => items.map((x) => x.id);
  const paint = () => {
    for (const b of document.querySelectorAll("[data-tray-add]")) {
      const on = ids().includes(/** @type {HTMLElement} */ (b).dataset.trayAdd ?? "");
      b.setAttribute("aria-pressed", String(on));
      b.textContent = on ? "At my fitting ✓" : "Have it at my fitting";
    }
    count.textContent = String(items.length);
    root.hidden = !items.length;
    ctx.share("tray", items.map((x) => x.name));
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage unavailable */ }
  };
  document.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement|null} */ (/** @type {Element} */ (e.target).closest("[data-tray-add]"));
    if (!b) return;
    const id = b.dataset.trayAdd ?? "";
    const name = /** @type {HTMLElement|null} */ (b.closest("[data-piece]"))?.dataset.name ?? "";
    if (ids().includes(id)) items = items.filter((x) => x.id !== id);
    else if (items.length < MAX && name) items = [...items, { id, name }];
    else { count.textContent = `${MAX} already`; return; }
    paint();
  });
  must(root, "[data-tray-clear]").addEventListener("click", () => { items = []; paint(); });
  paint();
}
