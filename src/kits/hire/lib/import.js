// @ts-check
/**
 * The client's fleet Sheet (one row per car) to site.json's `fleet.cars`. Pure: the tool (tools/import-fleet.js) reads
 * the CSV and the photo sizes, this turns rows into cars, and the kit's validator (kits/hire/config.js) then refuses
 * anything missing. A cell the client leaves empty stays out of the car; it is never filled with a default.
 */
import { parseCsv } from "../../../core/lib/sheet.js";

/** Every column the Sheet may have, so a misspelt header is reported instead of silently ignored. */
export const COLUMNS = [
  "id", "make", "model", "trim", "year", "class", "seats", "doors", "boot", "gearbox", "fuel", "power_bhp", "zero_62",
  "interior", "colours", "photo", "photo_small", "photo_square", "photo_alt", "gallery", "gallery_alt", "arrival_photo",
  "arrival_alt", "day", "weekend", "week", "month", "deposit", "pay_link", "min_age", "licence_years", "max_points",
  "miles_per_day", "extra_mile", "insurance", "excess", "excess_reduction", "reduction_price", "reduction_per",
  "reduction_to", "fuel_policy", "late_return", "delivery", "chauffeur_only", "hourly", "min_hours", "tuned_mods",
  "tuned_insurance", "tuned_driver", "lead", "first_ten",
];

/** @typedef {(file: string) => { width: number, height: number } | null} SizeOf */

/**
 * @param {string} csv the Sheet published as CSV
 * @param {SizeOf} sizeOf a photo's size in pixels (null if the file is missing)
 * @returns {{ cars: any[], errors: string[] }}
 */
export function carsFromCsv(csv, sizeOf) {
  const rows = parseCsv(csv);
  const head = (rows.shift() ?? []).map((h) => h.trim().toLowerCase());
  /** @type {string[]} */ const errors = [];
  for (const h of head) if (h && !COLUMNS.includes(h)) errors.push(`column "${h}" isn't one we know; check the spelling (known: ${COLUMNS.join(", ")})`);
  for (const k of ["id", "make", "model", "year", "class", "photo", "photo_alt"]) if (!head.includes(k)) errors.push(`column "${k}" is missing`);
  if (errors.length) return { cars: [], errors };

  const cars = rows.map((r, i) => {
    const line = i + 2;
    /** @param {string} k */
    const cell = (k) => { const j = head.indexOf(k); return j < 0 ? "" : (r[j] ?? "").trim(); };
    /** A number cell; empty stays undefined; anything else that isn't a number is an error. @param {string} k */
    const num = (k) => {
      const v = cell(k).replace(/[£,\s]/g, "").replace(/(bhp|hp|s|miles?)$/i, "");
      if (v === "") return undefined;
      const n = Number(v);
      if (!Number.isFinite(n)) { errors.push(`row ${line} (${cell("id") || "no id"}): "${k}" should be a number, got "${cell(k)}"`); return undefined; }
      return n;
    };
    /** yes/no; empty stays undefined. @param {string} k */
    const yes = (k) => {
      const v = cell(k).toLowerCase();
      if (v === "") return undefined;
      if (["yes", "y", "true", "1"].includes(v)) return true;
      if (["no", "n", "false", "0"].includes(v)) return false;
      errors.push(`row ${line} (${cell("id")}): "${k}" should be yes or no, got "${cell(k)}"`);
      return undefined;
    };
    const list = (/** @type {string} */ k) => cell(k).split("|").map((s) => s.trim()).filter(Boolean);
    /** A photo in img/ with its size and alt text. @param {string} file @param {string} alt */
    const photo = (file, alt) => {
      if (!file) return undefined;
      const src = file.startsWith("img/") ? file : `img/${file}`;
      const size = sizeOf(src);
      if (!size) { errors.push(`row ${line} (${cell("id")}): photo ${src} isn't in the site's img/ folder`); return { src, width: 0, height: 0, alt }; }
      return { src, width: size.width, height: size.height, alt };
    };

    const alt = cell("photo_alt");
    const galleryAlts = list("gallery_alt");
    const reduction = cell("excess_reduction").toLowerCase() === "none" ? false
      : (cell("reduction_price") ? { price: num("reduction_price"), per: cell("reduction_per") || undefined, to: num("reduction_to") } : undefined);
    const miles = cell("miles_per_day").toLowerCase() === "unlimited" ? "unlimited" : num("miles_per_day");
    /** @type {Record<string, any>} */
    const car = {
      id: cell("id").toLowerCase(), make: cell("make"), model: cell("model"), trim: cell("trim") || undefined, year: num("year"),
      class: cell("class").toLowerCase(), seats: num("seats"), doors: num("doors"), boot: cell("boot") || undefined,
      gearbox: cell("gearbox") || undefined, fuel: cell("fuel") || undefined, power: num("power_bhp"), zeroToSixtyTwo: num("zero_62"),
      interior: cell("interior") || undefined, colours: list("colours").length ? list("colours") : undefined,
      photos: {
        card: photo(cell("photo"), alt),
        small: photo(cell("photo_small"), alt),
        square: photo(cell("photo_square"), alt),
        gallery: list("gallery").length ? list("gallery").map((f, k) => photo(f, galleryAlts[k] ?? "")) : undefined,
        arrival: photo(cell("arrival_photo"), cell("arrival_alt")),
      },
      rates: { day: num("day"), weekend: num("weekend"), week: num("week"), month: num("month") },
      deposit: num("deposit"), payLink: cell("pay_link") || undefined,
      driver: cell("min_age") || cell("licence_years") || cell("max_points") ? { minAge: num("min_age"), licenceYears: num("licence_years"), maxPoints: num("max_points") } : undefined,
      insurance: cell("insurance") || cell("excess") || reduction !== undefined ? { cover: cell("insurance") || undefined, excess: num("excess"), reduction } : undefined,
      miles: miles !== undefined || cell("extra_mile") ? { perDay: miles, extra: num("extra_mile") } : undefined,
      fuelPolicy: cell("fuel_policy") || undefined, lateReturn: cell("late_return") || undefined,
      delivery: yes("delivery"), chauffeurOnly: yes("chauffeur_only"),
      chauffeur: cell("hourly") || cell("min_hours") ? { hourly: num("hourly"), minHours: num("min_hours") } : undefined,
      tuned: cell("tuned_mods") || cell("tuned_insurance") ? { mods: cell("tuned_mods") || undefined, insurance: cell("tuned_insurance") || undefined, driver: cell("tuned_driver") || undefined } : undefined,
      lead: yes("lead"), firstTen: list("first_ten").length ? list("first_ten") : undefined,
    };
    return prune(car);
  });
  return { cars, errors };
}

/** Drops undefined values (and objects left empty) so a missing cell is missing, not null. @param {any} v @returns {any} */
function prune(v) {
  if (Array.isArray(v)) return v.map(prune);
  if (v === null || typeof v !== "object") return v;
  /** @type {Record<string, any>} */ const out = {};
  for (const [k, x] of Object.entries(v)) {
    const p = prune(x);
    if (p === undefined) continue;
    if (p && typeof p === "object" && !Array.isArray(p) && !Object.keys(p).length) continue;
    out[k] = p;
  }
  return out;
}
