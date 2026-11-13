// @ts-check
/**
 * This week's flowers: the order button carries the chosen size, the day, anything added, the card and the postcode on WhatsApp; the florist's
 * Sheet (when set) can change the name, stems, prices, photo and colour, field by field, keeping the built value for
 * anything it can't prove. The colour changes the page's tokens, so the frame follows the flowers.
 */
import { startStudio } from "../../lib/studio.js";
import { weekFromRow, weekTokens } from "../../lib/week.js";
import { orderMessage, cardText } from "../../lib/orders.js";
import { pounds } from "../../lib/orders.js";
import { orderDay } from "../../lib/delivery.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const F = /** @type {any} */ (ctx.data).florist;
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-week-send]"));
  if (!F?.week || !send) throw new Error("this week's flowers: markup or data missing");
  /** @type {import("../../lib/week.js").Week} */
  let week = { ...F.week, sizes: F.week.sizes.map((/** @type {any} */ s) => ({ ...s })) };

  /** @param {string} sel @param {string} value */
  const setText = (sel, value) => { for (const el of document.querySelectorAll(sel)) el.textContent = value; };
  const apply = () => {
    setText("[data-week-name]", week.name);
    setText("[data-week-stems]", week.stems);
    setText("[data-week-colour-name]", week.colourName);
    for (const s of week.sizes) setText(`[data-size-price="${s.id}"]`, pounds(s.price));
    const t = weekTokens(week.colour, F.look);
    const st = document.documentElement.style;
    st.setProperty("--week", t.week); st.setProperty("--week-deep", t.weekDeep); st.setProperty("--week-wash", t.weekWash); st.setProperty("--dot-1", t.week);
    const p = F.week.photos.find((/** @type {any} */ x) => x.id === week.photo);
    for (const img of /** @type {NodeListOf<HTMLImageElement>} */ (document.querySelectorAll("[data-week-photo]"))) {
      if (p && img.dataset.weekPhoto !== p.id) { img.dataset.weekPhoto = p.id; img.removeAttribute("srcset"); img.parentElement?.querySelectorAll("source").forEach((s) => s.remove()); img.src = (img.dataset.base ?? "") + p.src; img.alt = p.alt; }
    }
  };

  startStudio(ctx);
  ctx.watch("studio", (/** @type {any} */ s) => {
    if (!s?.ok || !Object.keys(s.week ?? {}).length) return;
    week = weekFromRow(s.week, week, F.week.photos.map((/** @type {any} */ p) => p.id));
    apply();
  });

  const message = () => {
    const id = /** @type {HTMLInputElement|null} */ (root.querySelector('input[name="week-size"]:checked'))?.value;
    const size = week.sizes.find((s) => s.id === id);
    const card = /** @type {HTMLTextAreaElement|null} */ (root.querySelector("[data-card-input]"))?.value ?? "";
    const pc = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-pc-input]"))?.value.trim().toUpperCase() ?? "";
    const extras = [...root.querySelectorAll('input[name="week-gift"]:checked')].map((el) => ({ name: /** @type {HTMLElement} */ (el).dataset.giftName ?? "", price: Number(/** @type {HTMLElement} */ (el).dataset.giftPrice) }));
    // The chosen day, checked now (not when it was picked) against the typed postcode's area.
    const day = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-when-input]"))?.value ?? "";
    const D = F.delivery;
    const r = day && D ? orderDay(day, pc, D, ctx.now(), D.holidays ?? []) : null;
    const when = r?.ok ? r.label : undefined;
    return orderMessage({ lead: F.week.message, item: week.name, size, extras, when, card: F.card ? cardText(card, F.card.max, F.card.lines).text : "", postcode: pc || undefined });
  };
  // The href is set as it's used, so WhatsApp always gets what's on screen (and the demo's preview shows it).
  const refresh = () => { send.href = ctx.waHref(message()); };
  send.addEventListener("pointerdown", refresh);
  send.addEventListener("focus", refresh);
  send.addEventListener("click", refresh);
  root.addEventListener("change", refresh);
  root.addEventListener("input", refresh);
  refresh();
}
