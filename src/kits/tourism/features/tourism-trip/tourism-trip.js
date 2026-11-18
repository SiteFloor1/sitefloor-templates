// @ts-check
/**
 * Your trip, by code: asks the provider (the operator's sheet; a simulation on the demo) and shows the journey, the
 * start date, the days to go and the link to it day by day. Fails closed with a plain reason and the phone number.
 */
import { cleanCode, daysTo, longDate } from "../../lib/tourism.js";

const WHY = {
  unknown: "We can't find that code. Check it against our email, or call us.",
  stale: "We haven't updated this for a while, so it may be out of date. Please call us for the latest.",
  unreadable: "This isn't loading right now. Please call us and we'll tell you where things stand.",
};

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data).tourism, provider = ctx.providers.trip;
  const q = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  const form = /** @type {HTMLFormElement|null} */ (q("[data-tt-form]")), input = /** @type {HTMLInputElement|null} */ (q("[data-tt-code]"));
  const out = q("[data-tt-out]"), off = q("[data-tt-off]"), link = /** @type {HTMLAnchorElement|null} */ (q("[data-tt-journey]"));
  if (!data?.trip || !provider || !form || !input || !out || !off || !link) throw new Error("trip markup or provider missing");
  const set = (/** @type {string} */ s, /** @type {string} */ v) => { const el = q(s); if (el) el.textContent = v; };
  /** @param {string} raw */
  const open = async (raw) => {
    const code = cleanCode(raw);
    if (!code) { input.setCustomValidity("Codes are 6 to 12 letters and numbers."); input.reportValidity(); return; }
    input.setCustomValidity(""); input.value = code;
    if (location.hash.slice(1) !== code) history.replaceState(null, "", `#${code}`);
    /** @type {any} */ let r;
    try { r = await provider.load(ctx, code); } catch { r = { ok: false, reason: "unreadable" }; }
    const j = r.ok ? data.journeys.find((/** @type {any} */ x) => x.id === r.journey) : null;
    if (!r.ok || !j) { out.hidden = true; off.hidden = false; off.textContent = WHY[/** @type {"unknown"|"stale"|"unreadable"} */ (r.reason)] ?? WHY.unreadable; return; }
    off.hidden = true; out.hidden = false;
    const d = daysTo(ctx.now().date, r.start);
    set("[data-tt-when]", d > 1 ? `${d} days to go` : d === 1 ? "Tomorrow" : d === 0 ? "Today" : "Under way");
    set("[data-tt-name]", j.name);
    set("[data-tt-meta]", `From ${longDate(r.start)} · ${j.nights} nights${r.travellers ? ` · ${r.travellers} travelling` : ""}`);
    const tpl = /** @type {HTMLTemplateElement|null} */ (q("template[data-tt-hrefs]"));
    const a = tpl?.content.querySelector(`[data-id="${j.id}"]`);
    if (a) link.href = /** @type {HTMLAnchorElement} */ (a).getAttribute("href") ?? link.href;
    const upd = new Date(`${r.updated}T12:00:00Z`);
    set("[data-tt-upd]", `Updated ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" }).format(upd)}.`);
  };
  form.addEventListener("submit", (e) => { e.preventDefault(); open(input.value); });
  q("[data-tt-try]")?.addEventListener("click", () => open(data.trip.example ?? ""));
  if (location.hash.length > 1) open(decodeURIComponent(location.hash.slice(1)));
}
