// @ts-check
/** Dates as the hire messages and pages say them, built by hand so every browser and Node say them the same way. */
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** @param {string} iso */
const parts = (iso) => { const d = new Date(`${iso}T12:00:00Z`); return { w: d.getUTCDay(), d: d.getUTCDate(), m: d.getUTCMonth(), y: d.getUTCFullYear() }; };
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** "Saturday 7 November 2026". @param {string} iso YYYY-MM-DD */
export function longDate(iso) {
  if (!ISO.test(iso)) return iso;
  const p = parts(iso);
  return `${DAYS[p.w]} ${p.d} ${MONTHS[p.m]} ${p.y}`;
}

/** "Sat 7 Nov". @param {string} iso */
export function shortDate(iso) {
  if (!ISO.test(iso)) return iso;
  const p = parts(iso);
  return `${DAYS[p.w].slice(0, 3)} ${p.d} ${MONTHS[p.m].slice(0, 3)}`;
}
