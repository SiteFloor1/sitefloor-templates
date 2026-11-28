// @ts-check
/**
 * The shoot-day cloud forecast under the planner: for a date up to nine days ahead, the cloud cover MET Norway
 * forecasts for the middle of that evening's golden hour at the road, with the source and when it was updated. Free,
 * no key; commercial use allowed with credit. Nothing at all is shown when the forecast can't be read, is older than
 * 12 hours, or doesn't reach the date (lib/carfilm.js cloudAtGolden). One request per road and hour.
 */
import { cloudAtGolden, cloudWords, ukHm } from "../../lib/carfilm.js";

const API = "https://api.met.no/weatherapi/locationforecast/2.0/compact";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const line = /** @type {HTMLElement|null} */ (root.closest("[data-feature='carfilm-planner']")?.querySelector("[data-forecast]") ?? document.querySelector("[data-forecast]"));
  if (!line) throw new Error("forecast line missing");
  /** @type {Map<string, Promise<any>>} */ const cache = new Map();
  const get = (/** @type {any} */ r) => {
    const key = `${r.lat.toFixed(2)},${r.lon.toFixed(2)},${Math.floor(Date.now() / 3_600_000)}`;
    if (!cache.has(key)) {
      const ctl = new AbortController(); setTimeout(() => ctl.abort(), 6000);
      cache.set(key, fetch(`${API}?lat=${r.lat.toFixed(4)}&lon=${r.lon.toFixed(4)}`, { signal: ctl.signal }).then((res) => (res.ok ? res.json() : null)).catch(() => null));
    }
    return /** @type {Promise<any>} */ (cache.get(key));
  };
  let ask = 0;
  ctx.watch("plan", async (/** @type {any} */ p) => {
    const mine = ++ask;
    line.hidden = true;
    const days = (Date.parse(`${p.ymd}T12:00:00Z`) - Date.now()) / 86_400_000;
    if (days > 9 || p.line.low) return;
    const json = await get(p.road);
    if (mine !== ask) return;
    const c = cloudAtGolden(json, p.light, Date.now());
    if (!c) return;
    const link = (/** @type {string} */ href, /** @type {string} */ words) => Object.assign(document.createElement("a"), { href, textContent: words, rel: "noopener" });
    line.replaceChildren(
      `Forecast at golden hour: ${cloudWords(c.cloud)}, ${c.cloud}% cloud. `,
      link("https://www.met.no/en", "MET Norway"), " (",
      link("https://creativecommons.org/licenses/by/4.0/", "CC BY 4.0"), `), updated ${ukHm(c.updated)}.`,
    );
    line.hidden = false;
  });
}
