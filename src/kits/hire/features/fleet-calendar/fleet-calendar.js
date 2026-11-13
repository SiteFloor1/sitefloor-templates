// @ts-check
/**
 * The fleet calendar: a fortnight at a time from the business's own today (its UK clock, never the visitor's), each
 * self-drive car free or taken from the Sheet. Fails closed: no Sheet, an error or old data means no days are shown as
 * free. Days the business is closed for handovers are marked, still from its own hours.
 */
import { startAvailability } from "../fleet/sheet-provider.js";
import { addDays } from "../../../../core/lib/hours.js";
import { openingOn } from "../../../../core/lib/date-range.js";
import { shortDate, longDate } from "../../lib/words.js";

const DAYS = 14;
const AHEAD = 4; // fortnights

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const table = /** @type {HTMLTableElement} */ (root.querySelector("[data-fcal-table]"));
  const status = /** @type {HTMLElement} */ (root.querySelector("[data-fcal-status]"));
  const prev = /** @type {HTMLButtonElement} */ (root.querySelector("[data-fcal-prev]"));
  const next = /** @type {HTMLButtonElement} */ (root.querySelector("[data-fcal-next]"));
  const hire = /** @type {any} */ (ctx.data).hire;
  const rules = { hours: ctx.data.hours, region: hire.region, bankHolidays: "open", horizonDays: 730 };
  /** @type {any} */ let avail = null;
  let page = 0;

  function paint() {
    const start = addDays(ctx.now().date, page * DAYS);
    const days = Array.from({ length: DAYS }, (_, i) => addDays(start, i));
    const head = table.tHead?.rows[0];
    if (head) head.innerHTML = `<th scope="col">Car</th>${days.map((d) => `<th scope="col" abbr="${longDate(d)}">${shortDate(d).replace(" ", "<br>")}</th>`).join("")}`;
    const ok = avail?.ok === true;
    for (const row of table.querySelectorAll("tr[data-fcal-car]")) {
      const tr = /** @type {HTMLTableRowElement} */ (row);
      const taken = ok ? avail.taken[tr.dataset.fcalCar ?? ""] ?? [] : null;
      while (tr.cells.length > 1) tr.deleteCell(1);
      for (const d of days) {
        const td = tr.insertCell();
        const closed = openingOn(d, /** @type {any} */ (rules)).length === 0;
        const state = !ok ? "ask" : taken?.includes(d) ? "taken" : closed ? "closed" : "free";
        td.dataset.state = state;
        const name = tr.querySelector("a")?.textContent ?? "";
        const words = { free: "free", taken: "taken", closed: "closed for handovers", ask: "ask us" }[state];
        td.innerHTML = state === "free" ? `<a href="${tr.dataset.fcalUrl}#dates"><span class="sr-only">${name}, ${longDate(d)}: ${words}</span></a>` : `<span class="sr-only">${name}, ${longDate(d)}: ${words}</span>`;
      }
    }
    for (const r of table.querySelectorAll(".hr-fcal-cls th")) /** @type {HTMLTableCellElement} */ (r).colSpan = DAYS + 1;
    status.textContent = ok ? `${longDate(days[0])} to ${longDate(days[DAYS - 1])}, from our calendar.` : avail ? "We couldn't read our calendar just now. Ask us which cars are free." : "Checking our calendar…";
    prev.disabled = page === 0; next.disabled = page >= AHEAD - 1;
  }
  prev.addEventListener("click", () => { page = Math.max(0, page - 1); paint(); });
  next.addEventListener("click", () => { page = Math.min(AHEAD - 1, page + 1); paint(); });
  startAvailability(ctx);
  ctx.watch("hire:availability", (a) => { avail = a; paint(); });
  ctx.everyMinute(() => { if (!document.hidden) paint(); });
  paint();
}
