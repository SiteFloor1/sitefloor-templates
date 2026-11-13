// @ts-check
/** Collection request: quantities, the day and time within opening hours, the total and allergens, sent on WhatsApp. */
import { collectionDays, collectionSlots, slotLabel, basket, collectText } from "../../lib/orders.js";
import { allergenName } from "../../../../core/lib/allergens.js";
import { gbp } from "../../../../core/lib/text.js";
import { longDay } from "../../lib/cake.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const d = /** @type {any} */ (ctx.data);
  const cfg = { prepMinutes: d.collect.prepMinutes, step: d.collect.step, daysAhead: d.collect.daysAhead };
  const rows = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-co-item]")]);
  const items = rows.map((r) => ({ id: r.dataset.coItem ?? "", name: r.dataset.name ?? "", price: Number(r.dataset.price), allergens: (r.dataset.allergens ?? "").split(" ").filter(Boolean) }));
  /** @type {Record<string, number>} */ const qty = {};
  const daySel = /** @type {HTMLSelectElement} */ (root.querySelector("[data-co-day]"));
  const timeSel = /** @type {HTMLSelectElement} */ (root.querySelector("[data-co-time]"));
  const nameIn = /** @type {HTMLInputElement} */ (root.querySelector("[data-co-name]"));
  const count = root.querySelector("[data-co-count]"), total = root.querySelector("[data-co-total]"), all = root.querySelector("[data-co-allergens]");
  const send = /** @type {HTMLAnchorElement} */ (root.querySelector("[data-co-send]"));
  if (!daySel || !timeSel || !count || !total || !all || !send) throw new Error("collect markup missing");

  const fillDays = () => {
    const now = ctx.now();
    const keep = daySel.value;
    const days = collectionDays(d.hours, now, cfg);
    daySel.replaceChildren(...days.map((day, i) => new Option(i === 0 && day === now.date ? "Today" : day === now.date ? "Today" : longDay(day).replace(/ \d{4}$/, ""), day)));
    if (days.includes(keep)) daySel.value = keep;
    fillTimes();
  };
  const fillTimes = () => {
    const keep = timeSel.value;
    const slots = daySel.value ? collectionSlots(d.hours, daySel.value, ctx.now(), cfg) : [];
    timeSel.replaceChildren(...slots.map((s) => new Option(slotLabel(s) + (Number(s.slice(0, 2)) >= 24 ? " (after midnight)" : ""), s)));
    if (slots.includes(keep)) timeSel.value = keep;
    update();
  };
  const update = () => {
    const b = basket(items, qty);
    for (const r of rows) { const q = r.querySelector("[data-co-q]"); if (q) q.textContent = String(qty[r.dataset.coItem ?? ""] ?? 0); }
    count.textContent = b.count ? `${b.count} item${b.count === 1 ? "" : "s"}` : "Nothing chosen yet";
    total.textContent = b.count ? gbp(b.total) : "";
    const names = b.allergens.length ? [...new Set(b.allergens)].map(allergenName) : [];
    all.textContent = b.count ? (names.length ? `Contains ${names.join(", ")}.` : "None of it lists an allergen.") : "";
    const when = daySel.value && timeSel.value ? `${daySel.options[daySel.selectedIndex].text}, ${timeSel.options[timeSel.selectedIndex].text}` : "as soon as you can";
    send.href = ctx.waHref(collectText({ business: d.name, when, items: b.picked.map((p) => ({ name: p.name, qty: p.qty })), total: b.total, name: nameIn.value, note: "", allergenNames: names }));
    send.toggleAttribute("aria-disabled", !b.count);
  };
  root.addEventListener("click", (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    const row = /** @type {HTMLElement|null} */ (t.closest("[data-co-item]"));
    if (!row) return;
    const id = row.dataset.coItem ?? "";
    if (t.closest("[data-co-more]")) qty[id] = Math.min(20, (qty[id] ?? 0) + 1);
    else if (t.closest("[data-co-less]")) qty[id] = Math.max(0, (qty[id] ?? 0) - 1);
    else return;
    update();
  });
  send.addEventListener("click", (e) => { if (send.hasAttribute("aria-disabled")) { e.preventDefault(); /** @type {HTMLElement|null} */ (rows[0]?.querySelector("button[data-co-more]") ?? null)?.focus(); } });
  daySel.addEventListener("change", fillTimes);
  timeSel.addEventListener("change", update);
  nameIn.addEventListener("input", update);
  fillDays();
  ctx.everyMinute(fillDays);
  root.dataset.ready = "true";
}
