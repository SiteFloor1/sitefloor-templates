// @ts-check
/**
 * The shortlist: Keep on any journey adds it to a list kept in this browser only; the list shows its count and the
 * journeys, and sends them to the operator as one WhatsApp message. Nothing leaves the browser until they send it.
 */
import { shortlistMessage } from "../../lib/tourism.js";

const KEY = "sf-tourism-shortlist";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data).tourism;
  const doc = root.ownerDocument;
  /** @type {string[]} */ let kept = [];
  try { kept = JSON.parse(localStorage.getItem(KEY) ?? "[]").filter((/** @type {string} */ id) => data.journeys.some((/** @type {any} */ j) => j.id === id)); } catch { kept = []; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(kept)); } catch { /* private browsing: the list lasts this visit */ } };
  const draw = () => {
    for (const b of doc.querySelectorAll("[data-keep]")) {
      const on = kept.includes(/** @type {HTMLElement} */ (b).dataset.keep ?? "");
      b.setAttribute("aria-pressed", String(on));
      b.textContent = on ? "Kept" : "Keep";
    }
    const js = kept.map((id) => data.journeys.find((/** @type {any} */ j) => j.id === id)).filter(Boolean);
    for (const panel of doc.querySelectorAll("[data-shortlist]")) {
      /** @type {HTMLElement} */ (panel).hidden = !js.length;
      const words = panel.querySelector("[data-short-words]");
      if (words) words.textContent = js.length ? `Your shortlist: ${js.map((/** @type {any} */ j) => j.name).join(", ")}.` : "";
      const send = /** @type {HTMLAnchorElement|null} */ (panel.querySelector("[data-short-send]"));
      if (send) send.href = ctx.waHref(shortlistMessage(data.name, js));
    }
  };
  doc.addEventListener("click", (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    const keep = /** @type {HTMLElement|null} */ (t.closest("[data-keep]"));
    if (keep) {
      const id = keep.dataset.keep ?? "";
      kept = kept.includes(id) ? kept.filter((x) => x !== id) : [...kept, id];
      save(); draw();
    } else if (t.closest("[data-short-clear]")) { kept = []; save(); draw(); }
  });
  draw();
}
