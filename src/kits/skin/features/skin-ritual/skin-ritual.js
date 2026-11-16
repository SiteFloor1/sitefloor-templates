// @ts-check
/**
 * The ritual builder: the chosen facial and add-ons, summed in the clinic's order, and the clinic's message filled
 * in with the whole ritual, its minutes and its price.
 */
import { fill, minutesWords, pounds, ritualSum, ritualWords } from "../../lib/skin.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), cfg = data.rituals;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-rt-form]"));
  const name = root.querySelector("[data-rt-name]"), adds = root.querySelector("[data-rt-adds]"), total = root.querySelector("[data-rt-total]");
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-rt-send]"));
  if (!cfg || !form || !name || !adds || !total || !send) throw new Error("ritual markup missing");
  const render = () => {
    const fd = new FormData(form);
    const base = cfg.bases.find((/** @type {any} */ b) => b.id === fd.get("base")) ?? cfg.bases[0];
    const sum = ritualSum(base, cfg.addOns, /** @type {string[]} */ (fd.getAll("add")));
    name.textContent = base.name;
    adds.replaceChildren(...sum.picked.map((/** @type {any} */ a) => Object.assign(document.createElement("li"), { textContent: `with ${a.name.charAt(0).toLowerCase()}${a.name.slice(1)}` })));
    total.textContent = `${minutesWords(sum.minutes)} · ${base.from ? "from " : ""}${pounds(sum.price)}`;
    const words = ritualWords(base, sum.picked).replace(/^the /, "");
    send.href = ctx.bookHref(fill(cfg.message, { name: data.name, treatment: words, minutes: sum.minutes, price: sum.price }));
  };
  form.addEventListener("change", render);
  render();
}
