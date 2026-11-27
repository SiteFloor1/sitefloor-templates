// @ts-check
/** The quote page: today's total for the home and stay in the link's hash, or nothing if either is unknown. */
import { homesState } from "../residences-homes/load.js";
import { el } from "../residences-homes/card.js";
import { quote, pounds } from "../../lib/stay.js";
import { freeText } from "../../lib/homes.js";
import { RULES, ukDay } from "../../lib/rules.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const out = /** @type {HTMLElement} */ (root.querySelector("[data-rq-out]"));
  const m = /^#([A-Za-z0-9-]{1,12})-(\d{1,2}|long)$/.exec(location.hash);
  if (!m) return;
  homesState(ctx).then((s) => {
    const h = s.ok ? s.homes.find((x) => x.ref === m[1]) : undefined;
    if (!h) { out.textContent = "That home isn't free today, or today's prices can't be read. Ask us for a new quote."; return; }
    const stay = m[2] === "long" ? "long" : Number(m[2]);
    const q = quote(h, stay);
    if (q.kind === "none") { out.textContent = "That stay isn't offered for this home. Ask us for a new quote."; return; }
    const cfg = /** @type {any} */ (ctx.data).homes;
    const p = cfg.photos?.[h.ref];
    const head = root.querySelector("[data-rq-h]");
    if (head) head.textContent = h.name;
    const parts = [el("p", "", `${ctx.data.name}. ${freeText(h.from)}.`)];
    if (p) { const img = /** @type {HTMLImageElement} */ (el("img")); img.src = p.src; img.alt = p.alt; img.width = p.width; img.height = p.height; parts.push(img); }
    if (q.kind === "short") parts.push(el("p", "rq-total", pounds(q.total)), el("p", "", `For ${q.nights} nights: ${pounds(Math.ceil(q.perNight))} a night, all in. Includes service, linen, cleaning and VAT.`));
    else {
      parts.push(el("p", "rq-total", `${pounds(q.rent)} a month`));
      const t = el("p");
      const a = /** @type {HTMLAnchorElement} */ (el("a", "", "GOV.UK")); a.href = RULES.fees.url; a.rel = "noopener"; a.target = "_blank";
      t.append(`A rolling tenancy, priced by the month. Only the payments the Tenant Fees Act permits can be charged; here, rent and a refundable deposit of up to ${pounds(q.deposit)} (`, a, `, checked ${ukDay(RULES.checked)}).`);
      parts.push(t);
    }
    const when = new Intl.DateTimeFormat("en-GB", { timeZone: ctx.data.hours.timezone, day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(s.updatedAt);
    parts.push(el("p", "rq-fine", `Not a booking. Prices from ${ctx.data.name}'s sheet, updated ${when}; they can change until a stay is confirmed.${ctx.data.mode === "demo" ? " Sample homes and figures." : ""}`));
    const row = el("div", "rq-row");
    const send = /** @type {HTMLAnchorElement} */ (el("a", "", "Send it"));
    send.href = `https://wa.me/?text=${encodeURIComponent(`${h.name} at ${ctx.data.name}: ${location.href}`)}`; send.target = "_blank"; send.rel = "noopener";
    const copy = /** @type {HTMLButtonElement} */ (el("button", "", "Copy the link")); copy.type = "button";
    copy.addEventListener("click", () => { navigator.clipboard?.writeText(location.href).then(() => { copy.textContent = "Copied"; }, () => { copy.textContent = "Copy it from the address bar"; }); });
    const ask = /** @type {HTMLAnchorElement} */ (el("a", "", "Ask us about it"));
    ask.href = ctx.waHref(`${cfg.ask} ${h.name} (${h.ref}), the quote at ${location.href}`); ask.target = "_blank"; ask.rel = "noopener";
    row.append(send, copy, ask);
    out.replaceWith(...parts, row);
  });
}
