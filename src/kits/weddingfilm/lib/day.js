// @ts-check
/**
 * The day planner: from a ceremony time and the day's light (lib/sun.js), the wedding day's filming timeline built
 * from the studio's own block lengths (site.json dayPlanner.blocks: minutes for getting ready, the ceremony, drinks,
 * the meal, speeches, and when the first dance and the coverage end). Nothing here invents a time: every block is the
 * studio's length, and the portraits are placed in the golden hour calculated for that date and place. If golden hour
 * falls before the ceremony ends (a late ceremony in winter), the portraits go in the drinks instead, and the plan says
 * so plainly. The ceremony is kept between 09:00 and 18:00; if the studio's own lengths still carry the day past
midnight, those times roll onto the next day (marked "after midnight", and on the next day in the calendar file).
 */
import { minutesOf, hhmmOf, portraitWindow, icsUtc, icsText } from "./sun.js";
import { addDays } from "../../../core/lib/hours.js";

/** The ceremony times the planner accepts. */
export const CEREMONY = /** @type {const} */ ({ earliest: "09:00", latest: "18:00" });

/** A ceremony time kept inside CEREMONY; anything unreadable is the latest. @param {string} hhmm */
export function clampCeremony(hhmm) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hhmm)) return CEREMONY.latest;
  return hhmmOf(Math.max(minutesOf(CEREMONY.earliest), Math.min(minutesOf(CEREMONY.latest), minutesOf(hhmm))));
}

/** @typedef {import("./sun.js").Light} Light */
/**
 * @typedef {object} Blocks the studio's own lengths, in minutes
 * @property {number} prep getting ready, filmed before the ceremony (ends 15 minutes before it, when guests arrive)
 * @property {number} ceremony
 * @property {number} drinks drinks and group photographs, straight after the ceremony
 * @property {number} meal the wedding breakfast
 * @property {number} speeches after the meal
 * @property {number} danceAfter minutes from the end of the speeches to the first dance
 * @property {number} after how long the studio stays after the first dance
 */
/**
 * @typedef {{ id: string, label: string, from: string, to: string, time: string, next?: boolean, note?: string, light?: boolean }} Moment
 * `next`: it starts after midnight, on the day after the wedding. `time` is what the couple read ("23:30–00:15",
 * "00:15, after midnight").
 */

/**
 * @param {string} ceremony "HH:MM" @param {Light} light @param {Blocks} b
 * @param {{ start: number, length: number }} portrait the studio's portrait window inside golden hour
 * @returns {{ moments: Moment[], hours: number, portraitNote: string }}
 */
