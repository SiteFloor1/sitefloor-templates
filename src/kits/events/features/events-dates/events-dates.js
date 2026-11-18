// @ts-check
/**
 * Is your date free? Asks the provider (the agency's sheet; a simulation on the demo) once, shows the next free day on
 * the agency's usual days and answers for any date chosen. Fails closed: when the sheet can't be read or is out of
 * date, the next free day is hidden and the answer asks them to message instead.
 */
import { statusOf, nextFree, dateWords, dayMonth } from "../../lib/events.js";

const WHY = {
  stale: "We haven't updated our diary here for a few days. Message us and we'll check it for you.",
  unreadable: "Our diary isn't loading right now. Message us and we'll check the date for you.",
};

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).events?.dates, provider = ctx.providers.eventDates;
  const q = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  const form = q("[data-ed-form]"), input = /** @type {HTMLInputElement|null} */ (q("[data-ed-date]")), out = q("[data-ed-out]");
  if (!cfg || !provider || !form || !input || !out) throw new Error("date check markup or provider missing");
  const today = ctx.now().date;
  input.min = today;
  /** @type {any} */ let r = { ok: false, reason: "unreadable" };
  const ready = Promise.resolve().then(() => provider.load(ctx)).catch(() => ({ ok: false, reason: "unreadable" })).then((/** @type {any} */ x) => { r = x; ctx.share("eventDates", x); show(); });
  const show = () => {
    if (!r.ok) return;
    const n = nextFree(r.taken, today, cfg.days, cfg.leadDays);
    const el = q("[data-ed-next]"), wrap = q("[data-ed-next-wrap]");
    if (n && el && wrap) { el.textContent = dayMonth(n); wrap.hidden = false; }
  };
  const opener = q("[data-ed-open]");
  opener?.addEventListener("click", () => { root.classList.add("ev-open"); opener.setAttribute("aria-expanded", "true"); opener.hidden = true; input.focus(); });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await ready;
    const v = input.value;
    if (!v) return;
    root.dataset.state = r.ok ? statusOf(r.taken, v) : "unknown";
    out.textContent = r.ok ? dateWords(statusOf(r.taken, v), v) : WHY[/** @type {"stale"|"unreadable"} */ (r.reason)] ?? WHY.unreadable;
  });
}
