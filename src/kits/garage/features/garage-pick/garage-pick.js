// @ts-check
/**
 * Pick your car, see your bays. Two parts can carry it: the chips (with the answer and the reserve link) and the
 * drawn plan. The chips share the car as "garage-car"; the plan, the aerial hall and the night route follow it.
 */
import { CARS, pickBay, answer, fits, reserveMessage, withFree } from "../../lib/garage.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const d = /** @type {any} */ (ctx.data);
  if (!d.hall) return;
  let hall = d.hall, key = "estate";
  /** @param {string} key */
  const carOf = (key) => CARS[/** @type {keyof typeof CARS} */ (key)] ?? CARS.estate;
  if (root.hasAttribute("data-pick-chips")) {
    const ans = root.querySelector("[data-pick-answer]"), go = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-pick-reserve]"));
    const buttons = [...root.querySelectorAll("[data-car]")];
    const say = (/** @type {string} */ key) => {
      const car = carOf(key), b = pickBay(hall, car), a = answer(car, b, hall.bayDepth);
      if (ans) ans.textContent = a.text;
      if (go) { go.href = ctx.bookHref(reserveMessage(d.name, car, b)); go.textContent = b ? `Reserve bay ${b.n}` : "Join the waiting list"; }
      buttons.forEach((x) => x.setAttribute("aria-pressed", String(x.getAttribute("data-car") === key)));
    };
    buttons.forEach((btn) => btn.addEventListener("click", () => { key = btn.getAttribute("data-car") ?? "estate"; say(key); ctx.share("garage-car", key); }));
    ctx.watch("garage-free", (f) => { hall = withFree(d.hall, f); say(key); });
    say(key);
  }
  if (root.hasAttribute("data-pick-plan")) {
    const plan = root.querySelector("[data-plan]");
    const light = (/** @type {string} */ k) => {
      const car = carOf(k), best = pickBay(hall, car);
      for (const row of hall.rows) for (const b of row.bays) {
        const g = plan?.querySelector(`[data-bay="${b.n}"]`);
        if (!g) continue;
        g.classList.toggle("is-free", !!b.free);
        g.classList.toggle("is-fit", !!b.free && fits(car, b, hall.bayDepth));
        g.classList.toggle("is-tight", !!b.free && !fits(car, b, hall.bayDepth));
        g.classList.toggle("is-best", best?.n === b.n);
      }
    };
    root.querySelectorAll("[data-layer]").forEach((btn) => btn.addEventListener("click", () => {
      const on = btn.getAttribute("aria-pressed") !== "true";
      btn.setAttribute("aria-pressed", String(on));
      plan?.classList.toggle(`show-${btn.getAttribute("data-layer")}`, on);
    }));
    ctx.watch("garage-car", (k) => { key = k; light(k); });
    ctx.watch("garage-free", (f) => { hall = withFree(d.hall, f); light(key); });
    light(key);
  }
}
