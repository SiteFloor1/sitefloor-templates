// @ts-check
/**
 * Everyone in the chair: the party's steppers price the quote from the artist's own prices, add the early-start fee and
 * a second artist when the morning needs them, and share the party so the cover's start time moves with it.
 */
import { PLANNING, morningFor, quoteTotal, pounds, clockWords, quoteText, minutesOf } from "../../lib/bridalbeauty.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const d = /** @type {any} */ (ctx.data);
  const pt = d.party, pk = d.packages, mo = d.morning;
  const total = root.querySelector("[data-pt-total]"), start = root.querySelector("[data-pt-start]"), extra = root.querySelector("[data-pt-extra]");
  const ask = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-pt-ask]")), max = /** @type {HTMLElement|null} */ (root.querySelector("[data-pt-max]"));
  if (!pt || !pk || !mo || !total || !start || !extra || !ask || !max) throw new Error("party quote markup or data missing");
  const cerSelect = /** @type {HTMLSelectElement|null} */ (document.querySelector("[data-cv-cer]"));
  const state = { service: pk.bride[0].id, ceremony: minutesOf(cerSelect?.value ?? mo.ceremony), counts: /** @type {Record<string, number>} */ ({ ...pt.start }) };
  let wedding = "";
  const paint = () => {
    const m = morningFor(d, state);
    const bride = m.bride;
    for (const p of pk.party) {
      const out = root.querySelector(`[data-step="${p.id}"] [data-n]`), line = root.querySelector(`[data-pt-line="${p.id}"]`);
      if (out) out.textContent = String(state.counts[p.id] ?? 0);
      if (line) line.textContent = pounds(p.price * (state.counts[p.id] ?? 0));
    }
    const b = root.querySelector("[data-pt-bride]"), s = root.querySelector("[data-pt-svc]");
    if (b) b.textContent = pounds(bride.price);
    if (s) s.textContent = `${bride.name}, trial and wedding day`;
    const sum = quoteTotal({ bride: bride.price, lines: pk.party.map((/** @type {any} */ p) => ({ price: p.price, count: state.counts[p.id] ?? 0 })), early: m.earlyFee, second: m.secondFee });
    total.textContent = pounds(sum);
    start.textContent = m.tooEarly ? PLANNING : `We start at ${clockWords(m.plan.start)} for a ${clockWords(state.ceremony)} ceremony`;
    extra.textContent = [m.early ? `Includes the early-start fee (${pounds(m.earlyFee)})` : "No early-start fee", m.artists > 1 ? `and a second artist (${pounds(m.secondFee)})` : ""].filter(Boolean).join(" ");
    const text = quoteText(pt.message, { wedding, service: bride.name, ceremony: clockWords(state.ceremony), start: m.tooEarly ? "" : clockWords(m.plan.start),
      people: pk.party.map((/** @type {any} */ p) => { const count = state.counts[p.id] ?? 0; return { label: count === 1 ? p.one : p.name, count }; }), total: sum });
    ask.href = ctx.bookHref(text);
    if (ask.dataset.waText !== undefined) ask.dataset.waText = text;
  };
  root.addEventListener("click", (e) => {
    const btn = /** @type {HTMLElement} */ (e.target).closest("[data-step] button");
    if (!btn) return;
    const id = /** @type {HTMLElement} */ (btn.closest("[data-step]")).dataset.step ?? "";
    const next = (state.counts[id] ?? 0) + Number(/** @type {HTMLElement} */ (btn).dataset.d);
    const others = Object.entries(state.counts).reduce((s, [k, v]) => s + (k === id ? 0 : v), 0);
    max.hidden = next + others <= pt.max;
    if (next < 0 || next + others > pt.max) return;
    state.counts[id] = next;
    ctx.share("party", { ...state.counts });
    paint();
  });
  ctx.watch("service", (/** @type {string} */ v) => { state.service = v; paint(); });
  ctx.watch("ceremony", (/** @type {number} */ v) => { state.ceremony = v; paint(); });
  ctx.watch("wedding", (/** @type {string} */ v) => { wedding = v; paint(); });
  ctx.share("party", { ...state.counts });
  paint();
}
