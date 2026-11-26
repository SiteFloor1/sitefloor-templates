// @ts-check
/**
 * When could I pass? (DRIVE-6) and the cost to pass. Weeks to test-ready on the DVSA's average at the hours a week
 * chosen; the cost from the instructor's own block (or intensive) price and gov.uk's test fees while they are fresh,
 * rounded to £10. The intensive choice gives no date: the instructor agrees the dates.
 */
import { passPlan, costToPass, feesFresh, pounds } from "../../lib/driving.js";
import { openable } from "../../lib/cards.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  openable(root);
  const d = /** @type {any} */ (ctx.data).driving, cfg = d.pass, lessons = d.lessons;
  const $ = (/** @type {string} */ s) => /** @type {HTMLElement} */ (root.querySelector(s));
  const chips = [...root.querySelectorAll("[data-pp-h]")];
  const theory = /** @type {HTMLInputElement} */ ($("[data-pp-theory]"));
  let gearbox = lessons.manual ? "manual" : "automatic";
  let choice = String(cfg.perWeek.find((/** @type {any} */ c) => c.default)?.hours ?? cfg.perWeek[0].hours);
  let soFar = 0;
  const today = () => ctx.now().date;
  const fresh = feesFresh(cfg.fees.checked, today());
  $("[data-pp-stale]").hidden = fresh;
  const fees = fresh ? { practical: cfg.fees.practical, theory: cfg.fees.theory } : null;

  const paint = () => {
    const g = lessons[gearbox], intensive = choice === "intensive";
    const per = intensive ? g.intensive.hours : Number(choice);
    const plan = passPlan({ perWeek: per, soFar, today: today() });
    $("[data-pp-so]").textContent = String(soFar);
    if (!plan.left) {
      $("[data-pp-when]").textContent = "Nearly there";
      $("[data-pp-date]").textContent = "Ask for a mock test";
      $("[data-pp-cost]").textContent = fees ? pounds(fees.practical) : "";
      $("[data-pp-costline]").textContent = fees ? "the practical test" : "";
      $("[data-pp-m]").textContent = "Nearly there";
      return;
    }
    const rate = intensive ? g.intensive.price / g.intensive.hours : g.block.price / g.block.hours;
    const c = costToPass({ left: plan.left, rate, fees, theoryPassed: theory.checked });
    if (intensive) {
      $("[data-pp-when]").textContent = plan.left <= g.intensive.hours ? "One course" : `${Math.ceil(plan.left / g.intensive.hours)} courses`;
      $("[data-pp-date]").textContent = `${g.intensive.over}; dates agreed with you`;
    } else {
      $("[data-pp-when]").textContent = `${plan.weeks} ${plan.weeks === 1 ? "week" : "weeks"}`;
      const ready = new Date(`${plan.ready}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
      $("[data-pp-date]").textContent = `test-ready around ${ready}`;
    }
    $("[data-pp-cost]").textContent = pounds(c.total);
    const parts = [`${plan.left} hours at ${pounds(rate)}`];
    if (c.practical) parts.push(`test ${pounds(c.practical)}`);
    if (c.theory) parts.push(`theory ${pounds(c.theory)}`);
    $("[data-pp-costline]").textContent = `${parts.join(" + ")}${fees ? "" : " + test fees"}, rounded`;
    $("[data-pp-m]").innerHTML = intensive ? `<b>Intensive</b>, about ${pounds(c.total)}` : `<b>${plan.weeks} weeks</b>, about ${pounds(c.total)}`;
  };

  chips.forEach((b) => b.addEventListener("click", () => {
    choice = /** @type {string} */ (b.getAttribute("data-pp-h"));
    chips.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    paint();
  }));
  $("[data-pp-minus]").addEventListener("click", () => { soFar = Math.max(0, soFar - 5); paint(); });
  $("[data-pp-plus]").addEventListener("click", () => { soFar = Math.min(45, soFar + 5); paint(); });
  theory.addEventListener("change", paint);
  ctx.watch("gearbox", (g) => { if (lessons[g]) { gearbox = g; paint(); } });
  paint();
}
