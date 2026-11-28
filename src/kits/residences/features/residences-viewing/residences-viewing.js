// @ts-check
/** Book a viewing: the choices become one WhatsApp message to the operator. */
import { homesState } from "../residences-homes/load.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const v = /** @type {any} */ (ctx.data).viewing;
  const home = /** @type {HTMLSelectElement} */ (root.querySelector("[data-rv-home]"));
  const day = /** @type {HTMLInputElement} */ (root.querySelector("[data-rv-day]"));
  const time = /** @type {HTMLSelectElement} */ (root.querySelector("[data-rv-time]"));
  const go = /** @type {HTMLAnchorElement} */ (root.querySelector("[data-rv-go]"));
  const today = ctx.now().date;
  day.min = today;
  root.addEventListener("submit", (e) => e.preventDefault());
  const write = () => {
    const kind = /** @type {HTMLInputElement|null} */ (root.querySelector("input[name=rv-kind]:checked"))?.value ?? "";
    const when = day.value ? new Date(`${day.value}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }) : "";
    const what = home.value ? home.selectedOptions[0].textContent : "one of the free homes";
    const text = `${v.message} I'd like to see ${what}${kind ? `, ${kind.toLowerCase()}` : ""}${when ? `, on ${when}` : ""}, in the ${time.value.toLowerCase()}.`;
    go.href = ctx.waHref(text); go.dataset.waText = text;
  };
  homesState(ctx).then((s) => {
    for (const h of s.homes) { const o = document.createElement("option"); o.value = h.ref; o.textContent = h.name; home.append(o); }
    const want = new URLSearchParams(location.search).get("home");
    if (want && s.homes.some((h) => h.ref === want)) home.value = want;
    write();
  });
  root.addEventListener("input", write); root.addEventListener("change", write);
  write();
}
