// @ts-check
/** The look book's filter: one tag at a time, or all. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const btns = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-lb-f]")]);
  const looks = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-tags]")]);
  if (!btns.length || !looks.length) throw new Error("look-book markup missing");
  for (const b of btns) b.addEventListener("click", () => {
    const f = b.dataset.lbF ?? "all";
    for (const x of btns) x.setAttribute("aria-pressed", String(x === b));
    for (const el of looks) el.hidden = f !== "all" && !(el.dataset.tags ?? "").split(" ").includes(f);
  });
}
