// @ts-check
/** The sample table: a sample turns into the garden it was laid in (loaded on first touch); ticked samples go into the
 * WhatsApp message. */
import { samplesText } from "../../lib/garden.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).materials;
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-mt-send]"));
  const count = root.querySelector("[data-mt-count]");
  const samples = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-mt-id]")]);
  if (!cfg || !send || !count || !samples.length) throw new Error("materials markup missing");
  const load = (/** @type {HTMLElement} */ b) => { const g = /** @type {HTMLImageElement|null} */ (b.querySelector("img[data-src]")); if (g && !g.src) g.src = /** @type {string} */ (g.dataset.src); };
  samples.forEach((b) => {
    b.addEventListener("pointerenter", () => load(b), { once: true });
    b.addEventListener("click", () => {
      const on = b.getAttribute("aria-pressed") !== "true";
      load(b);
      samples.forEach((x) => x.setAttribute("aria-pressed", String(x === b && on)));
    });
  });
  const update = () => {
    const names = [...root.querySelectorAll("[data-mt-want]:checked")].map((i) => /** @type {HTMLInputElement} */ (i).value);
    send.href = ctx.bookHref(samplesText(cfg.message, names));
    count.textContent = names.length ? `${names.length === 1 ? "One sample" : `${names.length} samples`} in your message.` : "Touch a sample to see where we laid it.";
  };
  root.addEventListener("change", update);
  update();
}
