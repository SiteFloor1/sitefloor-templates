// @ts-check
/**
 * What to wear today: the Open-Meteo forecast for the brand's city, read into four plain
 * conditions, each answered by the brand's own words and pieces. Nothing is claimed about a garment; the site only
 * says which of the brand's pieces it would put on for that weather.
 */

export const WET_CHANCE = 40; // % chance of rain in the next 12 hours that counts as a wet day
export const WINDY_KMH = 25; // a fresh breeze and above
export const COLD_C = 10;
export const CONDITIONS = /** @type {const} */ (["wet", "windy", "cold", "mild"]);

/**
 * Open-Meteo's free API is for non-commercial use only, so a brand's site uses its own paid Open-Meteo plan: the
 * customer API with the brand's key.
 * @param {number} lat @param {number} lng @param {string} timeZone @param {string} apiKey
 */
export function forecastUrl(lat, lng, timeZone, apiKey) {
  const q = new URLSearchParams({
    latitude: lat.toFixed(4), longitude: lng.toFixed(4),
    current: "temperature_2m,apparent_temperature,wind_speed_10m,precipitation",
    hourly: "precipitation_probability", forecast_hours: "12", timezone: timeZone,
  });
  q.set("apikey", apiKey);
  return `https://customer-api.open-meteo.com/v1/forecast?${q}`;
}

/**
 * @typedef {{ temp: number, feels: number, wind: number, rainChance: number, rainHour: number|null, raining: boolean, time: string }} Forecast
 * @param {any} json Open-Meteo's answer @returns {Forecast|null} null if anything needed is missing
 */
export function readForecast(json) {
  const c = json?.current;
  const pp = json?.hourly?.precipitation_probability;
  const times = json?.hourly?.time;
  const nums = [c?.temperature_2m, c?.apparent_temperature, c?.wind_speed_10m, c?.precipitation];
  if (!c || !nums.every((n) => typeof n === "number" && Number.isFinite(n)) || !Array.isArray(pp) || !Array.isArray(times) || typeof c.time !== "string") return null;
  const chances = pp.map((/** @type {any} */ p) => (typeof p === "number" ? p : 0));
  const rainChance = chances.length ? Math.max(...chances) : 0;
  const firstWet = chances.findIndex((p) => p >= WET_CHANCE);
  const rainHour = firstWet >= 0 && typeof times[firstWet] === "string" ? Number(times[firstWet].slice(11, 13)) : null;
  return { temp: Math.round(c.temperature_2m), feels: Math.round(c.apparent_temperature), wind: Math.round(c.wind_speed_10m), rainChance, rainHour, raining: c.precipitation > 0, time: c.time };
}

/** The one condition that decides the kit, in order of what matters most outside. @param {Forecast} f @returns {typeof CONDITIONS[number]} */
export function conditionOf(f) {
  if (f.raining || f.rainChance >= WET_CHANCE) return "wet";
  if (f.wind >= WINDY_KMH) return "windy";
  if (f.temp < COLD_C) return "cold";
  return "mild";
}

/** 18 → "6pm", 0 → "midnight", 12 → "midday". @param {number} h */
export function hourWords(h) {
  if (h === 0) return "midnight";
  if (h === 12) return "midday";
  return `${h % 12}${h < 12 ? "am" : "pm"}`;
}

/**
 * The sentence: "London is 11° with rain from 6pm." / "… and windy, 31 km/h." / "… and dry."
 * @param {string} place @param {Forecast} f
 */
export function weatherSentence(place, f) {
  const base = `${place} is ${f.temp}°`;
  if (f.raining) return `${base} and raining.`;
  if (f.rainChance >= WET_CHANCE && f.rainHour !== null) return `${base} with rain from ${hourWords(f.rainHour)}.`;
  if (f.wind >= WINDY_KMH) return `${base} and windy, ${f.wind} km/h.`;
  return `${base} and dry.`;
}
