// @ts-check
/**
 * The drop: a countdown to the florist's own day and time; while it's open, how many are left (re-read every minute
 * from their Sheet, or the demo's simulation). A count that's stale, missing or impossible is never shown.
 */
import { dropWindow, dropState, countdownParts, sheetTime, eventIcs } from "../../lib/social.js";
import { startStudio } from "../../lib/studio.js";

const pad = (/** @type {number} */ n) => String(n).padStart(2, "0");

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const D = /** @type {any} */ (ctx.data).florist;
  const Dr = D?.drop;
  if (!Dr) throw new Error("the drop: data missing");
  const clock = /** @type {HTMLElement|null} */ (root.querySelector("[data-drop-clock]"));
  const now = /** @type {HTMLElement|null} */ (root.querySelector("[data-drop-now]"));
  const order = /** @type {HTMLElement|null} */ (root.querySelector("[data-drop-order]"));
  if (!clock || !now) throw new Error("the drop: markup missing");
  /** @type {{ left: number|null, updated: number|null }} */ let count = { left: null, updated: null };

  const paint = () => {
    const t = Date.now();
    const w = dropWindow(Dr.when, t, D.timeZone);
    const s = dropState({ ...w, made: Dr.made, left: count.left, updated: count.updated, staleMinutes: Dr.staleMinutes, nowMs: t });
    clock.hidden = s.phase !== "soon";
    now.hidden = s.phase === "soon";
    if (order) order.hidden = s.phase !== "open" && s.phase !== "unknown";
    root.classList.toggle("is-open", s.phase === "open" || s.phase === "unknown");
    root.classList.toggle("is-sold", s.phase === "sold");
    if (s.phase === "soon") {
      const p = countdownParts(s.ms);
      for (const k of /** @type {const} */ (["d", "h", "m", "s"])) { const el = clock.querySelector(`[data-d="${k}"]`); if (el) el.textContent = pad(p[k]); }
      clock.setAttribute("aria-label", `${p.d} days ${p.h} hours ${p.m} minutes until the drop`);
    } else if (s.phase === "open") now.textContent = `Open now: ${s.left} of ${s.of} left.`;
    else if (s.phase === "sold") now.textContent = "Sold out. The next drop is next week.";
    else now.textContent = "Open now. Check our Instagram stories for what's left.";
  };

  // Clients: the studio Sheet (drop,left / drop,updated). The demo: its simulation.
  const provider = ctx.providers.florist;
  if (Dr.demo && typeof provider?.drop === "function") {
    const read = async () => { count = await provider.drop(ctx); paint(); };
    void read(); ctx.everyMinute(() => void read());
  } else {
    startStudio(ctx);
    ctx.watch("studio", (s) => {
      if (!s?.ok) return;
      const left = /^\d{1,3}$/.test(s.drop?.left ?? "") ? Number(s.drop.left) : null;
      count = { left, updated: sheetTime(s.drop?.updated ?? "", D.timeZone) };
      paint();
    });
  }
  paint();
  setInterval(paint, 1000);

  const cal = root.querySelector("[data-drop-cal]");
  if (cal) cal.addEventListener("click", () => {
    const w = dropWindow(Dr.when, Date.now(), D.timeZone);
    const opens = w.opens > Date.now() ? w.opens : w.opens + 7 * 86400000;
    const ics = eventIcs({ startMs: opens, minutes: 30, summary: `${ctx.data.name}: ${Dr.name}`, description: `${Dr.made} made. ${D.url}/drop`, url: `${D.url}/drop`,
      alarm: `${Dr.name} opens in 10 minutes`, alarmMinutes: 10, stamp: new Date(), uid: `drop-${opens}@${location.hostname || "sitefloor"}` });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "the-drop.ics";
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    cal.textContent = "Added: open the file to save it";
  });
}
