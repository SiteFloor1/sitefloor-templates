// @ts-check
/** The trial window from her wedding date (the artist's own weeks), and the request on WhatsApp. */
import { trialWindow, ukDate, trialText } from "../../lib/bridalbeauty.js";
import { dateField } from "../../partials/date-field.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).trial;
  const out = /** @type {HTMLElement|null} */ (root.querySelector("[data-tr-out]")), ask = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-tr-ask]"));
  const guests = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-tr-guests]"));
  if (!cfg || !out || !ask || !guests) throw new Error("trial markup or data missing");
  const first = out.textContent ?? "";
  let wedding = "";
  const paint = () => {
    const today = ctx.now().date;
    if (!wedding) { out.dataset.state = "idle"; out.textContent = first; }
    else if (wedding < today) { out.dataset.state = "past"; out.textContent = "That day has passed. Choose your wedding date."; }
    else {
      const w = trialWindow(wedding, cfg, today);
      out.dataset.state = w.late ? "late" : "open";
      out.textContent = w.late ? "The usual weeks for a trial have gone, but there's often still time. Ask." : `Have your trial between ${ukDate(w.from)} and ${ukDate(w.to)}.`;
    }
    const where = /** @type {HTMLInputElement|null} */ (root.querySelector("input[name=tr-where]:checked"))?.value ?? "";
    const text = trialText(cfg.message, { wedding: wedding >= today ? wedding : "", where: where ? `At ${where.toLowerCase()}` : "", guests: guests.value });
    ask.href = ctx.bookHref(text);
    if (ask.dataset.waText !== undefined) ask.dataset.waText = text;
  };
  root.addEventListener("change", (e) => { if (!/** @type {HTMLElement} */ (e.target).closest("[data-date-field]")) paint(); });
  dateField(root, ctx, "wedding", (ymd) => { wedding = ymd; paint(); });
}
