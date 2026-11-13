// @ts-check
/**
 * Team page filter: "Who's best for Afro and textured hair?" and similar.
 * Without JavaScript every profile shows, each with its "best for" line.
 */

/** @type {import("../../core/js/core.js").FeatureInit} */
export function init(root) {
  const chips = root.querySelector("[data-team-chips]");
  if (!chips) return; // no filters on this site
  const cards = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("article[data-tags]")]);
  const count = root.querySelector("[data-team-count]");
  chips.addEventListener("click", (e) => {
    const btn = /** @type {HTMLElement} */ (e.target).closest("button[data-tag]");
    if (!(btn instanceof HTMLButtonElement)) return;
    const tag = btn.dataset.tag ?? "";
    for (const b of chips.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b === btn));
    let shown = 0;
    for (const card of cards) {
      const match = !tag || (card.dataset.tags ?? "").split(" ").includes(tag);
      card.hidden = !match;
      if (match) shown++;
    }
    if (count) count.textContent = tag ? `${shown} of ${cards.length} ${cards.length === 1 ? "person" : "people"}` : "";
  });
}
