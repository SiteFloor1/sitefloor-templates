// @ts-check
/**
 * A home as a card in a list, and its detail when opened: shared by the home page, the residences page and the
 * stay bar. Every price is a total with its mandatory fees; a long let is priced by the month, never by length.
 */
import { quote, headline, pounds, noneText } from "../../lib/stay.js";
import { freeText, sqft, askText } from "../../lib/homes.js";
import { sunWindow, sunText } from "../../lib/light.js";
import { RULES, ukDay } from "../../lib/rules.js";

/** @typedef {import("../../lib/homes.js").Home} Home */
/** @typedef {number|"long"|null} Stay null: no stay chosen, so the headline */
/** @typedef {import("../../../../core/js/core.js").Ctx} Ctx */

/** @param {string} tag @param {string} [cls] @param {string} [text] */
export const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
/** @param {number} n @param {string} w */
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
/** @param {string} href @param {string} text */
const link = (href, text) => { const a = /** @type {HTMLAnchorElement} */ (el("a", "", text)); a.href = href; a.rel = "noopener"; a.target = "_blank"; return a; };

/** The price a card shows for a stay (or the headline). @param {Home} h @param {Stay} stay */
export function priceText(h, stay) {
  if (stay === null) {
    const hl = headline(h);
    if (hl.night) return `From ${pounds(hl.night.perNight)} a night, all in`;
    if (hl.month) return `${pounds(hl.month)} a month`;
    return "Ask for the terms";
  }
  const q = quote(h, stay);
  if (q.kind === "short") return `${pounds(q.total)} for ${q.nights} nights`;
  if (q.kind === "long") return `${pounds(q.rent)} a month`;
  return q.why === "no-short" ? "Long lets only" : q.why === "no-long" ? "Nightly only" : q.why === "too-short" ? `${h.minNights}-night minimum` : "Ask for the terms";
}

/** The sun line for a home today, when the feature is on and the home's bearings are known. @param {Home} h @param {Ctx} ctx */
export function sunLine(h, ctx) {
  const light = /** @type {any} */ (ctx.data).light;
  if (!light || !h.faces.length) return null;
  return sunText(sunWindow(h.faces, ctx.now().date, light.place, ctx.data.hours.timezone));
}

/** @param {Home} h @param {Ctx} ctx @param {Stay} stay @param {(h: Home) => void} open */
export function card(h, ctx, stay, open) {
  const cfg = /** @type {any} */ (ctx.data).homes;
  const p = cfg.photos?.[h.ref];
  const li = el("li", "rh-card");
  const b = /** @type {HTMLButtonElement} */ (el("button", "rh-open"));
  b.type = "button";
  b.setAttribute("aria-label", `${h.name}: details`);
  if (p) {
    const ph = el("span", "rh-ph");
    const img = /** @type {HTMLImageElement} */ (el("img"));
    img.src = p.small ?? p.src; img.alt = p.alt; img.loading = "lazy"; img.decoding = "async"; img.width = p.width; img.height = p.height;
    ph.append(img);
    b.append(ph);
  }
  b.append(el("span", "rh-name", h.name));
  const meta = el("span", "rh-meta");
  meta.append(el("span", "", `${h.beds ? plural(h.beds, "bedroom") : "Studio"} · ${h.m2} m²`), el("span", "rh-price", priceText(h, stay)));
  b.append(meta, el("span", "rh-free", freeText(h.from)));
  const sun = sunLine(h, ctx);
  if (sun) b.append(el("span", "rh-sun", sun));
  b.addEventListener("click", () => open(h));
  li.append(b);
  return li;
}

/**
 * Fills the detail dialog for a home and opens it.
 * @param {HTMLDialogElement} d @param {Home} h @param {Ctx} ctx @param {Stay} stay @param {number} updatedAt
 */
