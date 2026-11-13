// @ts-check
/**
 * One source of truth for prices. A price-list line can point at a service or
 * extra from the cut builder ({ "service": "skin" }), so its name and price come
 * from there and the two can never disagree. A car studio's line can point at a job
 * priced per vehicle ({ "job": "tint-rear" }) and shows its cheapest price as "from £…". Lines for things the builder
 * doesn't sell (bundles, concessions) are written out in full.
 */
import { gbp } from "./text.js";

/** @typedef {{ id: string, name: string, price: number, minutes?: number }} MenuItem */
/** @typedef {{ id: string, name: string, prices: Record<string, number>, hours: Record<string, number> }} Job priced per vehicle (car studios) */
/** @typedef {{ services?: MenuItem[], extras?: MenuItem[], jobs?: Job[] }} Menu */

/** Cheapest price of a job across the vehicles it's priced for. @param {Job} job */
export const fromPrice = (job) => Math.min(...Object.values(job.prices));

/**
 * @param {any} item a priceList line @param {Menu} menu
 * @returns {{ name: string, price: string, note?: string, minutes?: number }}
 */
export function resolvePriceItem(item, menu) {
  if (item.job !== undefined) {
    const job = menu.jobs?.find((j) => j.id === item.job);
    if (!job) throw new Error(`price list refers to unknown job "${item.job}"`);
    return { name: item.name ?? job.name, price: `from ${gbp(fromPrice(job))}`, note: item.note };
  }
  const ref = item.service ?? item.extra;
  if (ref === undefined) return { name: item.name, price: item.price, note: item.note };
  const found = (item.service ? menu.services : menu.extras)?.find((m) => m.id === ref);
  if (!found) throw new Error(`price list refers to unknown ${item.service ? "service" : "extra"} "${ref}"`);
  return { name: item.name ?? found.name, price: gbp(found.price), note: item.note, minutes: found.minutes };
}

/** A line written out in full: its name and price as shown. @param {any} it @param {string} p @param {Map<string, string>} builderNames @param {(path: string, msg: string) => void} err */
function checkWrittenLine(it, p, builderNames, err) {
  if (typeof it?.name !== "string" || !it.name.trim()) err(`${p}.name`, "required text is missing");
  if (typeof it?.price !== "string" || !/^(from )?£\d+(\.\d{2})?$/i.test(it.price.trim())) err(`${p}.price`, 'shown as written, e.g. "£14" or "from £30"');
  const twin = builderNames.get(String(it?.name ?? "").trim().toLowerCase());
  if (twin) err(p, `"${it.name}" is also in the cut builder; write { "${twin}" } so the two prices can't disagree`);
}

/**
 * A list from site.json, or none. A malformed one (an object, say) is reported by checkMenu and the kit's checks;
 * here it counts as empty, so a wrong shape gives a clear error instead of crashing the build.
 * @param {unknown} v @returns {any[]}
 */
const listOf = (v) => (Array.isArray(v) ? v : []);

/** @param {any} site @param {string} id @param {string} p @param {(path: string, msg: string) => void} err */
function checkJobLine(site, id, p, err) {
  if (!listOf(site.jobs).some((/** @type {any} */ j) => j?.id === id)) err(p, `refers to job "${id}", which doesn't exist`);
}

/**
 * @param {any} site @param {(path: string, msg: string) => void} err
 */
export function checkPriceList(site, err) {
  const groups = site.priceList;
  if (groups === undefined) return;
  if (!Array.isArray(groups) || !groups.length) { err("priceList", "a list of groups"); return; }
  /** @type {Map<string, string>} name → "service"/"extra" from the builder */
  const builderNames = new Map();
  for (const key of ["services", "extras"]) for (const m of listOf(site[key])) builderNames.set(String(m?.name).trim().toLowerCase(), `${key === "services" ? "service" : "extra"}": "${m?.id}`);
  groups.forEach((/** @type {any} */ g, /** @type {number} */ gi) => {
    if (typeof g?.group !== "string" || !g.group.trim()) err(`priceList[${gi}].group`, "group heading is missing");
    if (!Array.isArray(g?.items) || !g.items.length) { err(`priceList[${gi}].items`, "at least one line"); return; }
    g.items.forEach((/** @type {any} */ it, /** @type {number} */ i) => {
      const p = `priceList[${gi}].items[${i}]`;
      if (it?.job !== undefined) { checkJobLine(site, it.job, p, err); return; }
      if (it?.service !== undefined || it?.extra !== undefined) {
        const list = it.service !== undefined ? site.services : site.extras;
        const ref = it.service ?? it.extra;
        if (!listOf(list).some((/** @type {any} */ m) => m?.id === ref)) err(p, `refers to ${it.service !== undefined ? "service" : "extra"} "${ref}", which doesn't exist`);
        return;
      }
      checkWrittenLine(it, p, builderNames, err);
    });
  });
}
