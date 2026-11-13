// @ts-check
/**
 * Celebration cakes: the price of a cake from the shop's own price table, how many it serves, what's in it, the earliest
 * day it can be ready, the WhatsApp request and a "remind me next year" calendar file. Used by the Cake Builder and the
 * celebration cakes page. Nothing here is a guess: every number comes from the shop's settings (site.json → cakes).
 */
import { ALLERGENS, hasDiet } from "../../../core/lib/allergens.js";
import { addDays, rangesFor } from "../../../core/lib/hours.js";
import { gbp } from "../../../core/lib/text.js";

/** @typedef {{ id: string, name: string, price?: number, allergens: string[], diets?: string[] }} Part */
/** @typedef {Part & { colour: string }} Sponge */
/** @typedef {Part & { kind: string, coloured?: boolean, glaze?: string }} Finish */
/** @typedef {Part & { kind: string, colour?: string }} Topping */
/** @typedef {{ id: string, label: string, inches: number, servings: number, price: number }} Size */
/** @typedef {{ id: string, label: string, sizes: string[] }} Stack */
/**
 * @typedef {object} Cakes the shop's cake settings
 * @property {number} leadDays whole days' notice
 * @property {string} cutoff requests after this time (HH:MM) count from the next day
 * @property {number} maxDaysAhead
 * @property {Size[]} sizes
 * @property {Stack[]} stacks bottom tier first
 * @property {Sponge[]} sponges
 * @property {Sponge[]} fillings
 * @property {Finish[]} finishes price is per tier
 * @property {{ id: string, name: string, hex: string }[]} colours
 * @property {Topping[]} toppings
 * @property {number} maxToppings
 * @property {{ max: number, price: number }} message
 */
/** @typedef {{ stack: string, sponge: string, filling: string, finish: string, colour: string, toppings: string[], message: string }} Choice */

/** @param {{ id: string }[]} list @param {string} id */
const find = (list, id) => list.find((x) => x.id === id);

/**
 * What the chosen cake is, costs and serves, line by line.
 * @param {Cakes} c @param {Choice} ch
 */
export function quote(c, ch) {
  const stack = /** @type {Stack} */ (find(c.stacks, ch.stack) ?? c.stacks[0]);
  const sizes = stack.sizes.map((id) => /** @type {Size} */ (find(c.sizes, id)));
  const sponge = /** @type {Sponge} */ (find(c.sponges, ch.sponge) ?? c.sponges[0]);
  const filling = /** @type {Sponge} */ (find(c.fillings, ch.filling) ?? c.fillings[0]);
  const finish = /** @type {Finish} */ (find(c.finishes, ch.finish) ?? c.finishes[0]);
  const colour = /** @type {{ id: string, name: string, hex: string }|null} */ (finish.coloured === false ? null : find(c.colours, ch.colour) ?? c.colours[0]);
  const toppings = ch.toppings.map((id) => /** @type {Topping|undefined} */ (find(c.toppings, id))).filter((t) => t !== undefined).slice(0, c.maxToppings);
  const message = ch.message.trim().slice(0, c.message.max);
  const tiers = sizes.length;
  /** @type {{ label: string, price: number }[]} */
  const lines = [
    { label: stack.label, price: sizes.reduce((s, z) => s + z.price, 0) },
    ...(sponge.price ? [{ label: `${sponge.name} sponge`, price: sponge.price * tiers }] : []),
    ...(filling.price ? [{ label: filling.name, price: filling.price * tiers }] : []),
    ...(finish.price ? [{ label: finish.name, price: finish.price * tiers }] : []),
    ...toppings.filter((t) => t.price).map((t) => ({ label: t.name, price: /** @type {number} */ (t.price) })),
    ...(message && c.message.price ? [{ label: "Message plaque", price: c.message.price }] : []),
  ];
  const parts = /** @type {Part[]} */ ([sponge, filling, finish, ...toppings]);
  const allergens = ALLERGENS.filter((a) => parts.some((p) => p.allergens.includes(a.id))).map((a) => a.id);
  /** A mark the whole cake carries only if every part does. @param {string} d */
  const all = (d) => parts.every((p) => hasDiet(p, d));
  return {
    stack, sizes, sponge, filling, finish, colour, toppings, message,
    price: round2(lines.reduce((s, l) => s + l.price, 0)),
    servings: sizes.reduce((s, z) => s + z.servings, 0),
    lines,
    allergens,
    diets: ["eggless", "vegan", "halal"].filter(all),
  };
}

