// @ts-check
/**
 * The salon's gowns: the words the finder filters by, the filter itself, the shortlist kept in a link, and the
 * messages that go to the salon on WhatsApp. Gowns, houses and prices all come from the salon's site.json.
 */

/** The finder's vocabulary. A gown uses these ids; the site shows the labels. */
export const SILHOUETTES = { column: "Column", "a-line": "A-line", ballgown: "Ballgown", "fit-and-flare": "Fit and flare", sheath: "Sheath", "two-piece": "Two-piece" };
export const NECKLINES = { strapless: "Strapless", square: "Square", "v-neck": "V-neck", high: "High neck", bateau: "Bateau", scoop: "Scoop", "off-shoulder": "Off the shoulder", sweetheart: "Sweetheart" };
export const SLEEVES = { none: "Sleeveless", straps: "Straps", short: "Short sleeves", long: "Long sleeves" };

/** @typedef {{ id: string, name: string, house: string, silhouette: string, neckline: string, sleeve: string }} GownLite */
/** @typedef {{ silhouette?: string, neckline?: string, sleeve?: string, house?: string }} GownFilter */

/** Gowns matching every chosen filter (an empty choice matches all). @param {GownLite[]} gowns @param {GownFilter} f */
export function filterGowns(gowns, f) {
  return gowns.filter((g) => (!f.silhouette || g.silhouette === f.silhouette) && (!f.neckline || g.neckline === f.neckline)
    && (!f.sleeve || g.sleeve === f.sleeve) && (!f.house || g.house === f.house));
}

/** Only the choices that would still show at least one gown, so no filter leads to an empty page. @param {GownLite[]} gowns @param {GownFilter} f @param {keyof GownFilter} key */
export function liveChoices(gowns, f, key) {
  return new Set(filterGowns(gowns, { ...f, [key]: "" }).map((g) => g[key]));
}

/** The shortlist as a link fragment: "#shortlist=ottilie.iris". @param {string[]} ids */
export function shortlistHash(ids) {
  return ids.length ? `#shortlist=${ids.join(".")}` : "";
}

/** The shortlist from a link, keeping only gowns this salon has, once each, in order. @param {string} hash @param {string[]} known */
export function shortlistFromHash(hash, known) {
  const m = /^#?shortlist=([a-z0-9.-]{1,400})$/.exec(hash ?? "");
  if (!m) return [];
  return [...new Set(m[1].split("."))].filter((id) => known.includes(id));
}

/**
 * The first-appointment request, as the WhatsApp message.
 * @param {{ opening: string, wedding?: string, party: number, when?: string, houses?: string[], gowns?: string[], notes?: string }} o
 * wedding is already written out ("18 September 2027"); party counts the bride and her guests.
 */
export function appointmentText(o) {
  const lines = [o.opening, ""];
  lines.push(`Wedding: ${o.wedding || "date not set yet"}`);
  lines.push(`Coming: ${o.party === 1 ? "just me" : `me and ${o.party - 1} ${o.party === 2 ? "guest" : "guests"}`}`);
  if (o.when) lines.push(`Best for me: ${o.when}`);
  if (o.houses?.length) lines.push(`Designers I'd like to see: ${o.houses.join(", ")}`);
  if (o.gowns?.length) lines.push(`Gowns I'd like to try: ${o.gowns.join(", ")}`);
  if (o.notes) lines.push(`Also: ${o.notes}`);
  return lines.join("\n");
}

/** One gown, from the finder: "Could I try Ottilie (Studio Morrell)?" @param {string} opening @param {{ name: string, houseName: string }} g */
export function tryGownText(opening, g) {
  return `${opening}\n\nI'd like to try ${g.name} by ${g.houseName} at my appointment.`;
}

/** The shortlist sent to the salon, so the gowns are on the rail when the bride arrives. @param {string} opening @param {{ name: string, houseName: string }[]} gowns @param {string} [link] */
export function shortlistText(opening, gowns, link) {
  return [opening, "", "My shortlist:", ...gowns.map((g, i) => `${i + 1}. ${g.name}, ${g.houseName}`), ...(link ? ["", link] : [])].join("\n");
}
