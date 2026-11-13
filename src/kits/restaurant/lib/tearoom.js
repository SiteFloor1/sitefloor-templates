// @ts-check
/**
 * The tea room: afternoon tea per guest (the stand), the tea library, live music now and the sitting request.
 * Only the café's own menu marks, allergen chart, prices and music times are used; nothing is guessed, and a
 * request is never a booking (the café replies to confirm).
 */
import { canEat, reasons } from "./group.js";
import { sittingState } from "./sittings.js";
import { tableRequestText } from "./request.js";
import { dietName, allergenName } from "../../../core/lib/allergens.js";

/** @typedef {import("./group.js").Guest} Guest */
/** @typedef {import("./group.js").Dish} Dish */
/** @typedef {{ id: string, name: string, dishes: Dish[] }} Tier a menu section on the stand */
/** @typedef {{ id: string, name: string, price: number, note?: string }} Service e.g. afternoon tea, with champagne */
/** @typedef {{ id: string, name: string, kind: string, caffeine: string, origin?: string, notes?: string, steep?: { minutes: number, celsius: number } }} Tea */
/** @typedef {{ days: string[], from: string, to: string, who: string, what: string }} MusicSet */

/** Tea kinds, in the order the library shows them. */
export const TEA_KINDS = ["black", "green", "oolong", "white", "dark", "herbal"];
/** How much caffeine, as the café states it. */
export const CAFFEINE = ["none", "low", "medium", "high"];

/**
 * One guest's stand: for each tier, what they can have as served and what isn't for them (with why).
 * @param {Guest} guest @param {Tier[]} tiers
 * @returns {{ id: string, name: string, fits: Dish[], not: { dish: Dish, why: string[] }[] }[]}
 */
export function standFor(guest, tiers) {
  return tiers.map((t) => ({
    id: t.id,
    name: t.name,
    fits: t.dishes.filter((d) => canEat(guest, d)),
    not: t.dishes.filter((d) => !canEat(guest, d)).map((d) => ({ dish: d, why: reasons(guest, d) })),
  }));
}

/** A guest's needs in words: "vegan, no sesame", or "" for none. @param {Guest} g */
export function needsLine(g) {
  return [...g.diets.map((d) => dietName(d).toLowerCase()), ...g.avoid.map((a) => `no ${allergenName(a).toLowerCase()}`)].join(", ");
}

/**
 * What the stand says under one guest: everything fits, or how many pieces need a swap and who makes it.
 * @param {Guest} guest @param {Tier[]} tiers @param {boolean} swaps does the kitchen make swaps on request
 */
export function standNote(guest, tiers, swaps) {
  const missing = standFor(guest, tiers).reduce((n, t) => n + t.not.length, 0);
  if (!missing) return "Everything on the stand, as served.";
  const pieces = `${missing} piece${missing === 1 ? "" : "s"}`;
  return swaps ? `${pieces} made differently for you; we'll confirm when we reply.` : `${pieces} ${missing === 1 ? "isn't" : "aren't"} suitable; ask us what we can do.`;
}

/**
 * The library, filtered: by kind (or all) and, if asked, caffeine-free only.
 * @param {Tea[]} teas @param {{ kind?: string, caffeineFree?: boolean }} f
 */
export function teasFor(teas, f) {
  return teas.filter((t) => (!f.kind || t.kind === f.kind) && (!f.caffeineFree || t.caffeine === "none"))
    .sort((a, b) => TEA_KINDS.indexOf(a.kind) - TEA_KINDS.indexOf(b.kind));
}

/** Kinds the library actually has, in order. @param {Tea[]} teas */
export const teaKinds = (teas) => TEA_KINDS.filter((k) => teas.some((t) => t.kind === k));

/**
 * Live music: who is playing now, else the next set (up to a week away). Times are the café's own.
 * @param {MusicSet[]} sets @param {{ weekday: number, minutes: number }} now
 * @returns {{ playing: MusicSet|null, next: { set: MusicSet, inDays: number }|null }}
 */
