// @ts-check
/**
 * The skin clinic's logic with no DOM: the finder's card and message, the ritual builder's sum, the spa day gift,
 * the treatment rhythm (the clinic's own spacing and reminders as dated events), the patch-test date, and calendar
 * files. Every word, minute, price and interval is the clinic's own from site.json; nothing here invents one.
 * Dates are calendar days ("YYYY-MM-DD") handled in UTC.
 */
import { addDaysYmd, ukDate } from "../../../core/lib/diary.js";

/**
 * @typedef {{ id: string, name: string, minutes: number, price: number, line: string, afterwards?: string, patch?: string,
 *   evening?: string, rhythm?: { everyWeeks: number, reminders?: { id: string, afterDays: number, label: string, note?: string }[] } }} Item
 * @typedef {{ id: string, name: string, items: Item[] }} Category
 */

/** Every menu item, across categories. @param {{ categories: Category[] }} menu @returns {Item[]} */
export const allItems = (menu) => menu.categories.flatMap((c) => c.items);

/** One item by id. @param {{ categories: Category[] }} menu @param {string} id */
export const itemById = (menu, id) => allItems(menu).find((x) => x.id === id);

/** Minutes as the clinic says them: "45 minutes", "1 hour", "1 hour 30 minutes". @param {number} m */
export function minutesWords(m) {
  if (m < 60) return `${m} minutes`;
  const h = Math.floor(m / 60), r = m % 60;
  return `${h} ${h === 1 ? "hour" : "hours"}${r ? ` ${r} minutes` : ""}`;
}

/** "£95", "£1,250". @param {number} p */
export const pounds = (p) => `£${p.toLocaleString("en-GB")}`;

/**
 * Fills a message the clinic wrote: {name} (the clinic), {treatment}, {minutes}, {price}, {word}, {date}, {to}, {from}.
 * A placeholder with no value is left out, never written as "undefined".
 * @param {string} template @param {Record<string, string|number|undefined>} v
 */
export function fill(template, v) {
  return template.replace(/\{(\w+)\}/g, (_, k) => (v[k] === undefined || v[k] === "" ? "" : String(v[k]))).replace(/ {2,}/g, " ").replace(/ ([.,])/g, "$1").trim();
}

/**
 * The concern finder: the word the visitor tapped → the clinic's facial for it and the WhatsApp message.
 * Returns null when the word isn't mapped (the card then asks the visitor to message the clinic).
 * @param {{ categories: Category[] }} menu @param {{ words: { word: string, item: string }[], message: string }} finder
 * @param {string} word @param {string} clinic
 */
export function finderCard(menu, finder, word, clinic) {
  const w = finder.words.find((x) => x.word === word);
  const item = w ? itemById(menu, w.item) : undefined;
  if (!item) return null;
  return { item, message: fill(finder.message, { name: clinic, treatment: item.name, minutes: item.minutes, price: item.price, word }) };
}

/**
 * The ritual builder: a base treatment and the add-ons chosen, summed. Add-ons are taken in the clinic's order, so
 * the message reads the same whatever order they were tapped in.
 * @param {Item} base @param {{ id: string, name: string, minutes: number, price: number }[]} addOns @param {string[]} chosen
 */
export function ritualSum(base, addOns, chosen) {
  const picked = addOns.filter((a) => chosen.includes(a.id));
  return {
    picked,
    minutes: base.minutes + picked.reduce((n, a) => n + a.minutes, 0),
    price: base.price + picked.reduce((n, a) => n + a.price, 0),
  };
}

/** "the Hydrating facial with a scalp ritual and LED" @param {Item} base @param {{ name: string }[]} picked */
export function ritualWords(base, picked) {
  const names = picked.map((a) => a.name.charAt(0).toLowerCase() + a.name.slice(1));
  if (!names.length) return `the ${base.name}`;
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  return `the ${base.name} with ${list}`;
}

/**
 * A spa day as a gift: the clinic's day, who it's for and from, and the message to the clinic or the card's words.
 * @param {{ name: string, price: number, minutes: number }} day @param {{ to?: string, from?: string, note?: string }} card
 * @param {string} template the clinic's message @param {string} clinic
 */
export function giftMessage(day, card, template, clinic) {
  return fill(template, { name: clinic, treatment: day.name, price: day.price, minutes: day.minutes, to: card.to?.trim(), from: card.from?.trim() })
    + (card.note?.trim() ? `\n\nFor the card: "${card.note.trim()}"` : "");
}

/**
 * The treatment rhythm from one visit: the clinic's own reminders after it (each so many days on), then the next
 * visits at the clinic's spacing. All-day events.
 * @param {Item} item @param {string} visit YYYY-MM-DD @param {number} [visits] how many next visits to add (default 3)
 * @returns {{ id: string, date: string, title: string, note?: string }[]}
 */
export function rhythmEvents(item, visit, visits = 3) {
  const r = item.rhythm;
  if (!r) return [];
  const reminders = (r.reminders ?? []).map((x) => ({ id: `${item.id}-${x.id}`, date: addDaysYmd(visit, x.afterDays), title: x.label, ...(x.note ? { note: x.note } : {}) }));
  const next = Array.from({ length: visits }, (_, i) => ({ id: `${item.id}-next-${i + 1}`, date: addDaysYmd(visit, 7 * r.everyWeeks * (i + 1)), title: `${item.name}, next visit` }));
  return [...reminders, ...next].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** The day to have a patch test: the clinic's hours before the appointment, as a calendar day. @param {string} appointment YYYY-MM-DD @param {number} hoursBefore */
export const patchDay = (appointment, hoursBefore) => addDaysYmd(appointment, -Math.ceil(hoursBefore / 24));

/** "Sat 21 Nov" @param {string} ymd */
export const shortDay = (ymd) => {
  const [wd, d, m] = ukDate(ymd).split(" ");
  return `${wd.slice(0, 3)} ${d} ${m.slice(0, 3)}`;
};

/** "21 November 2026" (a re-export, so the kit's scripts import from one place). @param {string} ymd */
export const longDay = (ymd) => ukDate(ymd, false);

/** @param {string} s */
const icsText = (s) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/**
 * Calendar events as a file: all-day events, so no time zone can move them.
 * @param {{ events: { id: string, date: string, title: string, note?: string }[], clinic: string, place: string, stamp: string }} o stamp = UTC "YYYYMMDDTHHMMSSZ"
 */
export function dayEventsIcs(o) {
  const slug = o.clinic.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Sitefloor//${slug}//EN`, "CALSCALE:GREGORIAN"];
  for (const e of o.events) {
    lines.push("BEGIN:VEVENT", `UID:${e.id}-${e.date}@${slug}`, `DTSTAMP:${o.stamp}`, `DTSTART;VALUE=DATE:${e.date.replace(/-/g, "")}`,
      `DTEND;VALUE=DATE:${addDaysYmd(e.date, 1).replace(/-/g, "")}`, `SUMMARY:${icsText(e.title)}`,
      ...(e.note ? [`DESCRIPTION:${icsText(e.note)}`] : []), `LOCATION:${icsText(o.place)}`, "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
