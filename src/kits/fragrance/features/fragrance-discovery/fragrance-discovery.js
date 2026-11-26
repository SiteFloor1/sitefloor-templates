// @ts-check
/** Discovery sets: choose the house's number of samples; the set fills as they're chosen and the order carries them. */
import { fill, pounds, joinAnd } from "../../lib/fragrance.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), d = data.discovery;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-disc-form]"));
  const count = root.querySelector("[data-disc-count]"), set = root.querySelector("[data-disc-set]");
  const go = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-disc-go]")), send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-disc-send]"));
  if (!d || !form || !count || !set || !go || !send) throw new Error("discovery markup missing");
  const boxes = /** @type {HTMLInputElement[]} */ ([...form.querySelectorAll("input[name=pick]")]);
  const render = () => {
    const ids = boxes.filter((b) => b.checked).map((b) => b.value);
    for (const b of boxes) b.disabled = !!b.closest("[data-held]")?.hasAttribute("hidden") || (!b.checked && ids.length >= d.pick);
    const names = ids.map((id) => data.fragrances.find((/** @type {any} */ f) => f.id === id)?.name ?? id);
    count.textContent = ids.length < d.pick ? `${ids.length} of ${d.pick} chosen` : `Your ${d.pick}, ready`;
    [...set.children].forEach((li, i) => { li.textContent = names[i] ?? ""; li.classList.toggle("on", i < names.length); });
    const msg = ctx.bookHref(fill(d.message, { name: data.name, fragrance: names.length ? joinAnd(names) : "(to choose)", ml: d.pick, price: pounds(d.price) }));
    go.href = d.payLink || msg; send.href = msg;
    go.toggleAttribute("aria-disabled", ids.length < d.pick);
  };
  form.addEventListener("change", render);
  document.addEventListener("fr-launch", render);
  render();
}