export function musicNow(sets, now) {
  const s = sittingState(/** @type {any} */ (sets), now);
  return { playing: /** @type {MusicSet|null} */ (s.current), next: s.next ? { set: /** @type {MusicSet} */ (/** @type {unknown} */ (s.next.sitting)), inDays: s.next.inDays } : null };
}

/**
 * One guest in the request: "Guest 2: Afternoon tea with champagne · Darjeeling · vegan, no sesame".
 * @param {{ service: string, tea?: string } & Guest} g @param {number} i
 * @param {Service[]} services @param {Tea[]} teas
 */
function guestLine(g, i, services, teas) {
  const sv = services.find((s) => s.id === g.service);
  const tea = teas.find((t) => t.id === g.tea);
  return [`Guest ${i + 1}: ${sv?.name ?? g.service}`, tea ? tea.name : "", needsLine(g)].filter(Boolean).join(" · ");
}

/**
 * The total at menu prices, in pence (prices are pounds on the menu).
 * @param {{ service: string }[]} guests @param {Service[]} services
 */
export function teaTotal(guests, services) {
  return guests.reduce((p, g) => p + Math.round((services.find((s) => s.id === g.service)?.price ?? 0) * 100), 0);
}

/**
 * The WhatsApp request for a sitting: guests, each one's service, tea and needs, and the total at menu prices.
 * @param {{ opening: string, sitting: string, day: string, time: string, guests: ({ service: string, tea?: string } & Guest)[], services: Service[], teas: Tea[], swaps: boolean, notes?: string }} o
 */
export function teaRequestText(o) {
  const pounds = (p) => `£${(p / 100).toFixed(2).replace(/\.00$/, "")}`;
  const anyNeeds = o.guests.some((g) => g.diets.length || g.avoid.length);
  const lines = [
    ...o.guests.map((g, i) => guestLine(g, i, o.services, o.teas)),
    `${pounds(teaTotal(o.guests, o.services))} at menu prices`,
    anyNeeds ? (o.swaps ? "Please make the stand to suit each guest's needs above." : "Please tell us what you can do for each guest's needs above.") : "",
  ].filter(Boolean);
  return tableRequestText({ opening: o.opening, guests: o.guests.length, day: o.day, time: `${o.sitting}, ${o.time}`, preorder: lines.join("\n"), notes: o.notes });
}

/** How strong a tea drinks, as the café describes it; the sommelier's third question. */
export const STRENGTHS = ["light", "medium", "full"];
/** Occasions Your table can mark; each may carry a short inscription for the plate. */
export const OCCASIONS = [{ id: "birthday", name: "A birthday" }, { id: "anniversary", name: "An anniversary" }, { id: "celebration", name: "A celebration" }];
/** The longest inscription the pastry kitchen pipes on a plate. */
export const INSCRIPTION_MAX = 28;

/** @typedef {Tea & { strength?: string, milk?: boolean, pairs?: string }} LibraryTea */
/** @typedef {{ when: "morning"|"afternoon"|"evening", milk: boolean, strength: string }} Answers */

/** @param {LibraryTea} t @param {Answers} a */
function teaScore(t, a) {
  let s = 0;
  if (t.strength === a.strength) s += 3;
  else if (t.strength && Math.abs(STRENGTHS.indexOf(t.strength) - STRENGTHS.indexOf(a.strength)) === 1) s += 1;
  if (a.milk) s += t.milk ? 2 : -2;
  else if (!t.milk) s += 1;
  const caf = CAFFEINE.indexOf(t.caffeine);
  if (a.when === "evening") s += [3, 2, 0, -3][caf] ?? 0;
  if (a.when === "morning") s += [-1, 0, 1, 2][caf] ?? 0;
  return s;
}

/**
 * The tea sommelier: the library's best match for three answers (strength, milk or not, the time of day), and
 * the next best. Only the café's own descriptions are used; ties keep the library's order.
 * @param {LibraryTea[]} teas @param {Answers} a @returns {{ pick: LibraryTea|null, also: LibraryTea|null }}
 */
