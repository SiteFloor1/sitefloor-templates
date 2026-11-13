// @ts-check
/**
 * Private dining enquiry: works out the set menu total for the group and whether it meets the room's
 * minimum spend, warns when the group is outside the room's numbers, and writes the WhatsApp message.
 */
import { money, toPence } from "../../lib/order.js";

/**
 * The line under the form: guest numbers, the set menu total and the minimum spend.
 * @param {{ n: number, lo: number, hi: number, min: number, roomName: string, menuName: string, price: number|null }} o min in pence
 */
export function summary(o) {
  /** @type {string[]} */ const parts = [];
  if (o.n < o.lo || o.n > o.hi) parts.push(`${o.roomName} takes ${o.lo}–${o.hi} guests.`);
  if (o.price !== null) {
    const total = toPence(o.price) * o.n;
    const spend = !o.min ? "." : total >= o.min ? `, which covers the ${money(o.min)} minimum spend.` : `; the room's minimum spend is ${money(o.min)}.`;
    parts.push(`${o.menuName}: ${money(total)} for ${o.n}${spend}`);
  } else if (o.min) parts.push(`${o.roomName} has a ${money(o.min)} minimum spend on food and drink.`);
  return parts.join(" ");
}

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).privateDining;
  const guests = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-pd-guests]")), date = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-pd-date]"));
  const room = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-pd-roomsel]")), menu = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-pd-menusel]"));
  const sum = root.querySelector("[data-pd-sum]"), send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-pd-send]"));
  if (!cfg || !guests || !date || !room || !sum || !send) throw new Error("private dining markup missing");
  date.min = ctx.now().date;
  const update = () => {
    const n = Math.max(1, Math.floor(Number(guests.value) || 0));
    const r = /** @type {HTMLElement|null} */ (root.querySelector(`[data-pd-room="${room.value}"]`));
    const [lo, hi] = (r?.dataset.seats ?? "1-999").split("-").map(Number);
    const m = menu?.value ? /** @type {HTMLElement|null} */ (root.querySelector(`[data-pd-menu="${menu.value}"]`)) : null;
    const roomName = room.selectedOptions[0]?.textContent ?? "";
    const menuText = menu?.selectedOptions[0]?.textContent ?? "";
    sum.textContent = summary({ n, lo, hi, min: toPence(Number(r?.dataset.min ?? 0)), roomName, menuName: menuText.replace(/ \(.*\)$/, ""), price: m ? Number(m.dataset.price) : null }) || " ";
    const when = date.value ? new Date(`${date.value}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "a date to agree";
    send.href = ctx.waHref([cfg.message, "", `Guests: ${n}`, `Date: ${when}`, `Room: ${roomName}`, m ? `Menu: ${menuText}` : "Menu: not sure yet"].join("\n"));
  };
  root.addEventListener("input", update);
  root.addEventListener("change", update);
  update();
}
