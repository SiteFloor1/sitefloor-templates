// @ts-check
/**
 * HOL-7 on Signature: each home's next free dates, from the company's sheet of booked stays. A stale or unreadable
 * sheet shows nothing as free and says so.
 */
import { isStale, freeRuns, runText, updatedWord } from "../../lib/calendar.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export async function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).calendar;
  const provider = ctx.providers.stays;
  /** @type {{ ok: boolean, stays: any[], updated: number|null }} */ let r = { ok: false, stays: [], updated: null };
  try { if (provider) r = await provider.load(ctx); } catch { /* fails closed */ }
  const now = Date.now();
  if (!r.ok || isStale(r.updated, now, cfg.staleAfterHours)) { root.textContent = "Free dates aren't shown right now: ask us, or book through each home's link."; return; }
  const today = ctx.now().date;
  for (const el of /** @type {HTMLElement[]} */ ([...document.querySelectorAll("[data-sc-free]")])) {
    const runs = freeRuns(r.stays, el.dataset.scFree ?? "", today);
    el.textContent = runs.length ? `Next free: ${runs.map(runText).join(", ")}` : "Booked for the next twelve weeks";
    el.hidden = false;
  }
  root.textContent = `Free dates from our bookings sheet, updated ${updatedWord(r.updated ?? 0, today, ctx.data.hours.timezone)}.`;
}
