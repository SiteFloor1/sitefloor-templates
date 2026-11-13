// @ts-check
/**
 * Every figure the electrician kit shows a visitor is worked out here, only from the client's own prices in site.json.
 * Nothing is guessed: a missing price means "price on visit", never a made-up number. All amounts are whole pounds.
 *
 *  - lightingQuote: the room lighting designer (a room, its size, the layers of light chosen, one keypad).
 *  - estimateRange: the whole-house estimate, a low–high range from the client's bands per bedroom.
 *  - evCheck: the EV charger suitability answers, against the client's own standard install.
 *  - cablePrice: the charger's cable run beyond what the standard install includes.
 *  - houseQuote: the 3D house, the fittings in the rooms the visitor has lit.
 */

/** @param {number} n */
export const pounds = (n) => `£${Math.round(n).toLocaleString("en-GB")}`;

/**
 * @typedef {{ id: string, name: string, about: string, price: number, per: Record<string, number> }} Layer
 * @typedef {{ id: string, name: string, sizes: string[] }} DesignerRoom
 * @typedef {{ message: string, sizes: { id: string, label: string }[], rooms: DesignerRoom[], layers: Layer[], control: { name: string, price: number } }} Designer
 */

/**
 * The room lighting designer: how many of each fitting the client fits in a room of that size, at its price each,
 * and one scene keypad when more than one layer is chosen (two layers are what make scenes worth having).
 * @param {Designer} d @param {string} size a size id @param {string[]} layerIds
 * @returns {{ lines: { name: string, count: number, each: number, total: number }[], total: number }}
 */
export function lightingQuote(d, size, layerIds) {
  const lines = d.layers
    .filter((l) => layerIds.includes(l.id) && (l.per[size] ?? 0) > 0)
    .map((l) => ({ name: l.name, count: l.per[size], each: l.price, total: l.per[size] * l.price }));
  if (lines.length > 1) lines.push({ name: d.control.name, count: 1, each: d.control.price, total: d.control.price });
  return { lines, total: lines.reduce((s, x) => s + x.total, 0) };
}

/**
 * @typedef {{ id: string, name: string, base: { min: number, max: number }, perBedroom: { min: number, max: number } }} Work
 * @typedef {{ message: string, bedroomsMax: number, homes: { id: string, label: string, factor: number }[], works: Work[] }} Estimate
 */

/**
 * The whole-house estimate: for each chosen kind of work, the client's base band plus its band per bedroom, times the
 * client's factor for that kind of home (a flat is quicker to wire than a detached house). Rounded out to £50 so it
 * never reads more exact than it is.
 * @param {Estimate} e @param {string} homeId @param {number} bedrooms @param {string[]} workIds
 * @returns {{ min: number, max: number, lines: { name: string, min: number, max: number }[] } | null} null when nothing is chosen
 */
export function estimateRange(e, homeId, bedrooms, workIds) {
  const home = e.homes.find((h) => h.id === homeId);
  const works = e.works.filter((w) => workIds.includes(w.id));
  if (!home || !works.length || !(bedrooms >= 1)) return null;
  const beds = Math.min(Math.round(bedrooms), e.bedroomsMax);
  const down = (/** @type {number} */ n) => Math.floor(n / 50) * 50, up = (/** @type {number} */ n) => Math.ceil(n / 50) * 50;
  const lines = works.map((w) => ({
    name: w.name,
    min: down((w.base.min + w.perBedroom.min * beds) * home.factor),
    max: up((w.base.max + w.perBedroom.max * beds) * home.factor),
  }));
  return { lines, min: lines.reduce((s, l) => s + l.min, 0), max: lines.reduce((s, l) => s + l.max, 0) };
}

/**
 * @typedef {{ message: string, standard: { price: number, includedMetres: number, what: string }, perMetre: number, maxMetres: number, minFuse: number, grantUrl?: string }} Ev
 * @typedef {{ parking: "drive" | "street" | "shared", metres: number, fuse: number | 0, loads: number }} EvAnswers fuse 0 = don't know; loads = big loads already on (heat pump, electric shower, another charger)
 * @typedef {{ verdict: "standard" | "survey" | "no", reasons: string[], price: number | null, extraMetres: number }} EvResult
 */

/**
 * The cable run beyond what the standard install includes, at the client's price per metre.
 * @param {Ev} ev @param {number} metres @returns {{ extraMetres: number, price: number }}
 */
export function cablePrice(ev, metres) {
  const extraMetres = Math.max(0, Math.ceil(metres - ev.standard.includedMetres));
  return { extraMetres, price: ev.standard.price + extraMetres * ev.perMetre };
}

/**
 * Will a charger go in easily? Only the client's own rules: off-street parking, the cable run it includes and the
 * longest it will run, the main fuse it needs, and whether the supply already carries big loads. Anything uncertain
 * is "survey", never "yes".
 * @param {Ev} ev @param {EvAnswers} a @returns {EvResult}
 */
export function evCheck(ev, a) {
  if (a.parking !== "drive") {
    return { verdict: "no", reasons: [a.parking === "shared" ? "A shared car park needs the owner's or the management company's permission first; we can help you ask." : "We fit home chargers where there's off-street parking. For on-street charging, ask your council about kerbside chargers or cable channels."], price: null, extraMetres: 0 };
  }
  /** @type {string[]} */ const reasons = [];
  if (a.metres > ev.maxMetres) reasons.push(`A run over ${ev.maxMetres} metres needs a look at the route first.`);
  if (a.fuse === 0) reasons.push("We'll check the size of your main fuse when we visit: it's printed on the fuse carrier by the meter.");
  else if (a.fuse < ev.minFuse) reasons.push(`A ${a.fuse}A main fuse may need upgrading by your network operator before a charger goes in. We arrange that.`);
  if (a.loads > 0) reasons.push("With a heat pump, an electric shower or another charger already on, we'll fit load management so the supply isn't overloaded.");
  const { extraMetres, price } = cablePrice(ev, Math.min(a.metres, ev.maxMetres));
  return { verdict: reasons.length ? "survey" : "standard", reasons, price: a.metres > ev.maxMetres ? null : price, extraMetres };
}

/**
 * @typedef {{ id: string, name: string, price: number }} FittingType
 * @typedef {{ id: string, name: string, fittings: Record<string, number> }} HouseRoom
 */

/**
 * The house in 3D: the fittings in every room the visitor has switched on, at the client's price each.
 * @param {FittingType[]} types @param {HouseRoom[]} rooms @param {string[]} litRoomIds
 * @returns {{ lines: { name: string, count: number, total: number }[], total: number }}
 */
export function houseQuote(types, rooms, litRoomIds) {
  /** @type {Map<string, number>} */ const counts = new Map();
  for (const r of rooms.filter((x) => litRoomIds.includes(x.id))) {
    for (const [type, n] of Object.entries(r.fittings)) counts.set(type, (counts.get(type) ?? 0) + n);
  }
  const lines = types.filter((t) => counts.get(t.id)).map((t) => ({ name: t.name, count: /** @type {number} */ (counts.get(t.id)), total: /** @type {number} */ (counts.get(t.id)) * t.price }));
  return { lines, total: lines.reduce((s, l) => s + l.total, 0) };
}

/** A quote's lines as plain text for a WhatsApp message. @param {{ name: string, count: number, total: number }[]} lines */
export function quoteText(lines) {
  return lines.map((l) => `${l.count} × ${l.name}: ${pounds(l.total)}`).join("\n");
}
