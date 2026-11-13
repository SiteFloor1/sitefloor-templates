// @ts-check
/** The drop-day line: now serving, how many are waiting, and where a ticket stands. Fails closed when the sheet is old. */
import { readQueueSheet, ticketPlace } from "../../lib/queue.js";
import { untilDrop, calendarDaysBetween } from "../../lib/drop.js";
import { liveOpens } from "../../browser/drop.js";

/** @param {HTMLElement} root @param {import("../../../../core/js/core.js").Ctx} ctx */
export function init(root, ctx) {
  const tz = root.dataset.tz ?? "Europe/London";
  const demo = document.body.dataset.mode === "demo";
  const each = Number(root.dataset.each ?? 2);
  const rolling = root.dataset.rollingDay ? { day: root.dataset.rollingDay, time: root.dataset.rollingTime ?? "10:00" } : null;
  /** @type {import("../../lib/queue.js").QueueRead|null} */ let q = null;
  const out = root.querySelector("[data-line-out]");
  const input = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-line-ticket]"));
  const place = () => {
    if (!out || !input) return;
    const t = Number(input.value);
    if (!q || !input.value || !Number.isInteger(t) || t < 1) { out.textContent = ""; return; }
    if (t > q.given) { out.textContent = "That number hasn't been given out yet."; return; }
    const p = ticketPlace(t, q, each);
    out.textContent = p.called ? "You've been called. Come to the door." : `${p.ahead} ahead of you, about ${Math.max(1, Math.round(p.wait))} min.`;
  };
  input?.addEventListener("input", place);
  root.querySelector("[data-line-form]")?.addEventListener("submit", (e) => e.preventDefault());
  const read = async () => {
    if (root.dataset.source === "fixed") {
      const f = JSON.parse(root.dataset.fixed ?? "{}");
      return { serving: f.serving, given: f.given, updated: Date.now(), note: f.note ?? "" };
    }
    try {
      const r = await fetch(root.dataset.csv ?? "", { cache: "no-store" });
      return r.ok ? readQueueSheet(await r.text(), { timeZone: tz, now: Date.now(), staleAfterMinutes: Number(root.dataset.stale ?? 20) }) : null;
    } catch { return null; }
  };
  const paint = async () => {
    const now = Date.now();
    const opens = liveOpens({ opens: root.dataset.opens ?? "", rolling }, tz, now);
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(now));
    const dropDay = calendarDaysBetween(today, opens.slice(0, 10)) === 0 && untilDrop(opens, now, tz).phase !== "before";
    q = dropDay || demo ? await read() : null;
    root.hidden = !q;
    if (!q) return;
    const set = (/** @type {string} */ sel, /** @type {string} */ text) => { const el = root.querySelector(sel); if (el) el.textContent = text; };
    set("[data-line-serving]", String(q.serving));
    set("[data-line-waiting]", `${q.given - q.serving} waiting.${q.note ? ` ${q.note}` : ""}`);
    set("[data-line-note]", demo && !dropDay ? "Shown here on drop day only. Demo numbers." : "From the staff's sheet at the door.");
    place();
  };
  paint();
  ctx.everyMinute(paint);
}
