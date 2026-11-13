// @ts-check
/** Hen and bridal parties: the form becomes one WhatsApp message as it changes. */
import { partyText } from "../../lib/messages.js";
import { dateField } from "../../partials/date-field.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).parties;
  const form = root.querySelector("[data-pa-form]"), people = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-pa-people]"));
  const notes = /** @type {HTMLTextAreaElement|null} */ (root.querySelector("[data-pa-notes]")), send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-pa-send]"));
  if (!cfg || !form || !people || !notes || !send) throw new Error("parties markup missing");
  let date = "";
  const update = () => {
    const occasion = /** @type {HTMLInputElement|null} */ (form.querySelector("input[name=pa-occ]:checked"))?.value ?? "party";
    const treatments = [...form.querySelectorAll("input[name=pa-t]:checked")].map((i) => /** @type {HTMLInputElement} */ (i).value);
    send.href = ctx.bookHref(partyText({ opening: cfg.message, occasion, date, people: Number(people.value), treatments, notes: notes.value.trim() }));
  };
  dateField(root, ctx, "wedding", (ymd) => { date = ymd; update(); });
  form.addEventListener("change", update);
  notes.addEventListener("input", update);
}
