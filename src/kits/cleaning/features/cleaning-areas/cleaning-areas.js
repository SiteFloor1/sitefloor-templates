// @ts-check
/**
 * The postcode check: the company's districts, and with cleaning-free-days the next free days from its sheet (through
 * the `cleaningDays` provider), which fails closed: an old, unreadable or missing sheet says "ask us", never a date.
 */
import { areaAnswer } from "../../lib/areas.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).cleaning;
  const form = root.querySelector("[data-areas-form]"), input = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-areas-in]"));
  const out = /** @type {HTMLElement|null} */ (root.querySelector("[data-areas-out]"));
  if (!cfg?.areas || !form || !input || !out) throw new Error("postcode check markup or config missing");
  const provider = cfg.days ? ctx.providers.cleaningDays : null;
  /** @type {Promise<any>|null} */ let days = null;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (provider) days ??= provider.load(ctx).catch(() => ({ ok: false }));
    const free = provider ? await days : null;
    const a = areaAnswer(input.value, cfg.areas.districts, free);
    out.textContent = a.text;
    out.dataset.state = a.state;
  });
}
