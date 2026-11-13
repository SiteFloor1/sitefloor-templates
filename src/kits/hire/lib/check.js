// @ts-check
/**
 * The handover checklist: what the customer and the business saw at collection and at return (each panel marked or not,
 * the fuel or charge, the mileage), dated on the business's clock. Pure; the page keeps the record on the customer's
 * phone and sends it as text. Nothing here judges damage or decides a deposit: it records what was seen.
 */

/** Fuel or charge in eighths, as people say it. @param {number} eighths 0–8 */
export function fuelWords(eighths) {
  const n = Math.max(0, Math.min(8, Math.round(eighths)));
  return ["Empty", "1/8", "1/4", "3/8", "Half", "5/8", "3/4", "7/8", "Full"][n];
}

/**
 * @typedef {object} Side    one moment: collection or return
 * @property {string} at     when it was recorded, "YYYY-MM-DD HH:MM" on the business's clock
 * @property {number} fuel   eighths, 0–8
 * @property {string} miles  the odometer as read (digits only; "" if not read)
 * @property {Record<string, string>} marks  panel → what was seen ("" or missing = nothing)
 */

/** A clean odometer reading: digits only, up to 7. @param {string} s */
export const cleanMiles = (s) => String(s ?? "").replace(/\D/g, "").slice(0, 7);

/**
 * What changed between collection and return: new or changed marks, and the fuel and miles. Plain words, never a verdict.
 * @param {string[]} panels @param {Side} a collection @param {Side} b return
 * @returns {string[]}
 */
export function differences(panels, a, b) {
  /** @type {string[]} */ const out = [];
  for (const p of panels) {
    const was = (a.marks[p] ?? "").trim(); const now = (b.marks[p] ?? "").trim();
    if (now && now !== was) out.push(was ? `${p}: was "${was}", now "${now}"` : `${p}: new, "${now}"`);
  }
  if (b.fuel < a.fuel) out.push(`Fuel: ${fuelWords(a.fuel)} at collection, ${fuelWords(b.fuel)} at return`);
  const ma = Number(a.miles); const mb = Number(b.miles);
  if (a.miles && b.miles && mb >= ma) out.push(`Driven: ${(mb - ma).toLocaleString("en-GB")} miles`);
  return out;
}

/**
 * The record as text to save or send: dated, the reference, the car, each moment's fuel, miles and marks.
 * @param {object} o
 * @param {string} o.business
 * @param {string} o.ref
 * @param {string} o.car
 * @param {string[]} o.panels
 * @param {Side|null} o.collection
 * @param {Side|null} o.back
 */
export function recordText({ business, ref, car, panels, collection, back }) {
  /** @param {string} title @param {Side} s */
  const side = (title, s) => [
    `${title}, ${s.at}`,
    `Fuel or charge: ${fuelWords(s.fuel)}`,
    `Mileage: ${s.miles ? Number(s.miles).toLocaleString("en-GB") : "not read"}`,
    ...panels.map((p) => `${p}: ${(s.marks[p] ?? "").trim() || "nothing seen"}`),
  ];
  const lines = [`${business}: handover checklist`, `Reference: ${ref || "none"}`, `Car: ${car}`, ""];
  if (collection) lines.push(...side("At collection", collection), "");
  if (back) lines.push(...side("At return", back), "");
  if (collection && back) {
    const d = differences(panels, collection, back);
    lines.push("Changes since collection:", ...(d.length ? d.map((x) => `- ${x}`) : ["- none recorded"]), "");
  }
  lines.push("Recorded on the customer's phone. Photos of any marks are sent separately in the same chat.");
  return lines.join("\n");
}

/** Where a checklist is kept on this phone: one per reference and car. @param {string} ref @param {string} car */
export const storeKey = (ref, car) => `sf-check:${ref || "none"}:${car}`;
