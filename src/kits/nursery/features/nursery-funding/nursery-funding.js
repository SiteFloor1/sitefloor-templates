// @ts-check
/** When funding can start: the date of birth in, the two terms out (gov.uk's "term after" rule, in the lib). */
import { fundingStart, dateWords, ymdIn } from "../../lib/nursery.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-nu-start]"));
  const input = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-nu-dob]"));
  const out = /** @type {HTMLElement|null} */ (root.querySelector("[data-nu-start-out]"));
  if (!form || !input || !out) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const today = ymdIn(Date.now(), ctx.data.hours.timezone);
    const r = fundingStart(input.value, today);
    out.hidden = false;
    if (!r) { out.replaceChildren(Object.assign(document.createElement("dd"), { textContent: "Enter a date of birth for a child under five." })); return; }
    const line = (/** @type {{ date: string, started: boolean }} */ x) => (x.started ? `Open now (since ${dateWords(x.date, "month")})` : `From ${dateWords(x.date, "long")}`);
    out.replaceChildren(
      Object.assign(document.createElement("dt"), { textContent: "Working families' hours" }), Object.assign(document.createElement("dd"), { textContent: line(r.working) }),
      Object.assign(document.createElement("dt"), { textContent: "15 hours for every 3 and 4 year old" }), Object.assign(document.createElement("dd"), { textContent: line(r.universal) }),
    );
  });
}
