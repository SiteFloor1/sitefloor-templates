// @ts-check
/**
 * Book us for your party: answers whether the day is free from the stall's party sheet (never "booked"; a taken day
 * still asks), and keeps the WhatsApp message in step with the form. Both the home block and the page use it.
 */
import { partyAnswer, partyText } from "../../lib/stalls.js";

/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx) => Promise<{ ok: true, days: Record<string, "taken"|"few"> } | { ok: false }> }} PartyProvider */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).party;
  /** @type {PartyProvider|null} */ const provider = ctx.providers.stallsParty;
  const date = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-pd-date]")), out = /** @type {HTMLElement|null} */ (root.querySelector("[data-pd-out]"));
  const ask = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-pd-ask]"));
  if (!cfg || !provider || !date || !out || !ask) throw new Error("party booking markup or provider missing");
  const kind = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-pd-kind]"));
  const guests = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-pd-guests]"));
  const pc = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-pd-pc]"));
  const today = ctx.now().date;
  date.min = today;
  /** @type {any} */ let diary = null;
  const paint = () => {
    const a = partyAnswer(date.value, ctx.now().date, diary);
    out.dataset.state = a.state;
    out.textContent = a.words;
    const text = partyText(cfg.message, { date: date.value && date.value >= today ? date.value : "", kind: kind?.value, guests: guests?.value, postcode: pc?.value.trim() });
    ask.href = ctx.bookHref(text);
    ask.dataset.waText = text;
  };
  for (const el of [date, kind, guests, pc]) el?.addEventListener("input", paint);
  provider.load(ctx).then((r) => { diary = r; paint(); }, () => { diary = { ok: false }; paint(); });
}