/** @param {number} n */
const round2 = (n) => Math.round(n * 100) / 100;

/**
 * The earliest day a cake can be ready: today plus the shop's notice (a day more after the cut-off), on a day the shop
 * is open and hasn't marked full in its sheet. Null when nothing is free within maxDaysAhead.
 * @param {Pick<Cakes, "leadDays" | "cutoff" | "maxDaysAhead">} c
 * @param {{ date: string, minutes: number }} now the shop's wall clock
 * @param {import("../../../core/lib/hours.js").Hours} hours
 * @param {string[]} fullDays from the sheet
 * @returns {string|null} YYYY-MM-DD
 */
export function earliestDate(c, now, hours, fullDays) {
  const [h, m] = c.cutoff.split(":").map(Number);
  const start = c.leadDays + (now.minutes >= h * 60 + m ? 1 : 0);
  for (let i = start; i <= c.maxDaysAhead; i++) {
    const day = addDays(now.date, i);
    if (rangesFor(hours, day).ranges.length && !fullDays.includes(day)) return day;
  }
  return null;
}

/**
 * Can the cake be collected on this day? Explains why not, for the date picker.
 * @param {string} day @param {string|null} earliest @param {import("../../../core/lib/hours.js").Hours} hours @param {string[]} fullDays
 * @returns {string|null} the reason, or null if it's fine
 */
export function dayProblem(day, earliest, hours, fullDays) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "Pick a day";
  if (!earliest || day < earliest) return "That's sooner than we can make it";
  if (!rangesFor(hours, day).ranges.length) return "We're closed that day";
  if (fullDays.includes(day)) return "We're fully booked for cakes that day";
  return null;
}

/** "Saturday 7 November". @param {string} day */
export const longDay = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

/**
 * The WhatsApp request: the cake spelled out so the shop can price and confirm it without a single question back.
 * @param {ReturnType<typeof quote>} q @param {{ business: string, day: string|null, name: string, note: string, allergenNames: string[] }} o
 */
export function requestText(q, o) {
  const lines = [
    `Hi ${o.business}, I'd like to order a celebration cake.`,
    "",
    `Size: ${q.stack.label} (serves about ${q.servings})`,
    `Sponge: ${q.sponge.name}`,
    `Filling: ${q.filling.name}`,
    `Finish: ${q.finish.name}${q.colour ? `, ${q.colour.name}` : ""}`,
    ...(q.toppings.length ? [`On top: ${q.toppings.map((t) => t.name).join(", ")}`] : []),
    ...(q.message ? [`Message: "${q.message}"`] : []),
    `Price on your site: ${gbp(q.price)}`,
    ...(o.day ? [`Collection: ${longDay(o.day)}`] : []),
    ...(o.name.trim() ? [`Name: ${o.name.trim()}`] : []),
    ...(o.note.trim() ? [`Notes: ${o.note.trim()}`] : []),
    "",
    o.allergenNames.length ? `It contains: ${o.allergenNames.join(", ")}.` : "It lists no allergens.",
    "Please confirm the date, the price and any allergy questions.",
  ];
  return lines.join("\n");
}

/**
 * A reminder in the customer's calendar a year on, early enough to order again (lead time plus a week). All-day, so no
 * time zone can move it.
 * @param {{ day: string, occasion: string, business: string, leadDays: number, url: string, stamp: Date }} o
 */
export function reminderIcs(o) {
  const next = new Date(`${o.day}T12:00:00Z`);
  next.setUTCFullYear(next.getUTCFullYear() + 1);
  const remind = addDays(next.toISOString().slice(0, 10), -(o.leadDays + 7));
  const d = (/** @type {string} */ iso) => iso.replace(/-/g, "");
  const esc = (/** @type {string} */ s) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const utc = o.stamp.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sitefloor//Cakes//EN", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:cake-${d(o.day)}-${d(remind)}@sitefloor`, `DTSTAMP:${utc}`,
    `DTSTART;VALUE=DATE:${d(remind)}`, `DTEND;VALUE=DATE:${d(addDays(remind, 1))}`,
    `SUMMARY:${esc(`Order the cake for ${o.occasion || "the celebration"} from ${o.business}`)}`,
    `DESCRIPTION:${esc(`It's a year on ${new Date(`${next.toISOString().slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })}. ${o.business} needs ${o.leadDays} days' notice. ${o.url}`)}`,
    "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
}
