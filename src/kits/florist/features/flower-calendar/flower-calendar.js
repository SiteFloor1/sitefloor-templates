// @ts-check
/** The flower calendar: marks this month by the shop's clock, so the page is right whenever it was built. */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const month = Number(ctx.now().date.slice(5, 7));
  const li = root.querySelector(`[data-cal-month="${month}"]`);
  if (!li) return;
  li.classList.add("is-now");
  li.querySelector("[data-cal-now]")?.removeAttribute("hidden");
  root.querySelector(`[data-cal-jump="${month}"]`)?.setAttribute("aria-current", "date");
}
