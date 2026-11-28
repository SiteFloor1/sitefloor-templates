// @ts-check
/** The rooms: choosing a room brings its photograph forward and shows its line. */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const line = root.querySelector("[data-room-line]");
  const lines = [...(/** @type {HTMLTemplateElement|null} */ (root.querySelector("[data-room-lines]"))?.content.children ?? [])].map((x) => x.textContent ?? "");
  const buttons = [...root.querySelectorAll("[data-room]")];
  const pick = (/** @type {number} */ i) => {
    buttons.forEach((b, j) => b.setAttribute("aria-pressed", String(i === j)));
    if (line) line.textContent = lines[i] ?? "";
  };
  buttons.forEach((b, i) => b.addEventListener("click", () => pick(i)));
}
