// @ts-check
/** For our neighbours: this week at the site, from the builder's sheet; unknown, old or unreadable says to call. */
import { agoWords } from "../../lib/progress.js";

const WHY = {
  unknown: "There's no news for this site this week. Call us and we'll tell you what's happening.",
  stale: "We haven't updated this for a while, so it may be out of date. Please call us for the latest.",
  unreadable: "This isn't loading right now. Please call us and we'll tell you what's happening.",
};

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export async function init(root, ctx) {
  const provider = ctx.providers.neighbours;
  const site = root.dataset.nbSite ?? "";
  const q = (/** @type {string} */ s) => /** @type {HTMLElement} */ (root.querySelector(s));
  const out = q("[data-nb-out]"), off = q("[data-nb-off]");
  if (!provider || !site || !out || !off) throw new Error("neighbours markup or provider missing");
  /** @type {any} */ let r;
  try { r = await provider.load(ctx, site); } catch { r = { ok: false, reason: "unreadable" }; }
  if (!r.ok) { off.textContent = WHY[/** @type {"unknown"|"stale"|"unreadable"} */ (r.reason)] ?? WHY.unreadable; return; }
  off.hidden = true; out.hidden = false;
  q("[data-nb-when]").textContent = `Updated ${agoWords(Date.now() - r.updatedAt)}`;
  q("[data-nb-week]").textContent = r.week;
  q("[data-nb-noisy]").textContent = r.noisy; q("[data-nb-noisy-row]").hidden = !r.noisy;
  q("[data-nb-del]").textContent = r.deliveries; q("[data-nb-del-row]").hidden = !r.deliveries;
}
