// @ts-check
/**
 * The arrival card: the arrival day as a calendar file, with the address, the concierge's hours and the arrival steps
 * in its notes. Door codes and key details never go on the web; the concierge sends those.
 */
/** @param {string} s */
const icsText = (s) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/**
 * @param {{ day: string, time: string, name: string, place: string, steps: string[], concierge: string, stamp: string }} o
 *   day YYYY-MM-DD, time HH:MM (local, written as a floating time), stamp UTC "YYYYMMDDTHHMMSSZ"
 * @returns {string}
 */
export function arrivalIcs(o) {
  const at = `${o.day.replace(/-/g, "")}T${o.time.replace(":", "")}00`;
  const note = [`Concierge: ${o.concierge}`, ...o.steps.map((s, i) => `${i + 1}. ${s}`)].join("\n");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Sitefloor//${icsText(o.name)} arrival//EN`, "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:arrival-${o.day}@${o.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, `DTSTAMP:${o.stamp}`,
    `DTSTART:${at}`, `SUMMARY:${icsText(`Arriving at ${o.name}`)}`, `LOCATION:${icsText(o.place)}`, `DESCRIPTION:${icsText(note)}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n") + "\r\n";
}
