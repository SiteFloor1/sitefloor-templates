// @ts-check
/**
 * The class passport: the code typed (or in the link's hash) is looked up in the studio's sheet through a provider
 * (the sheet on client sites, simulated on demos). Unknown, stale or unreadable: say so and point to the desk; never
 * show a guess.
 */
import { cleanCode, nextMilestone, daysUntil, ordinal } from "../../lib/members.js";
import { dayName } from "../../lib/classes.js";

/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx, code: string) => Promise<import("../../lib/members.js").Passport> }} PassportProvider */

/** @param {number|null} left */
const leftWords = (left) => (left === null ? "Membership: no count" : left === 0 ? "None. Time for a new card." : `${left} ${left === 1 ? "class" : "classes"}`);

/** @param {string} expires @param {string} today */
function useBy(expires, today) {
  if (!expires) return "No end date";
  const d = daysUntil(today, expires);
  if (d < 0) return "Expired";
  return `${dayName(expires)}${d <= 14 ? ` (${d === 0 ? "today" : `${d} days`})` : ""}`;
}

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), cfg = data.pilates?.passport;
  /** @type {PassportProvider|null} */
  const provider = ctx.providers.passport;
  const q = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  const form = /** @type {HTMLFormElement|null} */ (q("[data-pp-form]")), input = /** @type {HTMLInputElement|null} */ (q("#pp-code"));
  const msg = q("[data-pp-msg]"), card = q("[data-pp-card]"), holes = q("[data-pp-holes]");
  if (!cfg || !form || !input || !msg || !card || !holes) throw new Error("class passport markup missing");
  const set = (/** @type {string} */ sel, /** @type {string} */ t) => { const el = q(sel); if (el) el.textContent = t; };
  const REASONS = { unknown: "That code isn't on our list. Check it against your welcome message, or ask at the desk.", stale: "Your passport hasn't been updated lately. Ask at the desk.", unreadable: "Your passport can't be read just now. Ask at the desk." };

  /** @param {string} raw */
  const open = async (raw) => {
    const code = cleanCode(raw);
    card.hidden = true;
    if (!code) { msg.textContent = "Codes are 8 to 12 letters and numbers."; return; }
    if (!provider) { msg.textContent = REASONS.unreadable; return; }
    msg.textContent = "Opening…";
    const p = await provider.load(ctx, code).catch(() => /** @type {const} */ ({ ok: false, reason: "unreadable" }));
    if (!p.ok) { msg.textContent = REASONS[p.reason]; return; }
    msg.textContent = "";
    const today = ctx.now().date;
    set("[data-pp-card-name]", p.card || "Your card");
    holes.replaceChildren(...(p.left !== null && p.left <= 20 ? Array.from({ length: p.left }, () => document.createElement("span")) : []));
    holes.hidden = !holes.childElementCount;
    set("[data-pp-left]", leftWords(p.left));
    set("[data-pp-expires]", useBy(p.expires, today));
    set("[data-pp-month]", `${p.month} ${p.month === 1 ? "class" : "classes"}`);
    set("[data-pp-total]", `${p.total} ${p.total === 1 ? "class" : "classes"}`);
    const n = nextMilestone(p.total, cfg.milestones);
    set("[data-pp-next]", n ? `Your ${ordinal(n.at)} class, ${n.toGo} to go` : "Every milestone done");
    const at = new Date(p.updatedAt).toLocaleString("en-GB", { timeZone: data.hours.timezone, weekday: "long", hour: "numeric", minute: "2-digit" });
    set("[data-pp-updated]", `${data.mode === "demo" ? "Demo passport. " : ""}Updated ${at}.`);
    card.hidden = false;
  };
  form.addEventListener("submit", (e) => { e.preventDefault(); open(input.value); });
  root.querySelector("[data-pp-try]")?.addEventListener("click", (e) => { input.value = /** @type {HTMLElement} */ (e.currentTarget).dataset.ppTry ?? ""; open(input.value); });
  const fromHash = cleanCode(location.hash.replace(/^#/, ""));
  if (fromHash) { input.value = fromHash; open(fromHash); }
}
