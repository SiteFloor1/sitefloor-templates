// @ts-check
/**
 * The lease-return check: the studio's prices (its sheet, simulated on a demo) beside each item it fixes, and what's
 * ticked added up into a "from" total and a WhatsApp message. An unreadable sheet leaves every price "Ask us".
 */
import { leaseTotal, leaseText } from "../../lib/lease.js";
import { gbp } from "../../../../core/lib/text.js";

/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx) => Promise<import("../../lib/lease.js").LeasePrices> }} LeaseProvider */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).detailing.lease;
  const provider = /** @type {LeaseProvider|null} */ (ctx.providers.leasePrices);
  const from = /** @type {HTMLElement|null} */ (root.querySelector("[data-ls-from]"));
  const form = root.querySelector("[data-ls-form]"), total = root.querySelector("[data-ls-total]"), say = root.querySelector("[data-ls-say]");
  const date = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-ls-date]")), go = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-ls-go]"));
  if (!form || !total || !say || !date || !go || !cfg) throw new Error("lease-return markup missing");
  /** @type {Map<string, number>} */ let prices = new Map();
  const update = () => {
    const ticked = [...form.querySelectorAll("[data-ls-item]:checked")].map((x) => /** @type {HTMLInputElement} */ (x).value);
    const t = leaseTotal(ticked, prices);
    // Nothing ticked is priced: say so, as the message does, rather than "from £0".
    const none = ticked.length > 0 && !t.priced.length;
    total.textContent = none ? "Ask us" : gbp(t.total);
    if (from) from.hidden = none;
    say.textContent = !ticked.length ? "Tick what you've found on your car."
      : [t.ask.length ? `We'll quote: ${t.ask.join(", ")}.` : "", t.notOurs.length ? `Not ours to fix: ${t.notOurs.join(", ")}.` : ""].filter(Boolean).join(" ") || "Everything ticked is priced.";
    go.href = ctx.waHref(leaseText({ opening: cfg.message, ticked, prices, returnBy: date.value || undefined }));
  };
  form.addEventListener("change", update);
  date.addEventListener("change", update);
  const fill = () => {
    for (const cell of /** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll("[data-ls-for]"))) {
      const p = prices.get(cell.dataset.lsFor ?? "");
      if (p) cell.textContent = `from ${gbp(p)}`;
    }
    update();
  };
  if (provider) provider.load(ctx).then((r) => { if (r.ok) prices = r.prices; fill(); }, () => fill());
  else update();
}
