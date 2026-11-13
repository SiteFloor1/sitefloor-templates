// @ts-check
/**
 * The extension visualiser's arithmetic, shared by the page (read-out, price line, WhatsApp message) and the 3D model.
 * Every number it shows is either arithmetic on the visitor's own choices (depth, house type) or the builder's own
 * rates from site.json. Nothing here is a typical price: with no rates set there is no price at all.
 */

/**
 * House types the model can draw: the house's rear width in metres, the extension's width (a detached house gets a
 * part-width extension), which sides have a neighbour, and the words for each.
 */
export const HOUSES = {
  terrace: { label: "Terrace", said: "terraced house", width: 5.4, extWidth: 5.4, neighbours: /** @type {string[]} */ (["left", "right"]) },
  semi: { label: "Semi", said: "semi-detached house", width: 6.6, extWidth: 6.6, neighbours: /** @type {string[]} */ (["left"]) },
  detached: { label: "Detached", said: "detached house", width: 9.2, extWidth: 6.4, neighbours: /** @type {string[]} */ ([]) },
};

/** Roofs the model can draw. */
export const ROOFS = {
  lantern: { label: "Roof light", said: "a flat roof with a roof light" },
  glass: { label: "All glass", said: "an all-glass roof" },
};

/** The walls take 0.3 m each side, so the room inside is the outside width less 0.6 m. */
export const WALL = 0.3;

/** @typedef {keyof typeof HOUSES} House @typedef {keyof typeof ROOFS} Roof */
/** @typedef {{ min: number, max: number, step: number, start: number }} DepthRange */

/** The depth range a site may offer: between 2 and 8 metres, in steps of 0.25 or 0.5. */
export const DEPTH_LIMITS = { min: 2, max: 8 };

/** @param {number} n @param {number} places */
const round = (n, places) => Math.round(n * 10 ** places) / 10 ** places;

/** A depth the slider allows, snapped to its step. @param {number} d @param {DepthRange} range */
export function clampDepth(d, range) {
  if (!Number.isFinite(d)) return range.start;
  const snapped = range.min + Math.round((d - range.min) / range.step) * range.step;
  return round(Math.min(range.max, Math.max(range.min, snapped)), 2);
}

/**
 * The extension's outside size and the new room inside it, for the read-out.
 * @param {House} house @param {number} depth metres
 * @returns {{ depth: number, width: number, area: number }} area in m², whole metres, inside the walls
 */
export function extensionSize(house, depth) {
  const h = HOUSES[house] ?? HOUSES.terrace;
  const width = h.extWidth;
  return { depth: round(depth, 2), width, area: Math.round((width - 2 * WALL) * depth) };
}

/** "4.0 m deep · 5.4 m wide" and "about 19 m² of new room". @param {{ depth: number, width: number, area: number }} s */
export function readout(s) {
  return { size: `${s.depth.toFixed(1)} m deep · ${s.width.toFixed(1)} m wide`, room: `about ${s.area} m² of new room` };
}

/**
 * The builder's own rates, if they have given them: pounds per square metre of new room, a low and a high figure
 * for each roof. @typedef {{ perM2: Record<string, [number, number]>, vat: "included"|"excluded", checked: string }} Rates
 */

/**
 * A price range from the builder's rates for this size and roof, rounded out to the nearest £1,000; null when the
 * builder has given no rates (so nothing is shown) or none for this roof.
 * @param {Rates|undefined|null} rates @param {Roof} roof @param {number} area m²
 * @returns {{ from: number, to: number } | null}
 */
export function priceRange(rates, roof, area) {
  const r = rates?.perM2?.[roof];
  if (!r || !Number.isFinite(area) || area <= 0) return null;
  const [lo, hi] = r;
  return { from: Math.floor((lo * area) / 1000) * 1000, to: Math.ceil((hi * area) / 1000) * 1000 };
}

/** "£76,000 to £95,000, including VAT" @param {{ from: number, to: number }} range @param {"included"|"excluded"} vat */
export function priceWords(range, vat) {
  const f = (/** @type {number} */ n) => `£${n.toLocaleString("en-GB")}`;
  return `${f(range.from)} to ${f(range.to)}, ${vat === "included" ? "including" : "plus"} VAT`;
}

/**
 * The WhatsApp message a visitor sends with their design, in plain words the builder can act on.
 * @param {string} opening the builder's own first line, e.g. "Hello, I'd like to talk about an extension."
 * @param {{ house: House, depth: number, roof: Roof }} s
 */
export function designMessage(opening, s) {
  const h = HOUSES[s.house] ?? HOUSES.terrace;
  const size = extensionSize(s.house, s.depth);
  return `${opening}\n\nA ${h.said}, an extension about ${size.depth.toFixed(1)} m deep and ${size.width.toFixed(1)} m wide (about ${size.area} m² inside), with ${ROOFS[s.roof]?.said ?? ROOFS.lantern.said}.`;
}

/** The visualiser's starting state from site.json, with anything unknown replaced by the first option. @param {any} cfg */
export function startState(cfg) {
  const range = depthRange(cfg?.depth);
  const house = /** @type {House} */ (Object.hasOwn(HOUSES, cfg?.house) ? cfg.house : "terrace");
  const roof = /** @type {Roof} */ (Object.hasOwn(ROOFS, cfg?.roof) ? cfg.roof : "lantern");
  return { house, roof, depth: range.start, show: /** @type {"before"|"after"} */ ("after") };
}

/** @param {any} d @returns {DepthRange} */
export function depthRange(d) {
  const min = Number(d?.min ?? 3), max = Number(d?.max ?? 6), step = Number(d?.step ?? 0.5);
  return { min, max, step, start: clampDepth(Number(d?.start ?? min + step * 2), { min, max, step, start: min }) };
}
