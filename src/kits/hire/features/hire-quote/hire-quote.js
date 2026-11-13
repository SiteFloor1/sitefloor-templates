// @ts-check
/**
 * The quote on a car's page: listens to the shared date picker, feeds it the days this car is taken on the client's
 * Sheet, prices the range from the client's own table and writes the request (with a reference that matches the
 * deposit's Stripe reference).
 */
import { startAvailability } from "../fleet/sheet-provider.js";
import { quote, money } from "../../lib/quote.js";
import { handoverFor, requestMessage } from "../../lib/request.js";
import { payRef } from "../../../../core/lib/pay-ref.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const car = JSON.parse(root.dataset.qCar ?? "{}");
  const hire = /** @type {any} */ (ctx.data).hire;
  const out = /** @type {HTMLElement} */ (root.querySelector("[data-q-out]"));
  const send = /** @type {HTMLAnchorElement} */ (root.querySelector("[data-q-send]"));
  const pc = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-q-pc]"));
  const air = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-q-air]"));
  const miles = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-q-miles]"));
  /** @type {any} */ let range = null;

  startAvailability(ctx);
  ctx.watch("hire:availability", (a) => ctx.share("date-range:hire:blocked", a.ok ? { status: "ok", dates: a.taken[car.id] ?? [] } : { status: "error" }));
  ctx.watch("hire:postcode", (v) => { if (pc && !pc.value) pc.value = v; });

  const paint = () => {
    const how = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-q-how]:checked"))?.value ?? "collect";
    root.dataset.how = how;
    if (!range?.ok) {
      out.innerHTML = `<p class="hr-q-wait">${range?.reason ? esc(range.reason) : "Choose your dates for the price."}</p>`;
      send.href = ctx.bookHref(send.dataset.waText ?? ""); return;
    }
    const h = handoverFor({ kind: /** @type {any} */ (how), postcode: pc?.value, airport: air?.value }, { zones: hire.zones ?? [], airports: hire.airports });
    const chosen = [...root.querySelectorAll("[data-q-extra]:checked")].map((x) => /** @type {HTMLInputElement} */ (x).value);
    const q = quote({ car, rules: hire.rates, range, extras: hire.extras ?? [], chosen, expectedMiles: Number(miles?.value || 0), handover: h.ok ? h.handover : null });
    const ref = payRef([car.id, range.from, range.to]);
    ctx.share(`pay-ref:${car.payLink}`, ref);
    out.innerHTML = q.ok ? quoteHtml(/** @type {any} */ (q), range, h.ok ? null : h.reason) : `<p class="hr-q-wait">${esc(q.reason ?? "")}</p>`;
    const text = requestMessage({ business: ctx.data.name, car: car.name, range, handover: h.ok && h.handover ? h.handover.words : "collection", quote: q, ref });
    send.dataset.waText = text;
    send.href = ctx.bookHref(text);
  };
  ctx.watch("date-range:hire", (r) => { range = r; paint(); });
  root.addEventListener("change", paint);
  root.addEventListener("input", (e) => { if (e.target === pc || e.target === miles) paint(); });
}

/** @param {{ parts: { label: string, amount: number, note?: string }[], total: number, deposit: number|null, included: number|"unlimited" }} q @param {any} r @param {string|null} warn */
function quoteHtml(q, r, warn) {
  const rows = q.parts.map((p) => `<tr><th scope="row">${esc(p.label)}${p.note ? ` <small>${esc(p.note)}</small>` : ""}</th><td>${money(p.amount)}</td></tr>`).join("");
  const days = r.periods === 1 ? "one day" : `${r.periods} days`;
  return `<table class="hr-q-table"><caption>Your quote, ${days}</caption><tbody>${rows}</tbody>`
    + `<tfoot><tr><th scope="row">Total</th><td>${money(q.total)}</td></tr></tfoot></table>`
    + (q.deposit ? `<p class="hr-q-dep">Deposit ${money(q.deposit)}, returned after the car is back and checked.</p>` : "")
    + `<p class="hr-q-inc">${q.included === "unlimited" ? "Unlimited miles." : `${q.included} miles included.`}</p>`
    + (warn ? `<p class="hr-q-warn">${esc(warn)}</p>` : "");
}

/** @param {string} s */
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
