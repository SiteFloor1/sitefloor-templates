// @ts-check
/** The timetable page: day tabs (arrow keys move between them), the hour now marked on today's rules, places when fresh. */
import { zonedNow } from "../../../../core/lib/hours.js";
import { placesWords } from "../../lib/gym.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const tabs = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll('[role="tab"]')]);
  const panels = /** @type {HTMLElement[]} */ ([...root.querySelectorAll('[role="tabpanel"]')]);
  const pick = (/** @type {number} */ i, /** @type {boolean} */ focus) => {
    tabs.forEach((t, j) => { t.setAttribute("aria-selected", String(i === j)); t.tabIndex = i === j ? 0 : -1; });
    panels.forEach((p, j) => { p.hidden = i !== j; });
    if (focus) tabs[i].focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => pick(i, false));
    t.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); pick((i + 1) % tabs.length, true); }
      if (e.key === "ArrowLeft") { e.preventDefault(); pick((i - 1 + tabs.length) % tabs.length, true); }
    });
  });
  const mark = () => {
    const now = zonedNow(new Date(), ctx.data.hours.timezone), h = Math.floor(now.minutes / 60);
    root.querySelectorAll(".gw-r").forEach((r) => r.classList.remove("now"));
    const today = panels.find((p) => p.dataset.date === now.date);
    today?.querySelector(`.gw-r[data-h="${h}"]`)?.classList.add("now");
  };
  ctx.watch("gymPlaces", (/** @type {any} */ p) => {
    root.querySelectorAll(".gt-s").forEach((s) => {
      const el = /** @type {HTMLElement} */ (s), out = /** @type {HTMLElement} */ (el.querySelector("[data-left]"));
      const n = p?.ok ? p.left[el.dataset.key ?? ""] : undefined;
      if (out) { out.hidden = n === undefined; out.textContent = n === undefined ? "" : placesWords(n); }
    });
  });
  mark();
  ctx.everyMinute(mark);
}
