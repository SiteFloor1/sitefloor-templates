// @ts-check
/** Concierge: ticked services, a day and a time, written as one WhatsApp message. */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const c = /** @type {any} */ (ctx.data).concierge;
  const day = /** @type {HTMLInputElement} */ (root.querySelector("[data-rc-day]"));
  const time = /** @type {HTMLInputElement} */ (root.querySelector("[data-rc-time]"));
  const go = /** @type {HTMLAnchorElement} */ (root.querySelector("[data-rc-go]"));
  const today = ctx.now().date;
  day.min = today;
  root.querySelector("form")?.addEventListener("submit", (e) => e.preventDefault());
  const write = () => {
    const picks = [...root.querySelectorAll("input[type=checkbox]:checked")].map((i) => /** @type {HTMLInputElement} */ (i).value);
    const when = day.value ? new Date(`${day.value}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }) : "";
    const list = picks.length > 1 ? `${picks.slice(0, -1).join(", ")} and ${picks.at(-1)}` : picks[0] ?? "";
    const text = `${c.message}${when ? ` I arrive on ${when}${time.value ? ` around ${time.value}` : ""}.` : ""}${list ? ` Could you arrange ${list}?` : ""} Thank you.`;
    go.href = ctx.waHref(text); go.dataset.waText = text;
  };
  root.addEventListener("input", write); root.addEventListener("change", write);
  write();
}
