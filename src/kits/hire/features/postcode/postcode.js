// @ts-check
/** The postcode checker: the client's zones, by postcode district. Says what it found; never guesses a fee. */
import { zoneFor } from "../../lib/rules.js";
import { money } from "../../lib/quote.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-pc-form]"));
  const input = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-pc-in]"));
  const out = /** @type {HTMLElement|null} */ (root.querySelector("[data-pc-out]"));
  if (!form || !input || !out) return;
  const hire = /** @type {any} */ (ctx.data).hire;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const r = zoneFor(input.value, hire.zones ?? []);
    if (!r.ok) { out.textContent = "That doesn't read as a UK postcode. Try it like SW11 4NQ."; out.dataset.state = "error"; return; }
    if (!r.zone) { out.textContent = `${r.district} is outside our delivery zones. ${hire.collect}`; out.dataset.state = "out"; return; }
    out.textContent = `${r.district} is in ${r.zone.name}: delivery and collection ${r.zone.fee ? money(r.zone.fee) : "free"}.`;
    out.dataset.state = "in";
    ctx.share("hire:postcode", input.value);
  });
}
