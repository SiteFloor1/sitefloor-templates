// @ts-check
/** What's worth checking: one age at a time, and "ask us to look at your house" on WhatsApp with the age and district. */
import { HOUSE_AGES, surveyMessage } from "../../lib/survey.js";
import { outwardCode } from "../../lib/brief.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const opening = /** @type {any} */ (ctx.data).build?.survey?.message ?? "";
  root.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement|null} */ (/** @type {HTMLElement} */ (e.target).closest("[data-sv-age]"));
    const age = b?.dataset.svAge;
    if (!age || !Object.hasOwn(HOUSE_AGES, age)) return;
    root.dataset.age = age;
    for (const x of root.querySelectorAll("[data-sv-age]")) x.setAttribute("aria-pressed", String(x === b));
  });
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-sv-form]"));
  const err = /** @type {HTMLElement|null} */ (root.querySelector("[data-sv-err]"));
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const raw = /** @type {HTMLInputElement} */ (form.elements.namedItem("where")).value.trim();
    const where = outwardCode(raw);
    if (raw && !where) { if (err) { err.hidden = false; err.textContent = "That doesn't look like a postcode district. Try the first half, like N5."; } return; }
    if (err) err.hidden = true;
    window.open(ctx.waHref(surveyMessage(opening, root.dataset.age ?? "", where)), "_blank", "noopener");
  });
}
