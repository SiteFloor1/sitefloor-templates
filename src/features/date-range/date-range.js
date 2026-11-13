// @ts-check
/**
 * Shared date picker. Enhances the plain date inputs with a month calendar (one ARIA grid, roving focus), keeps the inputs
 * and the calendar in step, and offers only the business's own times on the chosen day. Every rule is in
 * core/lib/date-range.js and runs on the business's UK clock (ctx.now), never the visitor's.
 *
 * Talks to its kit through shared state:
 *   ctx.share(`date-range:${id}`, result)          on every change: the checkRange result plus the raw selection
 *   ctx.watch(`date-range:${id}:blocked`, blocked) the kit's Sheet: { status: "ok", dates } or { status: "error" }
 * and fires a bubbling "dr-change" event on its root with the same result.
 */
import { checkRange, dayState, dayLabel, monthWeeks, monthName, slotsOn, earliest, shortDay } from "../../core/lib/date-range.js";
import { addDays, DAY_NAMES } from "../../core/lib/hours.js";

const HEAD = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const FULL = [1, 2, 3, 4, 5, 6, 0].map((d) => DAY_NAMES[d]);

/** @type {import("../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const id = root.dataset.dr ?? "dates";
  /** @type {import("../../core/lib/date-range.js").RangeRules} */
  const rules = { ...JSON.parse(root.dataset.drRules ?? "{}"), hours: ctx.data.hours, region: root.dataset.drRegion || "england-wales" };
  const q = (/** @type {string} */ s) => /** @type {any} */ (root.querySelector(s));
  const fromIn = /** @type {HTMLInputElement} */ (q("[data-dr-from]"));
  const toIn = /** @type {HTMLInputElement|null} */ (q("[data-dr-to]"));
  const fromTime = /** @type {HTMLSelectElement|null} */ (q("[data-dr-from-time]"));
  const toTime = /** @type {HTMLSelectElement|null} */ (q("[data-dr-to-time]"));
  const cal = /** @type {HTMLElement} */ (q("[data-dr-cal]"));
  const status = /** @type {HTMLElement} */ (q("[data-dr-status]"));
  const sheetNote = /** @type {HTMLElement} */ (q("[data-dr-sheet]"));
  /** @type {import("../../core/lib/date-range.js").Blocked} */
  let blocked = null;
  let now = ctx.now();
  let view = now.date.slice(0, 7); // YYYY-MM shown
  let focus = now.date;

  // The calendar's frame is built once; only its cells change, so nothing on the page moves.
  cal.innerHTML = `<div class="dr-head"><button type="button" class="dr-nav" data-dr-prev aria-label="Previous month">‹</button>`
    + `<h3 class="dr-month" id="${id}-month" aria-live="polite"></h3><button type="button" class="dr-nav" data-dr-next aria-label="Next month">›</button></div>`
    + `<table class="dr-grid" role="grid" aria-labelledby="${id}-month"><thead><tr>${HEAD.map((h, i) => `<th scope="col" abbr="${FULL[i]}">${h}</th>`).join("")}</tr></thead><tbody></tbody></table>`;
  const body = /** @type {HTMLElement} */ (cal.querySelector("tbody"));
  const monthEl = /** @type {HTMLElement} */ (cal.querySelector(".dr-month"));
  const prev = /** @type {HTMLButtonElement} */ (cal.querySelector("[data-dr-prev]"));
  const next = /** @type {HTMLButtonElement} */ (cal.querySelector("[data-dr-next]"));

  const sel = () => ({ from: fromIn.value || undefined, to: toIn?.value || undefined, fromTime: fromTime?.value || undefined, toTime: toTime?.value || undefined });
  const lastDay = () => addDays(now.date, rules.horizonDays);
  const monthOf = (/** @type {string} */ iso) => iso.slice(0, 7);
  const shift = (/** @type {string} */ ym, /** @type {number} */ n) => {
    const [y, m] = ym.split("-").map(Number), t = y * 12 + (m - 1) + n;
    return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, "0")}`;
  };

  /** Times on offer for the chosen day; the others stay listed but disabled, so the list never jumps. */
  const fitTimes = () => {
    const first = earliest(now, rules.leadHours ?? 0);
    for (const [select, date, after] of /** @type {[HTMLSelectElement|null, string, number][]} */ ([
      [fromTime, fromIn.value, fromIn.value === first.date ? first.minutes : 0],
      [toTime, toIn?.value ?? "", 0],
    ])) {
      if (!select) continue;
      const ok = date ? slotsOn(date, rules, after) : rules.slots ?? [];
      for (const o of select.options) if (o.value) o.disabled = !ok.includes(o.value);
      if (select.value && !ok.includes(select.value)) select.value = "";
      if (!select.value && date && ok.length === 1) select.value = ok[0];
    }
  };

  /** What the shown month looks like now; a repaint happens only when this changes. */
  let painted = "";
  const shape = () => `${view}|${JSON.stringify(sel())}|${monthWeeks(Number(view.slice(0, 4)), Number(view.slice(5, 7))).flat().map((d) => (d ? dayState(d, rules, now, blocked)[0] : "")).join("")}`;

  const paint = () => {
    painted = shape();
    const hadFocus = body.contains(document.activeElement);
    const [y, m] = view.split("-").map(Number);
    monthEl.textContent = monthName(y, m);
    prev.disabled = view <= monthOf(now.date);
    next.disabled = view >= monthOf(lastDay());
    const s = sel();
    const weeks = monthWeeks(y, m);
    while (weeks.length < 6) weeks.push(Array(7).fill(null)); // always six rows: the height never changes
    if (monthOf(focus) !== view) focus = weeks.flat().find((d) => d && dayState(d, rules, now, blocked) === "free") ?? `${view}-01`;
    body.innerHTML = weeks.map((w) => `<tr>${w.map((d) => {
      if (!d) return `<td class="dr-empty" role="gridcell" aria-hidden="true"></td>`;
      const st = dayState(d, rules, now, blocked);
      const isEnd = d === s.from || d === s.to;
      const inside = s.from && s.to && d > s.from && d < s.to;
      return `<td role="gridcell" class="dr-day" data-day="${d}" data-state="${st}"${isEnd ? " data-end" : ""}${inside ? " data-in" : ""}`
        + ` aria-selected="${isEnd || inside ? "true" : "false"}"${st === "free" ? "" : ' aria-disabled="true"'} tabindex="${d === focus ? 0 : -1}"`
        + ` aria-label="${dayLabel(d, st)}${d === s.from ? (rules.single ? ", chosen" : ", pick-up") : d === s.to ? ", return" : ""}">${Number(d.slice(8))}</td>`;
    }).join("")}</tr>`).join("");
    // Keep a keyboard or screen-reader user on the same day after a repaint.
    if (hadFocus) /** @type {HTMLElement|null} */ (body.querySelector(`[data-day="${focus}"]`))?.focus();
  };

  const report = () => {
    fitTimes();
    const s = sel();
    const r = checkRange(s, rules, now, blocked);
    const times = (/** @type {string|undefined} */ t) => (t ? ` ${t}` : "");
    let text = "";
    if (r.ok) text = rules.single ? `${shortDay(s.from ?? "")}${times(s.fromTime)}` : `${shortDay(s.from ?? "")}${times(s.fromTime)} → ${shortDay(s.to ?? "")}${times(s.toTime)} · ${r.periods} ${r.hours !== undefined ? "day" : "night"}${r.periods === 1 ? "" : "s"}`;
    else if (s.from || s.to) text = r.reason ?? "";
    status.textContent = text;
    sheetNote.textContent = blocked?.status === "error" ? "We couldn't read our calendar just now, so taken days aren't shown. Ask us to check your dates." : "";
    const result = { ...r, selection: s, sheet: blocked?.status ?? "none" };
    ctx.share(`date-range:${id}`, result);
    root.dispatchEvent(new CustomEvent("dr-change", { bubbles: true, detail: result }));
  };

  /** A day chosen on the calendar: the first tap is the start, the next one on or after it the end. @param {string} d */
  const choose = (d) => {
    if (dayState(d, rules, now, blocked) !== "free") return;
    if (rules.single || !toIn) fromIn.value = d;
    else if (!fromIn.value || toIn.value || d < fromIn.value) { fromIn.value = d; toIn.value = ""; }
    else toIn.value = d;
    focus = d;
    paint();
    report();
    /** @type {HTMLElement|null} */ (body.querySelector(`[data-day="${d}"]`))?.focus();
  };

  const move = (/** @type {string} */ d) => {
    if (d < now.date || d > lastDay()) return;
    focus = d;
    if (monthOf(d) !== view) { view = monthOf(d); paint(); }
    for (const c of body.querySelectorAll("[data-day]")) /** @type {HTMLElement} */ (c).tabIndex = c.getAttribute("data-day") === d ? 0 : -1;
    /** @type {HTMLElement|null} */ (body.querySelector(`[data-day="${d}"]`))?.focus();
  };

  body.addEventListener("click", (e) => {
    const c = /** @type {HTMLElement} */ (e.target).closest("[data-day]");
    if (c) choose(c.getAttribute("data-day") ?? "");
  });
  body.addEventListener("keydown", (e) => {
    const c = /** @type {HTMLElement} */ (e.target).closest("[data-day]");
    if (!c) return;
    const d = c.getAttribute("data-day") ?? "";
    const wd = (new Date(`${d}T12:00:00Z`).getUTCDay() + 6) % 7;
    /** @type {Record<string, () => void>} */
    const keys = {
      ArrowLeft: () => move(addDays(d, -1)), ArrowRight: () => move(addDays(d, 1)),
      ArrowUp: () => move(addDays(d, -7)), ArrowDown: () => move(addDays(d, 7)),
      Home: () => move(addDays(d, -wd)), End: () => move(addDays(d, 6 - wd)),
      PageUp: () => move(addDays(d, -28)), PageDown: () => move(addDays(d, 28)),
      Enter: () => choose(d), " ": () => choose(d),
    };
    if (keys[e.key]) { e.preventDefault(); keys[e.key](); }
  });
  prev.addEventListener("click", () => { view = shift(view, -1); paint(); });
  next.addEventListener("click", () => { view = shift(view, 1); paint(); });

  // Typing in the plain inputs works too; the calendar follows.
  root.addEventListener("change", (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    if (t === fromIn || t === toIn) {
      const d = /** @type {HTMLInputElement} */ (t).value;
      if (d && d >= now.date && d <= lastDay()) { view = monthOf(d); focus = d; }
      paint();
    }
    report();
  });

  fromIn.min = now.date; fromIn.max = lastDay();
  if (toIn) { toIn.min = now.date; toIn.max = lastDay(); }
  ctx.watch(`date-range:${id}:blocked`, (b) => { blocked = b ?? null; paint(); report(); });
  ctx.everyMinute(() => {
    const was = now.date;
    now = ctx.now();
    if (now.date !== was) { fromIn.min = now.date; if (toIn) toIn.min = now.date; }
    if (shape() !== painted) paint(); // a new day, or a day that has just become too soon; otherwise leave the grid alone
    fitTimes();
  });
  paint();
  report();
}
