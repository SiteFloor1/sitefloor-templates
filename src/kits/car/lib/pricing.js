// @ts-check
/**
 * Prices and times for a car studio, always from the studio's own `jobs` (one price and one time per
 * vehicle size). Nothing here guesses: a job that isn't priced for a vehicle is reported, not filled in.
 */
import { WINDOWS, WINDOW_NAMES, isLegal } from "./legality.js";

/** @typedef {{ id: string, name: string, prices: Record<string, number>, hours: Record<string, number>, note?: string }} Job */
/** @typedef {{ id: string, name: string, body: "hatch"|"saloon"|"suv"|"van", example?: string }} Vehicle */
/** @typedef {import("./legality.js").Shade} Shade */
/** @typedef {{ name: string, price: number, hours: number }} Line */

/** @param {Job[]} jobs @param {string} id @returns {Job} */
export function jobById(jobs, id) {
  const job = jobs.find((j) => j.id === id);
  if (!job) throw new Error(`unknown job "${id}"`);
  return job;
}

/**
 * One job on one vehicle.
 * @param {Job} job @param {string} vehicle vehicle id @param {string} [name] label for the line
 * @returns {Line}
 */
export function line(job, vehicle, name = job.name) {
  const price = job.prices[vehicle];
  const hours = job.hours[vehicle];
  if (typeof price !== "number" || typeof hours !== "number") throw new Error(`job "${job.id}" has no price or time for "${vehicle}"`);
  return { name, price, hours };
}

/** @param {Line[]} lines */
export const totals = (lines) => ({ price: lines.reduce((s, l) => s + l.price, 0), hours: lines.reduce((s, l) => s + l.hours, 0) });

/**
 * Hours as people say them: "45 min", "2 hours", "2½ hours", "3 working days" (studio days of 8 hours).
 * @param {number} h
 */
export function hoursText(h) {
  if (h <= 0) return "0 min";
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h > 16) return `${Math.round(h / 8)} working days`;
  const whole = Math.floor(h);
  const half = h - whole >= 0.25 && h - whole < 0.75;
  const n = half ? whole : Math.round(h);
  return `${n}${half ? "½" : ""} hour${n === 1 && !half ? "" : "s"}`;
}

/**
 * @typedef {object} Build what the visitor chose in the Showroom
 * @property {string} vehicle
 * @property {boolean} before1985
 * @property {Partial<Record<import("./legality.js").Window, string|null>>} tint shade id per window, or null for none
 * @property {{ colour: string, finish: string } | null} wrap
 * @property {string|null} wheels wheel colour id
 * @property {boolean} dechrome
 */

/**
 * Price and time for a Showroom build. Illegal front shades are kept out of the priced build and
 * listed in `refused`, because a studio can't legally fit them.
 * @param {Build} b
 * @param {{ jobs: Job[], tint: { shades: Shade[], jobs: Partial<Record<import("./legality.js").Window, string>> }, wrap: { colours: { id: string, name: string }[], finishes: { id: string, name: string, job: string }[] }, showroom: { wheels?: { job: string, colours: { id: string, name: string }[] }, dechrome?: string } }} cfg
 * @returns {{ lines: Line[], price: number, hours: number, refused: { window: string, shade: Shade }[], summary: string[] }}
 */
