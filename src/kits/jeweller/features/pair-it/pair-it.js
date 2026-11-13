// @ts-check
/** Pair it: choosing a band shows it beside the ring and words the request for that pair. */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const bands = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-pair-band]")]);
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-pair-send]"));
  if (!bands.length || !send) return;
  root.classList.add("is-picking");
  const pick = (/** @type {string} */ id) => {
    const b = bands.find((x) => x.dataset.pairBand === id) ?? bands[0];
    bands.forEach((x) => { x.hidden = x !== b; });
    const text = `Hello ${ctx.data.name}, I'd like to see ${send.dataset.ring} with ${b.dataset.pairName} in person.`;
    send.href = ctx.waHref(text); send.dataset.waText = text;
  };
  root.addEventListener("change", (e) => { const t = /** @type {HTMLInputElement} */ (e.target); if (t.type === "radio") pick(t.value); });
  pick(/** @type {HTMLInputElement|null} */ (root.querySelector('input[type="radio"]:checked'))?.value ?? "");
}
