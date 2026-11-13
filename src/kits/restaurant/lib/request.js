// @ts-check
/**
 * The table request message: what the restaurant needs to answer in one reply. A request, never a
 * confirmed booking; the restaurant replies to confirm.
 */

/**
 * @param {{ opening: string, guests: number, day: string, time: string, seat?: string, group?: string, preorder?: string, notes?: string }} o
 */
export function tableRequestText(o) {
  return [
    o.opening,
    "",
    `Table for ${o.guests}`,
    `${o.day}, ${o.time}`,
    o.seat ? `Where we'd like to sit, if you can: ${o.seat}` : "",
    o.group ? `Our group: ${o.group}` : "",
    o.preorder ? `We'd like to pre-order:\n${o.preorder}` : "",
    o.notes ? `Notes: ${o.notes}` : "",
  ].filter((l, i) => l !== "" || i === 1).join("\n").trim();
}

/**
 * Times a table can be asked for in a sitting, every `step` minutes, ending `beforeEnd` before last orders.
 * @param {{ from: string, to: string, lastOrders?: string }} s @param {number} step @param {number} beforeEnd
 * @returns {string[]} "HH:MM"
 */
export function slotTimes(s, step = 15, beforeEnd = 30) {
  const m = (/** @type {string} */ t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const end = m(s.lastOrders ?? s.to) - beforeEnd;
  /** @type {string[]} */ const out = [];
  for (let t = m(s.from); t <= end; t += step) out.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
  return out;
}