export function detail(d, h, ctx, stay, updatedAt) {
  const cfg = /** @type {any} */ (ctx.data).homes;
  const p = cfg.photos?.[h.ref];
  const parts = [];
  if (p) { const img = /** @type {HTMLImageElement} */ (el("img", "rh-d-ph")); img.src = p.src; img.alt = p.alt; img.width = p.width; img.height = p.height; parts.push(img, el("p", "rh-d-credit", p.credit)); }
  const body = el("div", "rh-d-in");
  body.append(el("h2", "rh-d-name", h.name));
  body.append(el("p", "rh-d-spec", [`Floor ${h.floor}`, h.beds ? plural(h.beds, "bedroom") : "Studio", plural(h.baths, "bathroom"), `${h.m2} m² (${sqft(h.m2).toLocaleString("en-GB")} sq ft)`, freeText(h.from)].join(" · ")));
  const money = el("div", "rh-d-money");
  if (h.short) {
    const want = typeof stay === "number" && stay >= h.minNights ? stay : h.minNights;
    const q = quote(h, want);
    const box = el("div");
    if (q.kind === "short") box.append(el("b", "", pounds(q.total)), el("span", "", ` for ${q.nights} nights`), el("small", "", `${pounds(Math.ceil(q.perNight))} a night, all in: service, linen, cleaning and VAT. ${h.minNights}-night minimum.`));
    money.append(box);
  }
  if (h.long) {
    const q = quote(h, "long");
    const box = el("div");
    if (q.kind === "long") {
      box.append(el("b", "", pounds(q.rent)), el("span", "", " a month"));
      const s = el("small");
      s.append("A rolling tenancy with no end date, so it's priced by the month (", link(RULES.rolling.url, "GOV.UK"), `, checked ${ukDay(RULES.checked)}). Only the payments the Tenant Fees Act permits can be charged: rent, a holding deposit of up to ${pounds(q.holding)} and a refundable deposit of up to ${pounds(q.deposit)} (`, link(RULES.fees.url, "GOV.UK"), `, checked ${ukDay(RULES.checked)}).`);
      box.append(s);
    } else if (q.kind === "none") box.append(el("small", "", noneText(q.why, h)));
    money.append(box);
  }
  body.append(money);
  if (cfg.quiet && h.quiet.length) {
    const dl = el("dl", "rh-d-quiet");
    for (const [k, v] of h.quiet) dl.append(el("dt", "", k), el("dd", "", v));
    body.append(dl);
  }
  const sun = sunLine(h, ctx);
  if (sun) body.append(el("p", "rh-d-sun", `${sun}. Worked out from the sun's position and the way the windows face; it ignores neighbouring buildings and cloud.`));
  const plan = cfg.plans?.[h.ref];
  if (plan) { const img = /** @type {HTMLImageElement} */ (el("img", "rh-d-plan")); img.src = plan.src; img.alt = plan.alt; img.width = plan.width; img.height = plan.height; img.loading = "lazy"; body.append(el("p", "rh-d-h", "Floor plan"), img); }
  const row = el("div", "rh-d-row");
  const stayWords = stay === "long" ? "on a long let" : typeof stay === "number" ? `for ${stay} nights` : "";
  const ask = link(ctx.waHref(askText(cfg.ask, h, stayWords)), `Ask about ${h.name}`);
  ask.className = "rh-d-ask";
  row.append(ask);
  if (cfg.quote) {
    const q = /** @type {HTMLAnchorElement} */ (el("a", "rh-d-quote", "Send this quote"));
    q.href = `${d.dataset.quoteHref}#${h.ref}-${stay ?? (h.short ? h.minNights : "long")}`;
    row.append(q);
  }
  const tour = cfg.tours?.[h.ref];
  if (tour) {
    const t = /** @type {HTMLButtonElement} */ (el("button", "rh-d-tour", "Walk through in 3D")); t.type = "button";
    t.addEventListener("click", () => { const f = /** @type {HTMLIFrameElement} */ (el("iframe", "rh-d-frame")); f.src = tour; f.title = `${h.name}, 3D tour`; f.allow = "fullscreen; xr-spatial-tracking"; t.replaceWith(f); });
    row.append(t);
  }
  const close = /** @type {HTMLButtonElement} */ (el("button", "rh-d-close", "Close")); close.type = "button";
  close.addEventListener("click", () => d.close());
  row.append(close);
  body.append(row, el("p", "rh-d-upd", `Prices and dates from the residence's sheet, updated ${new Intl.DateTimeFormat("en-GB", { timeZone: ctx.data.hours.timezone, day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(updatedAt)}.${ctx.data.mode === "demo" ? " Sample homes and figures." : ""}`));
  d.replaceChildren(...parts, body);
  d.setAttribute("aria-label", h.name);
  if (!d.open) d.showModal();
  ask.focus({ preventScroll: true });
}
