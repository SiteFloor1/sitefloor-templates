// @ts-check
/**
 * The tasting flight: choose up to `size` pieces; they're laid out in tasting order (the shop's tasteOrder) with the
 * shop's line on each. When the flight is complete, it can be ordered for collection on WhatsApp. Sold-out pieces
 * (today's sheet) can't be chosen.
 */
import { flightOrder, flightText } from "../../lib/box.js";
import { collectionDays, collectionSlots, slotLabel } from "../../lib/orders.js";
import { stateOf } from "../../lib/bakes.js";
import { startBakes } from "../bakes/sheet-provider.js";
import { longDay } from "../../lib/cake.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const d = /** @type {any} */ (ctx.data), size = d.flight.size;
  const picks = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-tf]")]);
  const steps = /** @type {HTMLElement[]} */ ([...root.querySelectorAll(".tf-step")]);
  const count = /** @type {HTMLElement} */ (root.querySelector("[data-tf-count]"));
  const when = /** @type {HTMLSelectElement} */ (root.querySelector("[data-tf-when]"));
  const send = /** @type {HTMLAnchorElement} */ (root.querySelector("[data-tf-send]"));
  /** @type {string[]} */ let chosen = [];
  const of = (/** @type {HTMLElement} */ b) => ({ id: b.dataset.tf ?? "", name: b.dataset.name ?? "", notes: b.dataset.notes ?? "", tasteOrder: Number(b.dataset.order), src: new URL(b.dataset.src ?? "", location.href).href, allergens: [] });
  const cfg = d.collect ? { prepMinutes: d.collect.prepMinutes, step: 30, daysAhead: Math.min(3, d.collect.daysAhead) } : { prepMinutes: 30, step: 30, daysAhead: 2 };
  const fillWhen = () => {
    const now = ctx.now(), keep = when.value;
    /** @type {HTMLOptionElement[]} */ const opts = [];
    for (const day of collectionDays(d.hours, now, cfg)) for (const s of collectionSlots(d.hours, day, now, cfg)) opts.push(new Option(`${day === now.date ? "Today" : longDay(day)}, ${slotLabel(s)}`, `${day} ${s}`));
    when.replaceChildren(...opts.slice(0, 40));
    if (opts.some((o) => o.value === keep)) when.value = keep;
  };
  const render = () => {
    const pieces = flightOrder(chosen.map((id) => of(/** @type {HTMLElement} */ (picks.find((p) => p.dataset.tf === id)))));
    steps.forEach((li, i) => {
      const p = pieces[i];
      li.classList.toggle("is-set", Boolean(p));
      li.replaceChildren(Object.assign(document.createElement("span"), { className: "tf-no", textContent: String(i + 1) }));
      if (p) li.append(Object.assign(document.createElement("img"), { src: p.src, alt: "" }), Object.assign(document.createElement("b"), { textContent: p.name }), Object.assign(document.createElement("small"), { textContent: p.notes }));
    });
    for (const b of picks) {
      const on = chosen.includes(b.dataset.tf ?? "");
      b.setAttribute("aria-pressed", String(on));
      b.toggleAttribute("aria-disabled", !on && chosen.length >= size);
    }
    count.textContent = chosen.length === size ? "Your flight, in tasting order" : `Choose ${size - chosen.length} more`;
    const full = chosen.length === size;
    if (full) send.removeAttribute("aria-disabled"); else send.setAttribute("aria-disabled", "true");
    send.href = ctx.waHref(flightText({ business: d.name, pieces, price: d.flight.price, when: when.value ? when.options[when.selectedIndex].text : "as soon as you can" }));
  };
  root.addEventListener("click", (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    const b = /** @type {HTMLButtonElement|null} */ (t.closest("[data-tf]"));
    if (b && !b.disabled) {
      const id = b.dataset.tf ?? "";
      if (chosen.includes(id)) chosen = chosen.filter((x) => x !== id);
      else if (chosen.length < size) chosen = [...chosen, id];
    } else if (t.closest("[data-tf-clear]")) chosen = [];
    else if (t.closest("[data-tf-send]") && send.hasAttribute("aria-disabled")) { e.preventDefault(); picks.find((p) => !p.disabled && p.getAttribute("aria-pressed") === "false")?.focus(); return; }
    else return;
    render();
  });
  when.addEventListener("change", render);
  startBakes(ctx);
  ctx.watch("bakes", (/** @type {import("../../lib/bakes.js").Bakes} */ b) => {
    for (const p of picks) {
      const out = stateOf(b, { id: p.dataset.tf ?? "", name: p.dataset.name ?? "" })?.status === "sold out";
      p.disabled = out;
      if (out) chosen = chosen.filter((x) => x !== p.dataset.tf);
    }
    render();
  });
  fillWhen();
  ctx.everyMinute(() => { fillWhen(); render(); });
  render();
  root.dataset.ready = "true";
}
