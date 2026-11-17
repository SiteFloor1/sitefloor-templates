// @ts-check
/** The first-meeting checklist: ticks are kept in this browser only (if it allows), never sent anywhere. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const box = root.querySelector("[data-bring]");
  const count = root.querySelector("[data-bring-count]");
  if (!box || !count) throw new Error("meeting checklist markup missing");
  const m = /** @type {any} */ (ctx.data).meeting;
  const inputs = /** @type {HTMLInputElement[]} */ ([...box.querySelectorAll("[data-bring-i]")]);
  /** @returns {number[]} */
  const load = () => { try { const v = JSON.parse(localStorage.getItem(m.key) ?? "[]"); return Array.isArray(v) ? v : []; } catch { return []; } };
  const save = (/** @type {number[]} */ v) => { try { localStorage.setItem(m.key, JSON.stringify(v)); } catch { /* private mode: ticks last this visit only */ } };
  const paint = () => {
    const done = inputs.filter((i) => i.checked).length;
    count.textContent = done === inputs.length ? "Everything's ready. See you at the meeting." : `${done} of ${inputs.length} ready. Your ticks stay on this device.`;
  };
  const kept = new Set(load());
  for (const i of inputs) i.checked = kept.has(Number(i.dataset.bringI));
  box.addEventListener("change", () => { save(inputs.filter((i) => i.checked).map((i) => Number(i.dataset.bringI))); paint(); });
  paint();
}
