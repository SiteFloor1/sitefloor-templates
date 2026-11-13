// @ts-check
/** The design library's filters: by style, and by bridal or guests. Without JavaScript every design shows. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const bar = /** @type {HTMLElement|null} */ (root.querySelector("[data-dl-filters]"));
  const count = root.querySelector("[data-dl-count]");
  const items = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-dl-item]")]);
  if (!bar || !count || !items.length) throw new Error("design library markup missing");
  let style = "", who = "";
  const paint = () => {
    let shown = 0;
    for (const li of items) {
      const on = (!style || li.dataset.style === style) && (!who || li.dataset.for === who);
      li.hidden = !on; if (on) shown++;
    }
    count.textContent = style || who ? `${shown} ${shown === 1 ? "design" : "designs"}` : "";
  };
  /** @param {string} attr @param {(v: string) => void} set */
  const group = (attr, set) => {
    const btns = /** @type {HTMLButtonElement[]} */ ([...bar.querySelectorAll(`[${attr}]`)]);
    for (const b of btns) b.addEventListener("click", () => {
      set(b.getAttribute(attr) ?? "");
      for (const x of btns) x.setAttribute("aria-pressed", String(x === b));
      paint();
    });
  };
  group("data-dl-style", (v) => { style = v; });
  group("data-dl-for", (v) => { who = v; });
}
