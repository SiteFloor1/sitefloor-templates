// @ts-check
/**
 * Your proposal, by code: asks the provider (the agency's sheet; a simulation on the demo) and shows the set of design
 * visuals it names, the date and days to go, the guests and how they sit, and a link to the room drawn. Fails closed with
 * a plain reason and the phone number.
 */
import { cleanCode, daysTo, longDate, LAYOUTS, dayMonth } from "../../lib/events.js";

const WHY = {
  unknown: "We can't find that code. Check it against our email, or call us.",
  stale: "We haven't updated this proposal for a while, so it may have changed. Please call us for the latest.",
  unreadable: "This isn't loading right now. Please call us and we'll talk you through it.",
};

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data).events, provider = ctx.providers.proposal;
  const q = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  const form = q("[data-pr-form]"), input = /** @type {HTMLInputElement|null} */ (q("[data-pr-code]"));
  const out = q("[data-pr-out]"), off = q("[data-pr-off]"), sets = q("[data-pr-sets]"), next = q("[data-pr-next]");
  if (!data?.proposal || !provider || !form || !input || !out || !off || !sets || !next) throw new Error("proposal markup or provider missing");
  const set = (/** @type {string} */ s, /** @type {string} */ v) => { const el = q(s); if (el) el.textContent = v; };
  const close = (/** @type {string} */ why) => { out.hidden = true; sets.hidden = true; next.hidden = true; off.hidden = false; off.textContent = why; };
  /** @param {string} raw */
  const open = async (raw) => {
    const code = cleanCode(raw);
    if (!code) { input.setCustomValidity("Codes are 6 to 12 letters and numbers."); input.reportValidity(); return; }
    input.setCustomValidity(""); input.value = code;
    if (location.hash.slice(1) !== code) history.replaceState(null, "", `#${code}`);
    /** @type {any} */ let r;
    try { r = await provider.load(ctx, code); } catch { r = { ok: false, reason: "unreadable" }; }
    if (!r.ok) { close(WHY[/** @type {"unknown"|"stale"|"unreadable"} */ (r.reason)] ?? WHY.unreadable); return; }
    off.hidden = true; out.hidden = false; sets.hidden = false; next.hidden = false;
    for (const el of /** @type {HTMLElement[]} */ ([...sets.querySelectorAll("[data-pr-set]")])) el.hidden = el.dataset.prSet !== r.visuals;
    const d = daysTo(ctx.now().date, r.date);
    set("[data-pr-when]", d > 1 ? `${d} days to go` : d === 1 ? "Tomorrow" : d === 0 ? "Today" : "After the day");
    const lay = /** @type {Record<string, string>} */ (LAYOUTS)[r.layout] ?? "";
    set("[data-pr-meta]", `${longDate(r.date)}${r.guests ? ` · ${r.guests} guests` : ""}${lay ? ` · ${lay.toLowerCase()}` : ""}`);
    const room = /** @type {HTMLAnchorElement|null} */ (q("[data-pr-room]"));
    if (room) {
      room.hidden = !r.room;
      if (r.room) room.href = `${room.href.split("#")[0]}#${new URLSearchParams({ room: r.room, ...(r.guests ? { guests: String(r.guests) } : {}), layout: r.layout })}`;
    }
    set("[data-pr-upd]", `Updated ${dayMonth(r.updated)}.`);
  };
  // a message left from a mistyped code must not block the next try
  input.addEventListener("input", () => input.setCustomValidity(""));
  form.addEventListener("submit", (e) => { e.preventDefault(); open(input.value); });
  q("[data-pr-try]")?.addEventListener("click", () => open(data.proposal.example ?? ""));
  if (location.hash.length > 1) open(decodeURIComponent(location.hash.slice(1)));
}