export function teaFor(teas, a) {
  const ranked = teas.map((t, i) => ({ t, i, s: teaScore(t, a) })).sort((x, y) => y.s - x.s || x.i - y.i);
  return { pick: ranked[0]?.t ?? null, also: ranked[1]?.t ?? null };
}

/**
 * Your table, in one line for the table request: how each guest takes tea, each guest's needs (by name when the place
 * card has one), the place cards, the champagne for the table, the occasion and the words for the plate. Shared with
 * the table request as its "group".
 * @param {({ service: string, name?: string } & Guest)[]} guests @param {Service[]} services
 * @param {{ occasion?: string, inscription?: string, champagne?: { name: string, price: number }|null }} [o]
 * @returns {{ count: number, summary: string }}
 */
export function standSummary(guests, services, o = {}) {
  /** @type {Map<string, number>} */ const by = new Map();
  for (const g of guests) by.set(g.service, (by.get(g.service) ?? 0) + 1);
  const svc = [...by].map(([id, n]) => `${services.find((s) => s.id === id)?.name ?? id} (${n})`).join(", ");
  const who = (/** @type {{ name?: string }} */ g, /** @type {number} */ i) => (g.name?.trim() ? `Guest ${i + 1} (${g.name.trim()})` : `Guest ${i + 1}`);
  const needs = guests.map((g, i) => (needsLine(g) ? `${who(g, i)}: ${needsLine(g)}` : "")).filter(Boolean);
  const cards = guests.some((g) => g.name?.trim()) ? `Place cards: ${guests.map((g, i) => g.name?.trim() || `Guest ${i + 1}`).join(", ")}.` : "";
  const fizz = o.champagne ? `For the table: ${o.champagne.name}, £${o.champagne.price.toFixed(2).replace(/\.00$/, "")}.` : "";
  const occ = OCCASIONS.find((x) => x.id === o.occasion);
  const words = (o.inscription ?? "").trim().slice(0, INSCRIPTION_MAX);
  return {
    count: guests.length,
    summary: [
      `${guests.length} guest${guests.length === 1 ? "" : "s"}: ${svc}.`,
      needs.length ? `${needs.join(". ")}.` : "",
      cards,
      fizz,
      occ ? `${occ.name}${words ? `; on the plate: “${words}”` : ""}.` : "",
    ].filter(Boolean).join(" "),
  };
}

/**
 * Give a sitting: the WhatsApp message that goes with the payment, so the café can write the card.
 * @param {{ opening: string, gift: { name: string, price: number }, to: string, from: string, note: string, paid: boolean }} o
 */
export function giftMessage(o) {
  return [
    o.opening,
    "",
    `${o.gift.name}, £${o.gift.price.toFixed(2).replace(/\.00$/, "")}`,
    o.to ? `For: ${o.to}` : "",
    o.from ? `From: ${o.from}` : "",
    o.note ? `On the card: “${o.note}”` : "",
    o.paid ? "I've paid by card online." : "How can I pay?",
  ].filter((l, i) => l !== "" || i === 1).join("\n").trim();
}

/** @typedef {{ id: string, name: string, from: string, to: string, price: number, text: string }} TeaSeason */

/**
 * The seasonal stand to show: the one being served on the day, else the next one coming; and the year's list in date
 * order. Dates are the café's own, as YYYY-MM-DD; a season runs from its first to its last day inclusive.
 * @param {TeaSeason[]} seasons @param {string} today YYYY-MM-DD
 * @returns {{ now: TeaSeason|null, next: TeaSeason|null, all: TeaSeason[] }}
 */
export function seasonFor(seasons, today) {
  const all = [...seasons].sort((a, b) => a.from.localeCompare(b.from));
  const now = all.find((s) => s.from <= today && today <= s.to) ?? null;
  const next = all.find((s) => s.from > today) ?? null;
  return { now, next, all };
}
