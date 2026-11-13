// @ts-check
/**
 * The client's rules, read back to a customer: the driver checker ("you can request this car if…", never a decision),
 * the delivery postcode checker (the client's own zones, by postcode district: no paid map service) and the airports.
 */

/**
 * @typedef {object} DriverAnswer
 * @property {boolean} fits    the answers fit every rule the client states for this car
 * @property {string[]} misses each rule the answers don't fit, in plain words
 */

/**
 * The customer's own answers against the car's rules. It only reads the client's numbers back: the business checks the
 * licence before any handover, so this is never an approval.
 * @param {{ minAge: number, licenceYears: number, maxPoints: number }} rule
 * @param {{ age: number, licenceYears: number, points: number }} a
 * @returns {DriverAnswer}
 */
export function checkDriver(rule, a) {
  /** @type {string[]} */ const misses = [];
  if (a.age < rule.minAge) misses.push(`Drivers need to be ${rule.minAge} or over.`);
  if (a.licenceYears < rule.licenceYears) misses.push(`Drivers need ${rule.licenceYears} ${rule.licenceYears === 1 ? "year" : "years"} with a full licence.`);
  if (a.points > rule.maxPoints) misses.push(rule.maxPoints === 0 ? "Drivers need a licence with no points." : `Drivers can have up to ${rule.maxPoints} points.`);
  return { fits: misses.length === 0, misses };
}

/** The rule as one line: "30 or over, five years' full licence, up to six points". @param {{ minAge: number, licenceYears: number, maxPoints: number }} r */
export function driverLine(r) {
  const n = (/** @type {number} */ x) => (x <= 10 ? ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][x] : String(x));
  const years = r.licenceYears === 1 ? "one year's" : `${n(r.licenceYears)} years'`;
  const pts = r.maxPoints === 0 ? "no points" : `up to ${n(r.maxPoints)} ${r.maxPoints === 1 ? "point" : "points"}`;
  return `${r.minAge} or over, ${years} full licence, ${pts}`;
}

/**
 * The outward part of a UK postcode ("SW11" from "sw11 4nq", "SW1A" from "SW1A 2AA"), or null if it doesn't read as one.
 * @param {string} text
 */
export function outward(text) {
  const s = String(text ?? "").toUpperCase().replace(/\s+/g, "");
  const m = /^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})?$/.exec(s);
  return m ? m[1] : null;
}

/**
 * Which of the client's zones a postcode is in. A zone lists postcode districts ("SW11") or whole areas ("SW") or a
 * district family ("SW1", which covers SW1A–SW1Y and SW1 itself, but not SW11): the most specific match wins.
 * @param {string} postcode
 * @param {{ name: string, fee: number, districts: string[] }[]} zones
 * @returns {{ ok: false, reason: "unreadable" } | { ok: true, zone: null, district: string } | { ok: true, zone: { name: string, fee: number }, district: string }}
 */
export function zoneFor(postcode, zones) {
  const district = outward(postcode);
  if (!district) return { ok: false, reason: "unreadable" };
  const area = /^[A-Z]+/.exec(district)?.[0] ?? "";
  const family = /^[A-Z]+\d+/.exec(district)?.[0] ?? "";
  /** @param {string} d */
  const score = (d) => (d === district ? 3 : d === family ? 2 : d === area ? 1 : 0);
  let best = null; let bestScore = 0;
  for (const z of zones) for (const d of z.districts) {
    const s = score(d.toUpperCase());
    if (s > bestScore) { best = z; bestScore = s; }
  }
  return best ? { ok: true, zone: { name: best.name, fee: best.fee }, district } : { ok: true, zone: null, district };
}
