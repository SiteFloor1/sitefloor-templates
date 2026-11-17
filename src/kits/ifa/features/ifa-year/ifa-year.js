// @ts-check
/** Your year with us: makes a yearly review reminder as a calendar file, in the browser. */
import { reviewIcs } from "../../lib/year.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-year-form]"));
  if (!form) throw new Error("year markup missing");
  form.classList.remove("if-wait");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const month = Number(/** @type {HTMLSelectElement} */ (form.elements.namedItem("month")).value);
    const ics = reviewIcs({ firm: ctx.data.name, month, today: new Date(), note: /** @type {any} */ (ctx.data).year.note });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "yearly-review.ics";
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
}
