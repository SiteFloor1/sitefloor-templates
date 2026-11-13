// @ts-check
/** The account request: company, months and cars written into the client's own opening line. */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-lt-send]"));
  if (!send) return;
  const base = send.dataset.waText ?? "";
  root.addEventListener("input", () => {
    /** @type {Record<string, string>} */ const v = {};
    for (const el of root.querySelectorAll("[data-lt]")) v[/** @type {HTMLElement} */ (el).dataset.lt ?? ""] = /** @type {HTMLInputElement} */ (el).value.trim();
    const text = [base, v.company && `Company: ${v.company}`, v.months && `Months: ${v.months}`, v.cars && `Cars: ${v.cars}`].filter(Boolean).join("\n");
    send.dataset.waText = text;
    send.href = ctx.bookHref(text);
  });
}
