// @ts-check
/**
 * "Now" for code that runs at build time. Normally the real clock; when the build is run as on another day
 * (`node scripts/build.js --today YYYY-MM-DD`, which the browser tests use), midday UTC on that day, so a build's
 * output never depends on when it ran.
 */

/** @returns {number} milliseconds, like Date.now() */
export function buildNow() {
  const day = process.env.SITEFLOOR_BUILD_DAY;
  return day && /^\d{4}-\d\d-\d\d$/.test(day) ? Date.parse(`${day}T12:00:00Z`) : Date.now();
}
