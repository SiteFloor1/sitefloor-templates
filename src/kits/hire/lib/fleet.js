// @ts-check
/**
 * The fleet: classes, "from" prices, the buckets the filters and the spec dial use, and which cars a page shows.
 * Pure functions over site.json's `fleet` (imported from the client's Google Sheet by tools/import-fleet.js).
 * Every figure is the client's own; nothing here invents one.
 */

/** The classes a hire firm can use, in the order the rail shows them. A client renames them in `fleet.classes`. */
export const CLASS_IDS = ["everyday", "performance", "suv", "supercar", "chauffeur", "tuned"];

/**
 * Buckets for the filters (plain HTML without JavaScript, live with it). Each bucket is a test on a car; a car can be in
 * several (a 5-seat car is in "4+" and "5+"). Budget uses the car's day rate (or a chauffeur car's hourly rate).
 */
export const SEAT_STEPS = [2, 4, 5, 7];
export const POWER_STEPS = [300, 450, 600, 750];
export const BUDGET_STEPS = [300, 600, 1000, 2000];

/**
 * @typedef {object} Car
 * @property {string} id
 * @property {string} make
 * @property {string} model
 * @property {string} [trim]
 * @property {number} year
 * @property {string} class
 * @property {number} seats
 * @property {number} [doors]
 * @property {string} [boot]
 * @property {string} [gearbox]
 * @property {string} [fuel]
 * @property {number} [power]         bhp, as the client states it
 * @property {number} [zeroToSixtyTwo] seconds, as the client states it
 * @property {string} [interior]
 * @property {string[]} [colours]
 * @property {{ card: any, small?: any, square?: any, gallery?: any[], arrival?: any }} photos
 * @property {{ day?: number, weekend?: number, week?: number, month?: number }} [rates]
 * @property {number} [deposit]
 * @property {string} [payLink]
 * @property {{ minAge: number, licenceYears: number, maxPoints: number }} [driver]
 * @property {{ cover: string, excess: number, reduction: false | { price: number, per: "day"|"hire", to: number } }} [insurance]
 * @property {{ perDay: number|"unlimited", extra?: number }} [miles]
 * @property {string} [fuelPolicy]
 * @property {string} [lateReturn]
 * @property {boolean} [delivery]
 * @property {boolean} [chauffeurOnly]
 * @property {{ hourly: number, minHours: number }} [chauffeur]
 * @property {{ mods: string, insurance: string, driver?: string }} [tuned]
 * @property {boolean} [lead]
 * @property {string[]} [firstTen]
 */

/** "Porsche 911 GT3 RS". @param {Car} c */
export const carName = (c) => `${c.make} ${c.model}`;

/** Is the car hired with a driver only? @param {Car} c */
export const isChauffeur = (c) => Boolean(c.chauffeurOnly);

/**
 * The lowest price a car is shown "from": its day rate for self-drive, its hourly rate for chauffeur-only.
 * @param {Car} c @returns {{ amount: number, per: "day"|"hour" } | null}
 */
export function fromPrice(c) {
  if (c.chauffeurOnly && c.chauffeur) return { amount: c.chauffeur.hourly, per: "hour" };
  if (c.rates?.day !== undefined) return { amount: c.rates.day, per: "day" };
  return null;
}

/**
 * Classes the client uses, in rail order, each with its cars and count. A class with no cars is left out.
 * @param {{ classes: any[], cars: Car[] }} fleet
 */
export function classesOf(fleet) {
  return CLASS_IDS
    .map((id) => fleet.classes.find((k) => k.id === id))
    .filter(Boolean)
    .map((k) => ({ ...k, cars: fleet.cars.filter((c) => c.class === k.id) }))
    .filter((k) => k.cars.length);
}

/**
 * The leading class on the home page: one large car (the client's `lead` car, else the first) and the next two.
 * @param {{ lead: string, classes: any[], cars: Car[] }} fleet
 */
export function leadingClass(fleet) {
  const k = classesOf(fleet).find((x) => x.id === fleet.lead);
  if (!k) return null;
  const big = k.cars.find((c) => c.lead) ?? k.cars[0];
  return { ...k, big, side: k.cars.filter((c) => c !== big).slice(0, 2) };
}

/**
 * Filter flags for one car, as data attributes: `seats-4`, `power-450`, `budget-600`. Flags are "at least" for seats and
 * power and "at most" for budget, so each filter is one CSS rule and one JavaScript test.
 * @param {Car} c @returns {string[]}
 */
export function filterFlags(c) {
  const price = fromPrice(c)?.amount;
  return [
    ...SEAT_STEPS.filter((n) => c.seats >= n).map((n) => `seats-${n}`),
    ...(c.power === undefined ? [] : POWER_STEPS.filter((n) => /** @type {number} */ (c.power) >= n).map((n) => `power-${n}`)),
    ...(price === undefined ? [] : BUDGET_STEPS.filter((n) => price <= n).map((n) => `budget-${n}`)),
  ];
}

/**
 * Does a car match the chosen filters? Each value is the bucket chosen ("" = any).
 * @param {Car} c @param {{ cls?: string, seats?: number, power?: number, budget?: number, q?: string }} f
 */
export function matches(c, f) {
  const price = fromPrice(c)?.amount;
  if (f.cls && c.class !== f.cls) return false;
  if (f.seats && c.seats < f.seats) return false;
  if (f.power && (c.power === undefined || c.power < f.power)) return false;
  if (f.budget && (price === undefined || price > f.budget)) return false;
  if (f.q) {
    const words = f.q.toLowerCase().split(/\s+/).filter(Boolean);
    const hay = `${c.make} ${c.model} ${c.trim ?? ""}`.toLowerCase();
    if (!words.every((w) => hay.includes(w))) return false;
  }
  return true;
}

/**
 * Cars in a fleet order: the leading class first, then rail order, then by price. `sort` "low" or "high" orders by price.
 * @param {Car[]} cars @param {"" | "low" | "high"} [sort]
 */
export function sorted(cars, sort = "") {
  const price = (/** @type {Car} */ c) => fromPrice(c)?.amount ?? Infinity;
  const list = [...cars];
  if (sort === "low") return list.sort((a, b) => price(a) - price(b));
  if (sort === "high") return list.sort((a, b) => price(b) - price(a));
  return list.sort((a, b) => CLASS_IDS.indexOf(a.class) - CLASS_IDS.indexOf(b.class) || price(a) - price(b));
}

/** Cars that suit a wedding or event (the client's own list). @param {Car[]} cars @param {string[]} ids */
export const pick = (cars, ids) => ids.map((id) => cars.find((c) => c.id === id)).filter(Boolean);
