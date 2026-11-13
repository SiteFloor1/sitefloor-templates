// @ts-check
/**
 * Where the sun is: its height above the horizon and its compass bearing, for a place and a moment, by NOAA's solar
 * position equations (accurate to a fraction of a degree). Shared by every kit that shows light: construction's light
 * study, the wedding-film kit's day light and the garden kit's "where the sun falls". Kits keep their own words.
 * Tested in tests/unit/sun.test.js.
 */

const RAD = Math.PI / 180;

/**
 * The exact angles, unrounded (for searching the day for the moment the sun crosses a height, as the wedding-film kit
 * does for sunset and golden hour).
 * @param {number} ms a moment (UTC milliseconds) @param {number} lat degrees north @param {number} lng degrees east
 * @returns {{ elevation: number, azimuth: number }} degrees; azimuth clockwise from north
 */
export function solarAngles(ms, lat, lng) {
  const jd = ms / 86_400_000 + 2440587.5;
  const t = (jd - 2451545) / 36525;
  const l0 = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
  const m = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const c = Math.sin(m * RAD) * (1.914602 - t * (0.004817 + 0.000014 * t)) + Math.sin(2 * m * RAD) * (0.019993 - 0.000101 * t) + Math.sin(3 * m * RAD) * 0.000289;
  const omega = 125.04 - 1934.136 * t;
  const lambda = l0 + c - 0.00569 - 0.00478 * Math.sin(omega * RAD);
  const eps0 = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(omega * RAD);
  const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD));
  const y = Math.tan((eps / 2) * RAD) ** 2;
  const eqTime = 4 / RAD * (y * Math.sin(2 * l0 * RAD) - 2 * e * Math.sin(m * RAD) + 4 * e * y * Math.sin(m * RAD) * Math.cos(2 * l0 * RAD)
    - 0.5 * y * y * Math.sin(4 * l0 * RAD) - 1.25 * e * e * Math.sin(2 * m * RAD));
  const d = new Date(ms);
  const minutes = d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60;
  const trueSolar = (((minutes + eqTime + 4 * lng) % 1440) + 1440) % 1440;
  const hourAngle = trueSolar / 4 < 0 ? trueSolar / 4 + 180 : trueSolar / 4 - 180;
  const cosZen = Math.sin(lat * RAD) * Math.sin(decl) + Math.cos(lat * RAD) * Math.cos(decl) * Math.cos(hourAngle * RAD);
  const zenith = Math.acos(Math.min(1, Math.max(-1, cosZen)));
  const elevation = 90 - zenith / RAD;
  const az = Math.acos(Math.min(1, Math.max(-1, (Math.sin(lat * RAD) * Math.cos(zenith) - Math.sin(decl)) / (Math.cos(lat * RAD) * Math.sin(zenith)))));
  const azimuth = hourAngle > 0 ? (az / RAD + 180) % 360 : (540 - az / RAD) % 360;
  return { elevation, azimuth };
}

/**
 * Where the sun is, to a tenth of a degree (what the light studies draw and say).
 * @param {number} ms a moment (UTC milliseconds) @param {number} lat degrees north @param {number} lng degrees east
 * @returns {{ elevation: number, azimuth: number }} degrees; azimuth clockwise from north
 */
export function sunPosition(ms, lat, lng) {
  const { elevation, azimuth } = solarAngles(ms, lat, lng);
  return { elevation: Math.round(elevation * 10) / 10, azimuth: Math.round(azimuth * 10) / 10 };
}
