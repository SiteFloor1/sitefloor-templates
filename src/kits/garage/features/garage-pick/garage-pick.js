// @ts-check
/**
 * Pick your car, see your bays. Two parts can carry it: the chips (with the answer and the reserve link) and the
 * drawn plan. The chips share the car as "garage-car"; the plan, the aerial hall and the night route follow it.
 */
import { CARS, pickBay, answer, fits, reserveMessage } from "../../lib/garage.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const d = /** @type {any} */ (ctx.data);
  if (!d.hall) return;
  /** @param {string} key */
  const carOf = (key) => CARS[/** @type {keyof typeof CARS} */ (key)] ?? CARS.estate;
  if (root.hasAttribute("data-pick-chips")) {
    const ans = root.querySelector("[data-pick-answer]"), go = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-pick-reserve]"));
    const buttons = [...root.querySelectorAll("[data-car]")];
    const say = (/** @type {string} */ key) => {
      const car = carOf(key), b = pickBay(d.hall, car), a = answer(car, b, d.hall.bayDepth);
      if (ans) ans.textContent = a.text;
      if (go) { go.href = ctx.bookHref(reserveMessage(d.name, car, b)); go.textContent = b ? `Reserve bay ${b.n}` : "Join the waiting list"; }
      buttons.forEach((x) => x.setAttribute("aria-pressed", String(x.getAttribute("data-car") === key)));
    };
    buttons.forEach((btn) => btn.addEventListener("click", () => { const k = btn.getAttribute("data-car") ?? "estate"; say(k); ctx.share("garage-car", k); }));
    say("estate");
  }
  if (root.hasAttribute("data-pick-plan")) {
    const plan = root.querySelector("[data-plan]");
    const light = (/** @type {string} */ key) => {
      const car = carOf(key), best = pickBay(d.hall, car);
      for (const row of d.hall.rows) for (const b of row.bays) {
        const g = plan?.querySelector(`[data-bay="${b.n}"]`);
        if (!g) continue;
        g.classList.toggle("is-fit", b.free && fits(car, b, d.hall.bayDepth));
        g.classList.toggle("is-tight", b.free && !fits(car, b, d.hall.bayDepth));
        g.classList.toggle("is-best", best?.n === b.n);
      }
    };
    root.querySelectorAll("[data-layer]").forEach((btn) => btn.addEventListener("click", () => {
      const on = btn.getAttribute("aria-pressed") !== "true";
      btn.setAttribute("aria-pressed", String(on));
      plan?.classList.toggle(`show-${btn.getAttribute("data-layer")}`, on);
    }));
    ctx.watch("garage-car", light);
    light("estate");
  }
}
