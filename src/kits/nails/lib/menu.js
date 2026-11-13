// @ts-check
/**
 * The menu by the hour and "Build your set". Every price and time is the salon's own (site.json); this only adds
 * them up and words them. Prices are whole pounds; times are minutes.
 */

export const SHAPES = /** @type {const} */ ({ almond: "Almond", oval: "Oval", squoval: "Squoval", square: "Square", coffin: "Coffin", stiletto: "Stiletto", round: "Round" });
export const LENGTHS = /** @type {const} */ ({ short: "Short", medium: "Medium", long: "Long" });

/** "30 minutes", "1 hour", "1 h 45". @param {number} m */
export function timeWords(m) {
  if (m < 60) return `${m} minutes`;
  const h = Math.floor(m / 60), r = m % 60;
  if (!r) return h === 1 ? "1 hour" : `${h} hours`;
  return `${h} h ${String(r).padStart(2, "0")}`;
}

/** "£48", "from £78". @param {number} n @param {boolean} [from] */
export function price(n, from = false) {
  return `${from ? "from " : ""}£${n.toLocaleString("en-GB")}`;
}

/** The bands in the order a visitor reads them: shortest first. @param {{ minutes: number }[]} bands */
export function byMinutes(bands) {
  return [...bands].sort((a, b) => a.minutes - b.minutes);
}

/**
 * @typedef {{ id: string, name: string, minutes: number, price: number }} SystemChoice
 * @typedef {{ length: keyof typeof LENGTHS, addMinutes: number, addPrice: number }} LengthChoice
 * @typedef {{ id: string, name: string, addMinutes: number, addPrice: number }} FinishChoice
 * @typedef {{ level: string, name: string, addMinutes: number, addPrice: number }} ArtChoice
 * @typedef {{ systems: SystemChoice[], lengths: LengthChoice[], finishes: FinishChoice[], art: ArtChoice[] }} BuildConfig
 * @typedef {{ system: string, shape: string, length: string, finish: string, art: string, shade?: string }} Pick
 */

/**
 * A set's time and price from the salon's figures. `art` "" means no art. Unknown ids throw: the form only offers
 * what the config has.
 * @param {BuildConfig} cfg @param {Pick} pick @returns {{ minutes: number, price: number }}
 */
export function setTotal(cfg, pick) {
  const sys = cfg.systems.find((s) => s.id === pick.system);
  const len = cfg.lengths.find((l) => l.length === pick.length);
  const fin = cfg.finishes.find((f) => f.id === pick.finish);
  const art = pick.art ? cfg.art.find((a) => a.level === pick.art) : { addMinutes: 0, addPrice: 0 };
  if (!sys || !len || !fin || !art) throw new Error("build your set: a choice isn't in the salon's list");
  return { minutes: sys.minutes + len.addMinutes + fin.addMinutes + art.addMinutes, price: sys.price + len.addPrice + fin.addPrice + art.addPrice };
}

/**
 * The WhatsApp message for a built set, every choice in words the salon reads at a glance.
 * @param {string} opening @param {BuildConfig} cfg @param {Pick} pick @param {string} [shadeName] "Petal (No. 14)"
 */
export function setText(opening, cfg, pick, shadeName = "") {
  const t = setTotal(cfg, pick);
  const sys = cfg.systems.find((s) => s.id === pick.system)?.name ?? "";
  const fin = cfg.finishes.find((f) => f.id === pick.finish)?.name ?? "";
  const art = pick.art ? cfg.art.find((a) => a.level === pick.art)?.name ?? "" : "";
  const shape = /** @type {Record<string, string>} */ (SHAPES)[pick.shape] ?? pick.shape;
  const len = /** @type {Record<string, string>} */ (LENGTHS)[pick.length] ?? pick.length;
  const parts = [sys, `${shape.toLowerCase()}, ${len.toLowerCase()}`, fin, shadeName, art].filter(Boolean);
  return `${opening} I'd like to book: ${parts.join(", ")}. About ${timeWords(t.minutes)}, ${price(t.price)} on your menu.`;
}
