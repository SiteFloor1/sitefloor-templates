// @ts-check
/**
 * What a week costs: the age band decides which funded hours are open (gov.uk), each day cycles through the nursery's
 * sessions, and the card shows the month with every line. The quote goes to WhatsApp for the nursery to check.
 */
import { weekCost, pounds, FUNDING_BY_BAND, DAY_NAMES } from "../../lib/nursery.js";
import { weekQuote, weekRows, weekOptional, SESSION_ORDER } from "./week-words.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).nursery.week;
  if (!cfg) throw new Error("week data missing");
  const order = ["off", ...SESSION_ORDER.filter((k) => cfg.sessions[k])];
  const days = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll(".nu-day")]);
  const state = {
    band: Number(root.querySelector("[data-band][aria-pressed='true']")?.getAttribute("data-band") ?? 1),
    funded: Number(root.querySelector("[data-f][aria-pressed='true']")?.getAttribute("data-f") ?? 0),
    days: days.map((d) => d.dataset.s ?? "off"),
  };
  const word = (/** @type {string} */ s) => (s === "off" ? "Off" : cfg.sessions[s].label);
  const keys = Object.keys(DAY_NAMES).slice(0, 5);

  const paint = () => {
    root.querySelectorAll("[data-band]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.getAttribute("data-band")) === state.band)));
    const open = FUNDING_BY_BAND[state.band];
    if (!open.includes(state.funded)) state.funded = Math.max(...open);
    root.querySelectorAll("[data-f]").forEach((b) => {
      const f = Number(b.getAttribute("data-f"));
      /** @type {HTMLButtonElement} */ (b).disabled = !open.includes(f);
      b.setAttribute("aria-pressed", String(f === state.funded));
    });
    days.forEach((d, i) => {
      const s = state.days[i];
      d.dataset.s = s;
      d.setAttribute("aria-label", `${DAY_NAMES[/** @type {keyof typeof DAY_NAMES} */ (keys[i])]}: ${word(s).toLowerCase()}`);
      const span = d.querySelector("span");
      if (span) span.textContent = word(s);
    });
    const c = weekCost(cfg, state.days, state.funded);
    const total = root.querySelector("[data-nu-total]");
    if (total) total.textContent = pounds(c.month);
    const sum = root.querySelector("[data-nu-sum]");
    if (sum) {
      const rows = weekRows(c, cfg);
      sum.replaceChildren(...rows.flatMap(([k, v]) => [Object.assign(document.createElement("dt"), { textContent: k }), Object.assign(document.createElement("dd"), { textContent: v })]));
    }
    const opt = root.querySelector("[data-nu-optional]");
    if (opt) opt.textContent = weekOptional(cfg.extras, c.daysOn);
    const quote = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-nu-quote]"));
    if (quote) quote.href = ctx.bookHref(weekQuote(cfg, state.days, state.funded, c.month));
  };

  root.querySelector("[data-nu-bands]")?.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement} */ (e.target).closest("[data-band]");
    if (b) { state.band = Number(b.getAttribute("data-band")); paint(); }
  });
  root.querySelector("[data-nu-funds]")?.addEventListener("click", (e) => {
    const b = /** @type {HTMLButtonElement|null} */ (/** @type {HTMLElement} */ (e.target).closest("[data-f]"));
    if (b && !b.disabled) { state.funded = Number(b.getAttribute("data-f")); paint(); }
  });
  days.forEach((d, i) => d.addEventListener("click", () => {
    state.days[i] = order[(order.indexOf(state.days[i]) + 1) % order.length];
    paint();
  }));
  paint();
}
