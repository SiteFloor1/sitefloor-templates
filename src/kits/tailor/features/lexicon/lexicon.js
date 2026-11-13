// @ts-check
/** The style lexicon's filter: one kind of word at a time, or every word. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const picks = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-lx-kind]")]);
  const words = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-kind]")]);
  if (!picks.length || !words.length) throw new Error("lexicon markup missing");
  for (const b of picks) b.addEventListener("click", () => {
    const k = b.dataset.lxKind ?? "";
    for (const x of picks) x.setAttribute("aria-pressed", String(x === b));
    for (const w of words) w.hidden = Boolean(k) && w.dataset.kind !== k;
  });
}
