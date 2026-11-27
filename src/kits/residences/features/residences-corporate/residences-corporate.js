// @ts-check
/** Corporate relocations: the request written as one WhatsApp message. */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const c = /** @type {any} */ (ctx.data).corporate;
  const $ = (/** @type {string} */ s) => /** @type {HTMLInputElement} */ (root.querySelector(s));
  const go = /** @type {HTMLAnchorElement} */ (root.querySelector("[data-rco-go]"));
  root.querySelector("form")?.addEventListener("submit", (e) => e.preventDefault());
  const write = () => {
    const from = $("[data-rco-from]").value;
    const when = from ? new Date(`${from}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "";
    const co = $("[data-rco-co]").value.trim();
    const text = `${c.message}${co ? ` It's for ${co}:` : ""} ${$("[data-rco-n]").value} ${$("[data-rco-n]").value === "1" ? "person" : "people"}${when ? ` from ${when}` : ""}, for ${$("[data-rco-len]").value}.`;
    go.href = ctx.waHref(text); go.dataset.waText = text;
  };
  root.addEventListener("input", write); root.addEventListener("change", write);
  write();
}
