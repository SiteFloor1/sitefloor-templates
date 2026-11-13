// @ts-check
/**
 * Takeaway tray: quantities, a running total in pence, the allergens in the order (shown before the
 * order is sent, as the FSA asks for distance orders), collection times from now + readyMinutes to last
 * orders, and the WhatsApp message. Cakes to order (order.daysAhead and a [data-od-day] choice): collection days
 * start after the longest notice in the order (each dish's leadDays), and an order over the shop's threshold asks for
 * its fixed deposit through the shop's own Stripe Payment Link.
 */
import { priceOrder, orderMessage, money, collectionDays, depositFor } from "../../lib/order.js";
import { dishData } from "../../lib/filter.js";
import { sittingState } from "../../lib/sittings.js";
import { toMinutes, formatTime12, rangesFor } from "../../../../core/lib/hours.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).order;
  const sittings = /** @type {any} */ (ctx.data).sittings ?? [];
  const items = /** @type {HTMLElement[]} */ ([...root.querySelectorAll(".od-item")]);
  const lines = root.querySelector("[data-od-lines]"), total = root.querySelector("[data-od-total]"), all = root.querySelector("[data-od-all]");
  const time = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-od-time]"));
  const name = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-od-name]")), notes = /** @type {HTMLTextAreaElement|null} */ (root.querySelector("[data-od-notes]"));
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-od-send]"));
  if (!cfg || !lines || !total || !all || !time || !name || !notes || !send) throw new Error("order markup missing");
  const dishes = items.map((el) => ({ ...dishData(el), leadDays: Number(el.dataset.lead ?? 0), el }));
  const day = /** @type {HTMLSelectElement|null} */ (cfg.daysAhead ? root.querySelector("[data-od-day]") : null);
  const deposit = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-od-deposit]"));
  const dayName = (/** @type {string} */ d) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

  // Cakes to order: the days to collect, from the longest notice in the order; times every 30 minutes while open.
  const fillDays = () => {
    if (!day) return;
    const now = ctx.now(), prev = day.value;
    const { lead, days } = collectionDays(priceOrder(qty, dishes).lines, now.date, (d) => rangesFor(ctx.data.hours, d).ranges.length > 0, cfg.daysAhead);
    day.replaceChildren(...days.map((d, i) => Object.assign(document.createElement("option"), { value: d, textContent: d === now.date ? "Today" : dayName(d) + (i === 0 && lead ? " (the first we can make it)" : "") })));
    if ([...day.options].some((o) => o.value === prev)) day.value = prev;
  };
  const fillDayTimes = () => {
    if (!day) return;
    const now = ctx.now(), d = day.value, prev = time.value;
    time.replaceChildren();
    for (const r of d ? rangesFor(ctx.data.hours, d).ranges : []) {
      const from = Math.max(toMinutes(r[0]) + 30, d === now.date ? now.minutes + cfg.readyMinutes : 0);
      for (let t = Math.ceil(from / 30) * 30; t <= toMinutes(r[1]) - 30; t += 30) time.append(Object.assign(document.createElement("option"), { value: formatTime12(t), textContent: formatTime12(t) }));
    }
    if (!time.options.length) time.append(Object.assign(document.createElement("option"), { value: "", textContent: "No times left that day" }));
    if ([...time.options].some((o) => o.value === prev)) time.value = prev;
  };
  /** @type {Record<string, number>} */ const qty = {};

  const fillTimes = () => {
    if (day) { fillDays(); fillDayTimes(); return; }
    const now = ctx.now();
    const { current, next } = sittingState(sittings, now);
    const s = current ?? (next && next.inDays === 0 ? next.sitting : null);
    const prev = time.value;
    time.replaceChildren();
    if (!s) { const o = document.createElement("option"); o.value = ""; o.textContent = "The kitchen's closed today; ask us"; time.append(o); return; }
    const start = Math.max(now.minutes + cfg.readyMinutes, toMinutes(s.from) + cfg.readyMinutes);
    const end = toMinutes(s.lastOrders ?? s.to);
    for (let t = Math.ceil(start / 15) * 15; t <= end; t += 15) {
      const o = document.createElement("option"); o.value = formatTime12(t); o.textContent = `${formatTime12(t)} today`; time.append(o);
    }
    if (!time.options.length) { const o = document.createElement("option"); o.value = ""; o.textContent = "Too late for today; ask us"; time.append(o); }
    if ([...time.options].some((o) => o.value === prev)) time.value = prev;
  };

  const update = () => {
    const order = priceOrder(qty, dishes);
    for (const d of dishes) {
      const n = qty[d.id] ?? 0;
      const out = d.el.querySelector("[data-od-n]"); if (out) out.textContent = String(n);
      const minus = /** @type {HTMLButtonElement|null} */ (d.el.querySelector("[data-od-minus]")); if (minus) minus.disabled = n === 0;
      d.el.classList.toggle("on", n > 0);
    }
    lines.replaceChildren(...(order.lines.length ? order.lines.map((l) => {
      const li = document.createElement("li");
      li.innerHTML = '<span></span><b></b>';
      /** @type {HTMLElement} */ (li.firstChild).textContent = `${l.qty} × ${l.dish.name}`;
      /** @type {HTMLElement} */ (li.lastChild).textContent = money(l.pence);
      return li;
    }) : [Object.assign(document.createElement("li"), { className: "rs-small", textContent: "Nothing yet. Tap + to add a dish." })]));
    total.textContent = money(order.totalPence);
    all.textContent = order.lines.length ? (order.allergens.length ? `Allergens in this order: ${order.allergens.join(", ")}.` : "No listed allergens in this order.") : "";
    const ready = order.lines.length > 0 && time.value !== "";
    const dep = depositFor(order.totalPence, cfg.deposit);
    if (deposit) { deposit.hidden = !dep; if (dep) { deposit.href = dep.link; deposit.textContent = `Pay the ${money(dep.pence)} deposit by card`; } }
    const when = day && day.value ? `${day.value === ctx.now().date ? "today" : dayName(day.value)}, ${time.value}` : time.value;
    const extra = dep ? `Deposit: ${money(dep.pence)}, paying by card online` : "";
    send.setAttribute("aria-disabled", String(!ready));
    send.href = ctx.waHref(ready ? orderMessage(order, { opening: cfg.message, time: when, name: name.value.trim(), notes: [extra, notes.value.trim()].filter(Boolean).join(". ") }) : cfg.message);
  };

  root.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement} */ (e.target).closest("[data-od-plus], [data-od-minus]");
    if (!b) return;
    const id = /** @type {HTMLElement} */ (b.closest(".od-item")).dataset.dish ?? "";
    qty[id] = Math.max(0, Math.min(20, (qty[id] ?? 0) + (b.hasAttribute("data-od-plus") ? 1 : -1)));
    if (day) { fillDays(); fillDayTimes(); }
    update();
  });
  send.addEventListener("click", (e) => { if (send.getAttribute("aria-disabled") === "true") e.preventDefault(); });
  for (const el of [time, name, notes]) el.addEventListener("input", update);
  time.addEventListener("change", update);
  day?.addEventListener("change", () => { fillDayTimes(); update(); });
  fillTimes();
  update();
  ctx.everyMinute(() => { fillTimes(); update(); });
}
