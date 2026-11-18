// @ts-check
/** Ready to travel: the ticks are kept in this browser (or for this visit if it refuses) and counted. */
const KEY = "sf-tourism-ready";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const boxes = /** @type {HTMLInputElement[]} */ ([...root.querySelectorAll("[data-tc-item]")]);
  const done = root.querySelector("[data-tc-done]");
  if (!boxes.length || !done) throw new Error("checklist markup missing");
  /** @type {string[]} */ let ticked = [];
  try { ticked = JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { ticked = []; }
  const sig = (/** @type {HTMLInputElement} */ b) => `${b.dataset.tcItem}:${b.closest("label")?.textContent?.trim().slice(0, 40)}`;
  const draw = () => {
    const n = boxes.filter((b) => b.checked).length;
    done.textContent = n === boxes.length ? "All done. Have a wonderful trip." : `${n} of ${boxes.length} done.`;
  };
  for (const b of boxes) {
    b.checked = ticked.includes(sig(b));
    b.addEventListener("change", () => {
      ticked = boxes.filter((x) => x.checked).map(sig);
      try { localStorage.setItem(KEY, JSON.stringify(ticked)); } catch { /* this visit only */ }
      draw();
    });
  }
  draw();
}
