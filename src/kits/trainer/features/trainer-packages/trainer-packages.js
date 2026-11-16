// @ts-check
/** Corporate and family (PT-7): the request form writes the WhatsApp message; nothing is sent until the visitor does. */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).trainer.packages;
  const form = /** @type {HTMLFormElement} */ (root.querySelector("[data-tpk-form]"));
  const which = /** @type {HTMLSelectElement} */ (root.querySelector("[data-tpk-which]"));
  const n = /** @type {HTMLInputElement} */ (root.querySelector("[data-tpk-n]"));
  const name = /** @type {HTMLInputElement} */ (root.querySelector("[data-tpk-name]"));
  const go = /** @type {HTMLAnchorElement} */ (root.querySelector("[data-tpk-go]"));
  if (!form || !which || !n || !go) throw new Error("packages markup missing");
  const paint = () => {
    const max = Number(which.selectedOptions[0]?.dataset.max ?? 40);
    n.max = String(max);
    const people = Math.min(max, Math.max(2, Number(n.value) || 2));
    const days = [...root.querySelectorAll("[data-tpk-day]:checked")].map((d) => /** @type {HTMLInputElement} */ (d).value);
    const who = name.value.trim().replace(/[<>]/g, "");
    const text = `${cfg.message} ${which.value}, ${people} people${days.length ? `, ${days.join(", ")}` : ""}${who ? `, for ${who}` : ""}.`;
    go.href = ctx.bookHref(text);
    if (go.dataset.waText !== undefined) go.dataset.waText = text;
  };
  form.addEventListener("input", paint);
  form.addEventListener("change", paint);
  form.addEventListener("submit", (e) => e.preventDefault());
  paint();
}
