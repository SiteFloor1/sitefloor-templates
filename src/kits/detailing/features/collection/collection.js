// @ts-check
/**
 * Collection and delivery: the district of the postcode typed and the day chosen, answered from the studio's sheet
 * (simulated on a demo). Unreadable or stale means "ask us", never a yes. Only the district is used or sent.
 */
import { districtOf, collectionAnswer, DAY_NAMES } from "../../lib/collection.js";

/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx) => Promise<import("../../lib/collection.js").Rounds> }} CollectionProvider */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cl = /** @type {any} */ (ctx.data).detailing.collection;
  const provider = /** @type {CollectionProvider|null} */ (ctx.providers.collectionDays);
  const form = root.querySelector("[data-cl-form]"), pc = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-cl-pc]"));
  const day = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-cl-day]")), out = root.querySelector("[data-cl-out]"), go = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-cl-go]"));
  if (!form || !pc || !day || !out || !go || !cl) throw new Error("collection markup missing");
  const rounds = provider ? provider.load(ctx).catch(() => /** @type {const} */ ({ ok: false, reason: "unreadable" })) : Promise.resolve(/** @type {const} */ ({ ok: false, reason: "unreadable" }));
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const district = districtOf(pc.value);
    if (!district) { out.textContent = "That doesn't look like a UK postcode. Try the first half, like KT13."; go.href = ctx.waHref(cl.message); return; }
    const dayName = /** @type {any} */ (DAY_NAMES)[day.value];
    go.href = ctx.waHref(`${cl.message}\n\nPostcode district: ${district}\nDay: ${dayName}`);
    const r = await rounds;
    out.textContent = r.ok ? collectionAnswer(r.districts, district, day.value).words : `We can't check ${district} just now. Ask us and we'll tell you.`;
  });
}
