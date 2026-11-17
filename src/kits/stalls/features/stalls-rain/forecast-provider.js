// @ts-check
/**
 * The rain check's forecast: Open-Meteo (free, no key, no cookies), hourly chance of rain for two days at the
 * market's latitude and longitude. Fails closed: nothing is shown.
 */
const TIMEOUT_MS = 6000;

/** @type {import("./stalls-rain.js").RainProvider} */
export const forecastRain = {
  async load(ctx, place) {
    const tz = /** @type {any} */ (ctx.data).hours?.timezone ?? "Europe/London";
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}&hourly=precipitation_probability&forecast_days=2&timezone=${encodeURIComponent(tz)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal, credentials: "omit" });
      if (!res.ok) return null;
      const j = await res.json();
      const t = j?.hourly?.time, p = j?.hourly?.precipitation_probability;
      if (!Array.isArray(t) || !Array.isArray(p) || t.length !== p.length) return null;
      return t.map((time, i) => ({ time: String(time), p: Number(p[i]) })).filter((h) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(h.time) && Number.isFinite(h.p));
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  },
};