export function priceBuild(b, cfg) {
  /** @type {Line[]} */
  const lines = [];
  /** @type {{ window: string, shade: Shade }[]} */
  const refused = [];
  /** @type {string[]} */
  const summary = [];
  for (const w of WINDOWS) {
    const id = b.tint[w];
    const jobId = cfg.tint.jobs[w];
    if (!id || !jobId) continue;
    const shade = cfg.tint.shades.find((s) => s.id === id);
    if (!shade) throw new Error(`unknown shade "${id}"`);
    if (!isLegal(w, shade, b.before1985)) { refused.push({ window: WINDOW_NAMES[w], shade }); continue; }
    lines.push(line(jobById(cfg.jobs, jobId), b.vehicle, `${WINDOW_NAMES[w]} tint, ${shade.name}`));
    summary.push(`${WINDOW_NAMES[w]}: ${shade.name} tint`);
  }
  if (b.wrap) {
    const finish = cfg.wrap.finishes.find((f) => f.id === b.wrap?.finish);
    const colour = cfg.wrap.colours.find((c) => c.id === b.wrap?.colour);
    if (!finish || !colour) throw new Error("unknown wrap colour or finish");
    lines.push(line(jobById(cfg.jobs, finish.job), b.vehicle, `Full wrap, ${colour.name} ${finish.name.toLowerCase()}`));
    summary.push(`Wrap: ${colour.name}, ${finish.name.toLowerCase()}`);
  }
  if (b.wheels && cfg.showroom.wheels) {
    const colour = cfg.showroom.wheels.colours.find((c) => c.id === b.wheels);
    if (!colour) throw new Error(`unknown wheel colour "${b.wheels}"`);
    lines.push(line(jobById(cfg.jobs, cfg.showroom.wheels.job), b.vehicle, `Wheels in ${colour.name.toLowerCase()}`));
    summary.push(`Wheels: ${colour.name}`);
  }
  if (b.dechrome && cfg.showroom.dechrome) {
    lines.push(line(jobById(cfg.jobs, cfg.showroom.dechrome), b.vehicle));
    summary.push("De-chrome: yes");
  }
  return { lines, ...totals(lines), refused, summary };
}

/**
 * WhatsApp message for a build, from what the visitor chose. Prices are the studio's own.
 * @param {{ vehicle: Vehicle, make?: string, lines: Line[], price: number, hours: number, summary: string[] }} b
 */
export function buildMessage(b) {
  const car = [b.make?.trim(), b.vehicle.name.toLowerCase()].filter(Boolean).join(", ");
  return [
    `Hi, I built this in your Showroom for my car (${car}):`,
    ...b.summary.map((s) => `• ${s}`),
    `Website price: £${b.price}, about ${hoursText(b.hours)}.`,
    "Can you confirm and tell me your next free day?",
  ].join("\n");
}

/**
 * Cheapest way to cover the chosen PPF panels: the studio's packs where they cost less than the
 * panels one by one. A pack may also cover panels nobody asked for; it's still offered if cheaper.
 * @param {string[]} chosen panel ids
 * @param {{ panels: { id: string, name: string, job: string }[], packs?: { name: string, job: string, panels: string[] }[] }} p
 * @param {Job[]} jobs @param {string} vehicle
 * @returns {{ lines: (Line & { covers: string[] })[], price: number, hours: number, separately: number }}
 */
export function planProtection(chosen, p, jobs, vehicle) {
  const want = new Set(chosen);
  const single = (/** @type {string} */ id) => {
    const panel = p.panels.find((x) => x.id === id);
    if (!panel) throw new Error(`unknown panel "${id}"`);
    return { ...line(jobById(jobs, panel.job), vehicle, panel.name), covers: [id] };
  };
  const separately = [...want].reduce((s, id) => s + single(id).price, 0);
  const packs = (p.packs ?? []).filter((k) => k.panels.some((id) => want.has(id)));
  /** @type {{ lines: (Line & { covers: string[] })[], price: number, hours: number }} */
  let best = { lines: [...want].map(single), price: separately, hours: [...want].reduce((s, id) => s + single(id).hours, 0) };
  for (let mask = 1; mask < 1 << packs.length; mask++) {
    const picked = packs.filter((_, i) => mask & (1 << i));
    const covered = new Set(picked.flatMap((k) => k.panels));
    const lines = [
      ...picked.map((k) => ({ ...line(jobById(jobs, k.job), vehicle, k.name), covers: k.panels })),
      ...[...want].filter((id) => !covered.has(id)).map(single),
    ];
    const t = totals(lines);
    if (t.price < best.price) best = { lines, ...t };
  }
  return { ...best, separately };
}
