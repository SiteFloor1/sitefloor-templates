// @ts-check
/**
 * What to wear today: the forecast from Open-Meteo (the brand's paid plan, key in data-key), the condition, the
 * brand's sentence and pieces. A demo has no key and never calls Open-Meteo: it keeps its labelled example.
 */
import { forecastUrl, readForecast, conditionOf, weatherSentence } from "../../lib/weather.js";

/** @param {HTMLElement} root @param {import("../../../../core/js/core.js").Ctx} ctx */
export function init(root, ctx) {
  /** @type {Record<string, { say: string, pieces: string[], with?: string[] }>} */
  let looks = {};
  try { looks = JSON.parse(root.querySelector("[data-wear-looks]")?.textContent ?? "{}"); } catch { return; }
  const place = root.dataset.place ?? "";
  const tz = root.dataset.tz ?? "Europe/London";
  const key = root.dataset.key;
  if (!key) {
    ctx.share("wear-today", { sentence: root.querySelector("[data-today-weather]")?.textContent ?? "", say: looks.wet?.say ?? "", pieces: looks.wet?.pieces ?? [], with: looks.wet?.with ?? [], condition: "wet", example: true });
    return;
  }
  const url = forecastUrl(Number(root.dataset.lat), Number(root.dataset.lng), tz, key);
  const load = () => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject())).then((json) => {
    const f = readForecast(json);
    if (!f) throw new Error("forecast unreadable");
    const cond = conditionOf(f);
    const look = looks[cond];
    if (!look) throw new Error("no look for " + cond);
    const set = (/** @type {string} */ sel, /** @type {string} */ text) => { const el = root.querySelector(sel); if (el) el.textContent = text; };
    set("[data-today-weather]", weatherSentence(place, f));
    set("[data-today-wear]", look.say);
    root.querySelectorAll("[data-kit-piece]").forEach((li) => { /** @type {HTMLElement} */ (li).hidden = !look.pieces.includes(/** @type {HTMLElement} */ (li).dataset.kitPiece ?? ""); });
    const withEl = /** @type {HTMLElement|null} */ (root.querySelector("[data-today-with]"));
    if (withEl) { withEl.hidden = !look.with?.length; withEl.textContent = look.with?.length ? `With: ${look.with.join(", ").toLowerCase()}.` : ""; }
    credit(root.querySelector("[data-today-src]"), f.time.slice(11, 16));
    root.hidden = false;
    ctx.share("wear-today", { sentence: weatherSentence(place, f), say: look.say, pieces: look.pieces, with: look.with ?? [], condition: cond });
  }).catch(() => { root.hidden = true; }); // no forecast, no section

  load();
  setInterval(load, 30 * 60_000);
}

/**
 * The credit Open-Meteo's data licence (CC BY 4.0) asks for: the source and the licence, both linked.
 * @param {Element|null} el @param {string} hhmm
 */
function credit(el, hhmm) {
  if (!el) return;
  const a = (/** @type {string} */ href, /** @type {string} */ text) => { const l = document.createElement("a"); l.href = href; l.textContent = text; l.rel = "noopener"; return l; };
  el.replaceChildren(`Updated ${hhmm} · weather data by `, a("https://open-meteo.com/", "Open-Meteo.com"), " (", a("https://creativecommons.org/licenses/by/4.0/", "CC BY 4.0"), ")");
}
