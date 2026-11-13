// @ts-check
/** Weddings: the date check uses only the florist's taken dates and notice; the request carries the date (or the month from the flower calendar) and place. */
import { weddingDate } from "../../lib/orders.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const W = /** @type {any} */ (ctx.data).florist?.weddings;
  const date = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-wd-date]"));
  const place = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-wd-place]"));
  const say = root.querySelector("[data-wd-say]");
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-wd-send]"));
  if (!W || !date || !place || !say || !send) throw new Error("weddings: markup or data missing");
  date.min = ctx.now().date;
  // From the flower calendar: weddings?month=5 carries the month until a date is chosen.
  const m = Number(new URLSearchParams(location.search).get("month"));
  const month = Number.isInteger(m) && m >= 1 && m <= 12 ? new Date(Date.UTC(2000, m - 1, 1)).toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" }) : "";
  const refresh = () => {
    let line = month && !date.value ? `Planning for ${month}? Choose the day and we'll check it.` : "";
    if (date.value) {
      const r = weddingDate(date.value, ctx.now().date, W);
      line = r.state === "past" ? "That date has passed." : r.state === "taken" ? "We're already committed that day. Ask about the days either side." : r.state === "soon" ? `That's ${r.weeks} weeks away; we usually need ${W.minWeeks}. Ask anyway and we'll say honestly.` : `${r.weeks} weeks away. Ask and we'll confirm whether we're free.`;
    }
    say.textContent = line;
    const lines = [W.consult.message];
    if (month && !date.value) lines.push(`Month: ${month}`);
    if (date.value) lines.push(`Date: ${new Date(`${date.value}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}`);
    if (place.value.trim()) lines.push(`Where: ${place.value.trim()}`);
    send.href = ctx.waHref(lines.join("\n"));
  };
  date.addEventListener("input", refresh);
  place.addEventListener("input", refresh);
  send.addEventListener("click", refresh);
  refresh();
}
