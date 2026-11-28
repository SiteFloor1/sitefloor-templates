// @ts-check
/**
 * The stay bar: a home and a length of stay give one total with every mandatory fee in it. At "Long let" it stops
 * pricing by length (a rolling tenancy has no end date) and shows the rent a month, with the most the holding deposit
 * and the deposit can be under the Tenant Fees Act, each rule linked to GOV.UK with the date checked. Shares
 * "residences-stay" so every card on the page shows the same stay.
 */
import { homesState } from "../residences-homes/load.js";
import { el } from "../residences-homes/card.js";
import { quote, pounds, noneText } from "../../lib/stay.js";
import { askText } from "../../lib/homes.js";
import { RULES, ukDay } from "../../lib/rules.js";

/** @param {string} href @param {string} text */
const link = (href, text) => { const a = /** @type {HTMLAnchorElement} */ (el("a", "", text)); a.href = href; a.target = "_blank"; a.rel = "noopener"; return a; };

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const stops = (root.dataset.stops ?? "").split(",").map(Number);
  const home = /** @type {HTMLSelectElement} */ (root.querySelector("[data-rs-home]"));
  const len = /** @type {HTMLInputElement} */ (root.querySelector("[data-rs-len]"));
  const lenv = /** @type {HTMLElement} */ (root.querySelector("[data-rs-lenv]"));
  const price = /** @type {HTMLElement} */ (root.querySelector("[data-rs-price]"));
  const go = /** @type {HTMLAnchorElement} */ (root.querySelector("[data-rs-go]"));
  const cfg = /** @type {any} */ (ctx.data).homes;
  root.addEventListener("submit", (e) => e.preventDefault());
  homesState(ctx).then((s) => {
    if (!s.ok || !s.homes.length) { root.classList.add("rs-stale"); return; }
    home.replaceChildren(...s.homes.map((h) => { const o = /** @type {HTMLOptionElement} */ (el("option", "", h.name)); o.value = h.ref; return o; }));
    home.value = s.homes.some((h) => h.ref === root.dataset.home) ? /** @type {string} */ (root.dataset.home) : s.homes[0].ref;
    home.disabled = false; len.disabled = false;
    let timer = 0;
    const draw = () => {
      const h = s.homes.find((x) => x.ref === home.value) ?? s.homes[0];
      const i = Number(len.value);
      /** @type {number|"long"} */ const stay = i >= stops.length ? "long" : stops[i];
      lenv.textContent = stay === "long" ? "Long let" : `${stay} nights`;
      const q = quote(h, stay);
      price.classList.add("rs-out");
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        const parts = [];
        if (q.kind === "short") {
          const b = el("b", "", pounds(q.total)); b.append(" ", el("span", "rs-unit", `for ${q.nights} nights`));
          parts.push(b, el("small", "", `${pounds(Math.ceil(q.perNight))} a night, all in`), el("p", "rs-note", "Includes service, linen, cleaning and VAT."));
        } else if (q.kind === "long") {
          const b = el("b", "", pounds(q.rent)); b.append(" ", el("span", "rs-unit", "a month"));
          const p = el("p", "rs-note");
          p.append("A rolling tenancy with no end date, so it's priced by the month (", link(RULES.rolling.url, "GOV.UK"), `, checked ${ukDay(RULES.checked)}). Only the payments the Tenant Fees Act permits can be charged; here, rent and a refundable deposit of up to ${pounds(q.deposit)} (`, link(RULES.fees.url, "GOV.UK"), `, checked ${ukDay(RULES.checked)}).`);
          parts.push(b, p);
        } else parts.push(el("b", "rs-none", noneText(q.why, h)));
        if (ctx.data.mode === "demo") parts.push(el("small", "", "Sample figures."));
        price.replaceChildren(...parts);
        price.classList.remove("rs-out");
      }, 160);
      const words = stay === "long" ? "on a long let" : `for ${stay} nights`;
      go.textContent = stay === "long" ? "Ask about this let" : "Reserve";
      go.href = ctx.waHref(askText(cfg.ask, h, words));
      go.dataset.waText = askText(cfg.ask, h, words);
      ctx.share("residences-stay", { stay, ref: h.ref });
    };
    home.addEventListener("change", draw);
    len.addEventListener("input", draw);
    draw();
  });
}
