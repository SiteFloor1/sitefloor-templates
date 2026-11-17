// @ts-check
/** Where she'll go next: a tap on an age redraws the classes she'd usually move through, year by year. */
import { pathFrom } from "../../lib/ballet.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const classes = /** @type {any} */ (ctx.data).classes;
  const list = root.querySelector("[data-path-list]");
  const buttons = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-path-age]")]);
  if (!classes || !list || !buttons.length) throw new Error("path markup or data missing");
  buttons.forEach((b) => b.addEventListener("click", () => {
    buttons.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    list.replaceChildren(...pathFrom(classes.items, Number(b.dataset.pathAge)).map((r) => {
      const li = document.createElement("li");
      li.append(Object.assign(document.createElement("span"), { textContent: r.from === r.to ? `Age ${r.from}` : `Ages ${r.from}–${r.to}` }),
        Object.assign(document.createElement("b"), { textContent: r.cls.name }));
      return li;
    }));
  }));
}
