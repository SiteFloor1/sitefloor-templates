// @ts-check
/** The driver checker: the customer's answers against this car's rules, read back. Never an approval. */
import { checkDriver } from "../../lib/rules.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const rule = JSON.parse(root.dataset.dcRule ?? "{}");
  const out = /** @type {HTMLElement} */ (root.querySelector("[data-dc-out]"));
  const num = (/** @type {string} */ s) => /** @type {HTMLInputElement} */ (root.querySelector(s)).value;
  root.addEventListener("input", () => {
    const [age, years, points] = [num("[data-dc-age]"), num("[data-dc-years]"), num("[data-dc-points]")];
    if (age === "" || years === "" || points === "") { out.textContent = ""; delete out.dataset.state; return; }
    const r = checkDriver(rule, { age: Number(age), licenceYears: Number(years), points: Number(points) });
    out.dataset.state = r.fits ? "fits" : "misses";
    out.textContent = r.fits ? "Your answers fit our rules for this car. Send the request and we'll check your licence." : r.misses.join(" ");
  });
}
