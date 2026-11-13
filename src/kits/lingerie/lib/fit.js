// @ts-check
/**
 * Fit: the shop's size range as a grid, the private fitting request, "Tell us about her", and the fit passport (her
 * sizes behind a private code, read from the shop's sheet). The site never works out anyone's size: sizes come from
 * the shop's fitters, and the guide only says what the shop stocks.
 */

/** @typedef {{ bands: number[], cups: string[], stock: { bands: [number, number], cups: [string, string] }, order?: { bands: [number, number], cups: [string, string] } }} SizeRange */

/**
 * Each band × cup as "stock" (on the shelf), "order" (the shop orders it in) or "" (not made).
 * @param {SizeRange} r @returns {{ band: number, cells: { cup: string, kind: "stock"|"order"|"" }[] }[]}
 */
export function sizeGrid(r) {
  const within = (/** @type {number} */ band, /** @type {string} */ cup, /** @type {{ bands: [number, number], cups: [string, string] }} */ span) => {
    const ci = r.cups.indexOf(cup);
    return band >= span.bands[0] && band <= span.bands[1] && ci >= r.cups.indexOf(span.cups[0]) && ci <= r.cups.indexOf(span.cups[1]);
  };
  return r.bands.map((band) => ({
    band,
    cells: r.cups.map((cup) => ({ cup, kind: within(band, cup, r.stock) ? "stock" : r.order && within(band, cup, r.order) ? "order" : "" })),
  }));
}

/** @param {unknown} s */
const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

/**
 * The private fitting request on WhatsApp. `tray` is up to three pieces she'd like ready.
 * @param {{ business: string, kind: string, day: string, time: string, guests: number, name: string, tray: string[], video?: boolean }} o
 */
export function fittingText(o) {
  const who = o.guests > 0 ? ` I'll bring ${o.guests === 1 ? "one guest" : `${o.guests} guests`}.` : "";
  return [
    `Hello ${o.business}, I'd like to book ${o.video ? "a video fitting" : "a private fitting"}${o.kind ? ` (${clean(o.kind)})` : ""}.`,
    `${[clean(o.day), clean(o.time)].filter(Boolean).join(", ") || "Whenever suits you"}.${who}`,
    ...(o.tray.length ? ["Could you have these ready?", ...o.tray.slice(0, 3).map((n, i) => `${i + 1}. ${n}`)] : []),
    o.name ? `${clean(o.name)}` : "",
  ].filter(Boolean).join("\n");
}

/**
 * "Tell us about her": what he knows, sent as one message; the shop sets pieces aside and replies.
 * @param {{ business: string, size: string, wears: string, budget: string, occasion: string, wrap: boolean, card: string, name: string }} o
 */
export function herText(o) {
  return [
    `Hello ${o.business}, I'd like something for her.`,
    `Her size: ${clean(o.size) || "I don't know"}.`,
    `She wears: ${clean(o.wears) || "I'm not sure"}.`,
    `Budget: ${clean(o.budget) || "open"}.`,
    o.occasion ? `It's for: ${clean(o.occasion)}.` : "",
    o.wrap ? "Please wrap it." : "",
    o.card ? `For the card: "${clean(o.card)}"` : "",
    o.name ? `${clean(o.name)}` : "",
  ].filter(Boolean).join("\n");
}

/** A fit passport code: 8 letters or digits, no 0/O/1/I so it reads cleanly aloud. @param {unknown} v */
export function isPassportCode(v) {
  return typeof v === "string" && /^[A-HJ-NP-Z2-9]{8}$/.test(v);
}

/** @param {string} raw */
export function normaliseCode(raw) {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * The passport rows for one code from the shop's sheet (header row: code, shape, size, updated_at). Only the
 * fitter's own rows; a code with no rows gives nothing.
 * @param {string[][]} rows parsed CSV including the header @param {string} code
 * @returns {{ sizes: { shape: string, size: string }[], updated: string } | null}
 */
export function passportFor(rows, code) {
  if (!rows.length) return null;
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const at = (/** @type {string} */ k) => head.indexOf(k);
  const [c, s, z, u] = [at("code"), at("shape"), at("size"), at("updated_at")];
  if (c < 0 || s < 0 || z < 0) return null;
  const mine = rows.slice(1).filter((r) => normaliseCode(r[c] ?? "") === code && clean(r[s]) && clean(r[z]));
  if (!mine.length) return null;
  const updated = u < 0 ? "" : mine.map((r) => clean(r[u])).sort().at(-1) ?? "";
  return { sizes: mine.map((r) => ({ shape: clean(r[s]), size: clean(r[z]) })), updated };
}

/**
 * "Buy in her size": a partner holding her passport asks the shop for pieces in those sizes. The code goes with it so
 * the fitter can check; her sizes are already on the shop's own sheet.
 * @param {{ business: string, code: string, budget: string, name: string }} o
 */
export function passportText(o) {
  return [
    `Hello ${o.business}, I'm buying for someone with one of your fit passports.`,
    `Passport: ${o.code}.`,
    o.budget ? `Budget: ${clean(o.budget)}.` : "",
    "Could you suggest something in her sizes?",
    o.name ? clean(o.name) : "",
  ].filter(Boolean).join("\n");
}
