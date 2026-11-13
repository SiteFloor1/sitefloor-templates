// @ts-check
/**
 * The client's live Sheet for client sites: the availability tab (which days each car is taken) and the deposits tab
 * (where a deposit is, by reference). Read once per page and shared; refreshed after two minutes. Fails closed: a
 * network error, timeout, unreadable or old sheet returns { ok: false } and the site says "ask us".
 */
import { availabilityFromCsv, depositFromCsv } from "../../lib/sheet.js";

const TIMEOUT_MS = 6000;
const FRESH_MS = 120_000;

/**
 * @typedef {object} FleetProvider
 * @property {(ctx: import("../../../../core/js/core.js").Ctx) => Promise<import("../../lib/sheet.js").Availability>} availability
 * @property {(ctx: import("../../../../core/js/core.js").Ctx, ref: string) => Promise<ReturnType<typeof depositFromCsv>>} deposit
 */

/** @param {string} url */
async function csv(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store", credentials: "omit" });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** @type {Promise<any>|null} */ let pending = null;
let loadedAt = 0;

/** @type {FleetProvider} */
export const sheetFleet = {
  availability(ctx) {
    if (pending && Date.now() - loadedAt < FRESH_MS) return pending;
    loadedAt = Date.now();
    const cfg = /** @type {any} */ (ctx.data).hire.availability;
    pending = csv(cfg.csvUrl).then((text) => (text === null ? { ok: false } : availabilityFromCsv(text, Date.now(), ctx.data.hours.timezone, cfg.staleAfterHours)));
    return pending;
  },
  async deposit(ctx, ref) {
    const cfg = /** @type {any} */ (ctx.data).hire.deposits;
    const text = await csv(cfg.csvUrl);
    return text === null ? { ok: false, reason: "error" } : depositFromCsv(text, ref, Date.now(), ctx.data.hours.timezone, cfg.staleAfterHours);
  },
};

/**
 * Starts the availability once per page for every feature that needs it and keeps it fresh each minute. Shared as
 * "hire:availability" (ctx.watch("hire:availability", …)).
 * @param {import("../../../../core/js/core.js").Ctx} ctx
 */
export function startAvailability(ctx) {
  const w = /** @type {any} */ (window);
  if (w.__sfFleet) return;
  w.__sfFleet = true;
  /** @type {FleetProvider|null} */
  const provider = ctx.providers.fleet;
  if (!provider) { ctx.share("hire:availability", { ok: false }); return; }
  const load = () => provider.availability(ctx).then((r) => ctx.share("hire:availability", r), () => ctx.share("hire:availability", { ok: false }));
  load();
  ctx.everyMinute(() => { if (!document.hidden) load(); });
}