export function dayPlan(ceremony, light, b, portrait) {
  const c = minutesOf(clampCeremony(ceremony));
  const at = (/** @type {number} */ n) => hhmmOf(((n % 1440) + 1440) % 1440);
  /** @param {string} id @param {string} label @param {number} a @param {number} z @param {string} [note] @returns {Moment} */
  const mk = (id, label, a, z, note) => ({ id, label, from: at(a), to: at(z), time: "", ...(a >= 1440 ? { next: true } : {}), ...(note ? { note } : {}) });
  const cEnd = c + b.ceremony, drinksEnd = cEnd + b.drinks, mealEnd = drinksEnd + b.meal, speechEnd = mealEnd + b.speeches;
  const dance = speechEnd + b.danceAfter, end = dance + 15 + b.after;
  /** @type {Moment[]} */
  const m = [
    mk("prep", "Getting ready", c - b.prep - 15, c - 15, "Details, dresses, letters, the last of the nerves."),
    mk("arrive", "Guests arrive", c - 15, c),
    mk("ceremony", "The ceremony", c, cEnd, "Vows recorded with small microphones."),
    mk("drinks", "Drinks and group photographs", cEnd, drinksEnd),
    mk("meal", "The wedding breakfast", drinksEnd, mealEnd),
    mk("speeches", "Speeches", mealEnd, speechEnd),
    mk("dance", "First dance", dance, dance + 15),
    mk("end", "We say goodbye", end, end),
  ];
  let portraitNote;
  let last = end;
  const w = portraitWindow(light, portrait.start, portrait.length);
  if (w && minutesOf(w.from) >= cEnd) {
    const during = m.find((x) => x.id !== "end" && !x.next && minutesOf(x.from) <= minutesOf(w.from) && minutesOf(w.from) < minutesOf(x.to));
    m.push({ id: "portraits", label: "Portraits in golden hour", from: w.from, to: w.to, time: "", light: true, note: during ? `${portraitLength(w)} away from your guests, during ${during.label.toLowerCase()}.` : `${portraitLength(w)}, just the two of you.` });
    portraitNote = `Golden hour starts at ${light.goldenFrom}, so your portraits are at ${w.from}.`;
    if (minutesOf(w.to) + 15 > end) { last = minutesOf(w.to) + 15; portraitNote += " We stay on for it."; }
  } else {
    const from = cEnd + 10, sunset = light.sunset ? minutesOf(light.sunset) : -1;
    const lit = sunset > from + 10;
    m.push({ ...mk("portraits", "Portraits", from, from + portrait.length), light: lit, note: lit ? `Straight after the ceremony, before the sun sets at ${light.sunset}.` : "After dark: we bring a small light and use the venue's own." });
    portraitNote = light.goldenFrom ? `Golden hour starts at ${light.goldenFrom}, before your ceremony ends, so we take your portraits straight after it.` : "There's no golden hour that evening, so we take your portraits straight after the ceremony.";
  }
  const goodbye = /** @type {Moment} */ (m.find((x) => x.id === "end"));
  Object.assign(goodbye, mk("end", "We say goodbye", last, last));
  if (light.sunset) m.push({ id: "sunset", label: `Sunset, ${light.sunset}`, from: light.sunset, to: light.sunset, time: "", light: true });
  const key = (/** @type {Moment} */ x) => minutesOf(x.from) + (x.next ? 1440 : 0);
  m.sort((a, z) => key(a) - key(z) || (a.id === "sunset" ? 1 : z.id === "sunset" ? -1 : 0));
  for (const x of m) x.time = (x.from === x.to ? x.from : `${x.from}–${x.to}`) + (x.next ? ", after midnight" : "");
  const hours = Math.round(((last - (c - b.prep - 15)) / 60) * 2) / 2;
  return { moments: m, hours, portraitNote };
}

/** @param {{ from: string, to: string }} w */
const portraitLength = (w) => `${minutesOf(w.to) - minutesOf(w.from)} minutes`;

/**
 * The plan as a WhatsApp message. @param {string} opening
 * @param {{ date: string, place: string, venue?: string, ceremony: string, moments: Moment[] }} o
 */
export function dayText(opening, o) {
  const lines = [opening.trim(), "", `Wedding: ${o.date}`, `Where: ${o.venue?.trim() ? `${o.venue.trim()}, ${o.place}` : o.place}`, `Ceremony: ${o.ceremony}`, "", ...o.moments.filter((x) => x.id !== "sunset").map((x) => `${x.time} ${x.label}`)];
  const sunset = o.moments.find((x) => x.id === "sunset");
  if (sunset) lines.push(sunset.label);
  return lines.join("\n");
}

/**
 * The plan as a calendar file: one event per moment (the sunset as a marker), at the place's own time, written in UTC.
 * @param {{ date: string, tz: string, place: string, studio: string, stamp: string, moments: Moment[] }} o
 */
export function dayIcs(o) {
  const slug = o.studio.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const ev = (/** @type {Moment} */ x) => {
    // A moment after midnight is on the next day; one that runs past midnight ends on the day after it starts.
    const day = x.next ? addDays(o.date, 1) : o.date, to = x.to === x.from ? hhmmOf(minutesOf(x.to) + 5) : x.to;
    const endDay = minutesOf(to) < minutesOf(x.from) ? addDays(day, 1) : day;
    return [
      "BEGIN:VEVENT", `UID:${x.id}-${o.date}@${slug}`, `DTSTAMP:${o.stamp}`, `DTSTART:${icsUtc(day, x.from, o.tz)}`,
      `DTEND:${icsUtc(endDay, to, o.tz)}`, `SUMMARY:${icsText(x.label)}`,
      ...(x.note ? [`DESCRIPTION:${icsText(x.note)}`] : []), `LOCATION:${icsText(o.place)}`, "END:VEVENT",
    ];
  };
  return ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Sitefloor//${icsText(o.studio)} day planner//EN`, "CALSCALE:GREGORIAN", ...o.moments.flatMap(ev), "END:VCALENDAR"].join("\r\n") + "\r\n";
}
