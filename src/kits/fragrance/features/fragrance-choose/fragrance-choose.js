// @ts-check
/** Let them choose: the giver's amount and card go with the payment; the one who receives it sends a code and a choice. */
import { fill, pounds } from "../../lib/fragrance.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), c = data.choose;
  const give = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-give]")), get = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-get]"));
  const giveGo = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-give-go]")), getGo = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-get-go]"));
  if (!c || !give || !get || !giveGo || !getGo) throw new Error("let them choose markup missing");
  const render = () => {
    const g = new FormData(give), s = (/** @type {FormData} */ f, /** @type {string} */ k) => String(f.get(k) ?? "").trim();
    const a = c.amounts.find((/** @type {any} */ x) => String(x.amount) === s(g, "amount")) ?? c.amounts[0];
    const msg = ctx.bookHref(fill(c.message, { name: data.name, price: pounds(a.amount), to: s(g, "to") || "them", from: s(g, "from") || "me" }));
    giveGo.textContent = `Give ${pounds(a.amount)}`;
    giveGo.href = a.payLink || msg;
    const r = new FormData(get), x = data.fragrances.find((/** @type {any} */ f) => f.id === r.get("scent")) ?? data.fragrances[0];
    getGo.href = ctx.bookHref(fill(c.redeemMessage, { name: data.name, code: s(r, "code") || "(my code)", fragrance: x.name }));
  };
  for (const f of [give, get]) { f.addEventListener("input", render); f.addEventListener("change", render); }
  render();
}
