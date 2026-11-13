// @ts-check
/** The sample box: the ticked finishes and the postcode district as one WhatsApp message; never more than the maximum. */
import { outwardCode } from "../../lib/brief.js";

/** The message. @param {string} opening @param {string[]} picks @param {string} where */
export function sampleMessage(opening, picks, where) {
  return [opening, picks.map((p) => `· ${p}`).join("\n"), where ? `Postcode district: ${where}` : ""].filter(Boolean).join("\n\n");
}

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).build?.sampleBox;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("form"));
  const err = /** @type {HTMLElement|null} */ (root.querySelector("[data-sb-err]"));
  const count = root.querySelector("[data-sb-count]");
  if (!cfg || !form || !err || !count) throw new Error("sample box markup or config missing");
  const boxes = /** @type {HTMLInputElement[]} */ ([...form.querySelectorAll('input[name="pick"]')]);
  const picked = () => boxes.filter((b) => b.checked).map((b) => b.value);
  const sync = () => {
    const n = picked().length;
    for (const b of boxes) b.disabled = !b.checked && n >= cfg.max;
    count.textContent = n ? `${n} of ${cfg.max} chosen.` : "None chosen yet.";
  };
  form.addEventListener("change", sync);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const picks = picked();
    const raw = /** @type {HTMLInputElement} */ (form.elements.namedItem("where")).value.trim();
    const where = outwardCode(raw);
    if (!picks.length) { err.hidden = false; err.textContent = "Choose at least one finish."; return; }
    if (raw && !where) { err.hidden = false; err.textContent = "That doesn't look like a postcode district. Try the first half, like N5."; return; }
    err.hidden = true;
    window.open(ctx.waHref(sampleMessage(cfg.message, picks, where)), "_blank", "noopener");
  });
  sync();
}
