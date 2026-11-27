// @ts-check
/** Events kit additions to the shared Eleventy setup: the home sections, the visuals, dates and the room drawn. */
import { HOME_PARTS } from "./home.js";
import { LAYOUTS, drawRoom, roomWords, longDate, roomSvg, planBox } from "./lib/events.js";

/** @param {any} eleventyConfig */
export default function eventsKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addGlobalData("evLayouts", Object.entries(LAYOUTS).map(([id, label]) => ({ id, label })));
  eleventyConfig.addFilter("evSet", (/** @type {any} */ V, /** @type {string} */ id) => (V?.sets ?? []).find((/** @type {any} */ s) => s.id === id));
  eleventyConfig.addFilter("evRoomsOf", (/** @type {any[]} */ rooms, /** @type {string} */ occasion) => (rooms ?? []).filter((r) => r.occasion === occasion));
  eleventyConfig.addFilter("evLongDate", (/** @type {string} */ ymd) => longDate(ymd));
  eleventyConfig.addFilter("evAsk", (/** @type {any} */ r, /** @type {string} */ name) => `Hello ${name}, we'd like to talk about a room like "${r.name}" (${r.guests} guests).`);
  // The room drawn on first paint, as the agency's starting room, number and layout; the browser redraws it.
  eleventyConfig.addFilter("evDraw", (/** @type {any} */ P) => {
    const s = P.start ?? { room: P.rooms[0].id, guests: 120, layout: "long" };
    const room = P.rooms.find((/** @type {any} */ r) => r.id === s.room) ?? P.rooms[0];
    const plan = drawRoom(room, s.guests, s.layout);
    return { room, plan, words: roomWords(plan, room.name), svg: roomSvg(plan), box: planBox(plan), start: s };
  });
  eleventyConfig.addFilter("evVenueAreas", (/** @type {any[]} */ items) => {
    /** @type {{ area: string, items: any[] }[]} */ const out = [];
    for (const v of items ?? []) { let g = out.find((x) => x.area === v.area); if (!g) out.push(g = { area: v.area, items: [] }); g.items.push(v); }
    return out;
  });
}
