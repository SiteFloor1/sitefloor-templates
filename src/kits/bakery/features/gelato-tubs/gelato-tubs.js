// @ts-check
/** Take-home gelato: a tub, its flavours (not ones off today), a collection time, the order on WhatsApp. */
import { tubQuote, tubText } from "../../lib/tubs.js";
import { collectionDays, collectionSlots, slotLabel } from "../../lib/orders.js";
import { stateOf } from "../../lib/bakes.js";
import { startBakes } from "../bakes/sheet-provider.js";
import { longDay } from "../../lib/cake.js";
import { gbp } from "../../../../core/lib/text.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const d = /** @type {any} */ (ctx.data);
  const sizes = /** @type {HTMLInputElement[]} */ ([...root.querySelectorAll('[name="gt-size"]')]);
  const picks = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-gt]")]);
  const when = /** @type {HTMLSelectElement} */ (root.querySelector("[data-gt-when]"));
  const send = /** @type {HTMLAnchorElement} */ (root.querySelector("[data-gt-send]"));
  /** @type {string[]} */ let chosen = [];
  const tub = () => d.tubs.sizes.find((/** @type {any} */ z) => z.id === (sizes.find((s) => s.checked) ?? sizes[0]).value);
  const cfg = d.collect ? { prepMinutes: d.collect.prepMinutes, step: 30, daysAhead: Math.min(3, d.collect.daysAhead) } : { prepMinutes: 20, step: 30, daysAhead: 2 };
  const fillWhen = () => {
    const now = ctx.now(), keep = when.value;
    /** @type {HTMLOptionElement[]} */ const opts = [];
    for (const day of collectionDays(d.hours, now, cfg)) for (const s of collectionSlots(d.hours, day, now, cfg)) opts.push(new Option(`${day === now.date ? "Today" : longDay(day)}, ${slotLabel(s)}`, `${day} ${s}`));
    when.replaceChildren(...opts.slice(0, 40));
    if (opts.some((o) => o.value === keep)) when.value = keep;
  };
  const render = () => {
    const t = tub();
    chosen = chosen.slice(0, t.flavours);
    const q = tubQuote(t, chosen.map((id) => ({ id, name: /** @type {HTMLElement} */ (picks.find((p) => p.dataset.gt === id)).dataset.name ?? id })));
    for (const p of picks) { const on = chosen.includes(p.dataset.gt ?? ""); p.setAttribute("aria-pressed", String(on)); p.toggleAttribute("aria-disabled", !on && q.full); }
    /** @type {HTMLElement} */ (root.querySelector("[data-gt-count]")).textContent = q.full ? q.flavours.map((f) => f.name).join(", ") : `Choose ${q.left} more`;
    /** @type {HTMLElement} */ (root.querySelector("[data-gt-price]")).textContent = gbp(q.price);
    if (q.flavours.length) send.removeAttribute("aria-disabled"); else send.setAttribute("aria-disabled", "true");
    send.href = ctx.waHref(tubText(q, { business: d.name, when: when.value ? when.options[when.selectedIndex].text : "as soon as you can" }));
  };
  root.addEventListener("click", (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    const b = /** @type {HTMLButtonElement|null} */ (t.closest("[data-gt]"));
    if (b && !b.disabled) {
      const id = b.dataset.gt ?? "";
      if (chosen.includes(id)) chosen = chosen.filter((x) => x !== id);
      else if (chosen.length < tub().flavours) chosen = [...chosen, id];
      render();
    } else if (t.closest("[data-gt-send]") && send.hasAttribute("aria-disabled")) { e.preventDefault(); picks.find((p) => !p.disabled)?.focus(); }
  });
  for (const s of sizes) s.addEventListener("change", render);
  when.addEventListener("change", render);
  startBakes(ctx);
  ctx.watch("bakes", (/** @type {import("../../lib/bakes.js").Bakes} */ b) => {
    for (const p of picks) {
      const out = stateOf(b, { id: p.dataset.gt ?? "", name: p.dataset.name ?? "" })?.status === "sold out";
      p.disabled = out;
      /** @type {HTMLElement} */ (p.querySelector("[data-gt-out]")).hidden = !out;
      if (out) chosen = chosen.filter((x) => x !== p.dataset.gt);
    }
    render();
  });
  fillWhen();
  ctx.everyMinute(() => { fillWhen(); render(); });
  render();
  root.dataset.ready = "true";
}
