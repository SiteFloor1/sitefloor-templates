// @ts-check
/**
 * Where the sun falls: redraws the garden whenever a setting changes (hours of sun for the month, shadows at the hour),
 * says it in words, and gives a tapped spot its hours and the palette's plants for that light.
 */
import { FACINGS, sunHours, parts, dayWords, sunAt, sunnyShare, momentWords, lightOf, hoursWords, clock, grid, compass } from "../../lib/sun-study.js";
import { drawGarden, unproject } from "../../lib/sun-draw.js";
import { MONTHS, LIGHT, spotText } from "../../lib/garden.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  if (root.hasAttribute("data-ss-home")) return initHome(root, ctx);
  const cfg = /** @type {any} */ (ctx.data).sun;
  const $ = (/** @type {string} */ s) => /** @type {any} */ (root.querySelector(s));
  const svg = /** @type {SVGSVGElement} */ ($("[data-ss-svg]")), form = /** @type {HTMLFormElement} */ ($("[data-ss-form]"));
  const day = $("[data-ss-day]"), moment = $("[data-ss-moment]"), views = $("[data-ss-views]"), send = $("[data-ss-send]");
  const spotBox = $("[data-ss-spot]"), spotWords = $("[data-ss-spot-words]"), plantsList = $("[data-ss-plants]"), tap = $("[data-ss-tap]");
  if (!cfg || !svg || !form || !day || !moment || !views || !send || !spotBox || !spotWords || !plantsList || !tap) throw new Error("sun-study markup missing");
  const at = { lat: cfg.lat, lng: cfg.lng, tz: cfg.tz };
  const year = Number(ctx.now().date.slice(0, 4));
  form.hidden = false; views.removeAttribute("data-wait"); tap.hidden = false;
  // open on the visitor's month (the page was built in another one)
  const thisMonth = /** @type {HTMLInputElement|null} */ (form.querySelector(`input[name=ss-month][value="${Number(ctx.now().date.slice(5, 7))}"]`));
  if (thisMonth) thisMonth.checked = true;

  /** @type {"plan"|"3d"} */ let view = "plan";
  /** @type {[number, number]|null} */ let spot = null;
  /** @type {Record<string, { nx: number, ny: number, hours: number[] }>} */ const cache = {};

  const read = () => {
    const v = (/** @type {string} */ s) => /** @type {HTMLInputElement} */ (form.querySelector(s)).value;
    const facingKey = /** @type {keyof typeof FACINGS} */ (v("input[name=ss-facing]:checked"));
    return {
      facingKey, facing: FACINGS[facingKey], month: Number(v("input[name=ss-month]:checked")), time: Number(v("[data-ss-time]")),
      g: { width: Number(v("[data-ss-w]")), length: Number(v("[data-ss-l]")), house: Number(v("[data-ss-house]")), fence: Number(v("[data-ss-fence]")) },
    };
  };
  /** Hours of sun, remembered per setting so moving the hour only redraws the shadows. @param {ReturnType<typeof read>} s @param {number} month */
  const hoursFor = (s, month) => {
    const key = [s.facing, month, s.g.width, s.g.length, s.g.house, s.g.fence].join("|");
    return (cache[key] ??= sunHours(s.g, s.facing, at, year, month));
  };
  /** @param {ReturnType<typeof read>} s @param {number} month */
  const hoursAt = (s, month) => {
    if (!spot) return 0;
    const h = hoursFor(s, month), gr = grid(s.g);
    const i = Math.min(gr.nx - 1, Math.max(0, Math.floor(spot[0] / gr.cw))), j = Math.min(gr.ny - 1, Math.max(0, Math.floor(spot[1] / gr.ch)));
    return h.hours[j * gr.nx + i];
  };

  const render = () => {
    const s = read();
    if (spot && (spot[0] > s.g.width || spot[1] > s.g.length)) spot = null;
    const hours = hoursFor(s, s.month), sun = sunAt(at, year, s.month, s.time);
    const d = drawGarden({ g: s.g, facing: s.facing, view, hours, sun, spot, id: "ss" });
    svg.setAttribute("viewBox", d.viewBox);
    svg.innerHTML = d.svg;
    /** @type {HTMLOutputElement} */ ($("[data-ss-time-out]")).value = clock(s.time);
    /** @type {HTMLOutputElement} */ ($("[data-ss-w-out]")).value = `${s.g.width} m`;
    /** @type {HTMLOutputElement} */ ($("[data-ss-l-out]")).value = `${s.g.length} m`;
    day.textContent = dayWords(parts(hours), MONTHS[s.month - 1]);
    moment.textContent = `At ${clock(s.time)}: ${momentWords(sun, sunnyShare(s.g, sun, s.facing))}`;
    let spotLine = "";
    if (spot) {
      const june = hoursAt(s, 6), now = hoursAt(s, s.month), light = lightOf(june);
      spotWords.textContent = `This spot gets ${hoursWords(june)} of sun on 21 June${s.month === 6 ? "" : ` and ${hoursWords(now)} on 21 ${MONTHS[s.month - 1]}`}: ${LIGHT[light].toLowerCase()}.`;
      const fits = (cfg.plants ?? []).filter((/** @type {any} */ p) => p.light.includes(light));
      plantsList.innerHTML = "";
      for (const p of fits.slice(0, 8)) { const li = document.createElement("li"); li.textContent = p.name; plantsList.append(li); }
      if (!fits.length && cfg.plants?.length) { const li = document.createElement("li"); li.textContent = "Nothing in our palette for this light: ask us."; plantsList.append(li); }
      spotBox.hidden = false;
      spotLine = `somewhere that gets ${hoursWords(june)} of sun in June`;
    } else spotBox.hidden = true;
    send.href = ctx.bookHref(spotText(cfg.message, { facing: compass(s.facing), size: `${s.g.width} × ${s.g.length} m`, spot: spotLine }));
  };

  let queued = false;
  const soon = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; render(); }); } };
  form.addEventListener("input", soon);
  form.addEventListener("change", soon);
  form.addEventListener("submit", (e) => e.preventDefault());
  views.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement} */ (e.target).closest("button");
    if (!b) return;
    view = b.dataset.ssView === "3d" ? "3d" : "plan";
    views.querySelectorAll("button").forEach((/** @type {HTMLElement} */ x) => x.setAttribute("aria-pressed", String(x === b)));
    render();
  });
  svg.addEventListener("click", (e) => {
    const m = svg.getScreenCTM();
    if (!m) return;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    const s = read();
    const [x, y] = unproject(view, s.g, [pt.x, pt.y]);
    if (x < 0 || y < 0 || x > s.g.width || y > s.g.length) return;
    spot = [x, y];
    render();
  });
  render();
}

/**
 * The home page's short version: the example garden, turned to face another way or seen on 21 December. Nothing is
 * worked out until a button is pressed (the June drawing was built with the page).
 * @param {HTMLElement} root @param {import("../../../../core/js/core.js").Ctx} ctx
 */
function initHome(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).sun;
  const svg = root.querySelector("[data-ss-svg]"), day = root.querySelector("[data-ss-day]");
  const facings = root.querySelector("[data-ss-facings]"), days = root.querySelector("[data-ss-days]");
  if (!cfg || !svg || !day || !facings || !days) throw new Error("sun-study home markup missing");
  const at = { lat: cfg.lat, lng: cfg.lng, tz: cfg.tz }, year = Number(ctx.now().date.slice(0, 4));
  let facingKey = /** @type {keyof typeof FACINGS} */ (cfg.garden.facing), month = 6;
  root.querySelector("[data-wait]")?.removeAttribute("data-wait");
  const render = () => {
    const facing = FACINGS[facingKey], hours = sunHours(cfg.garden, facing, at, year, month);
    const d = drawGarden({ g: cfg.garden, facing, view: "plan", hours, sun: null, id: "sh" });
    svg.setAttribute("viewBox", d.viewBox);
    svg.innerHTML = d.svg;
    day.textContent = dayWords(parts(hours), MONTHS[month - 1]);
  };
  /** @param {Element} row @param {(b: HTMLElement) => void} pick */
  const choose = (row, pick) => row.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement|null} */ (/** @type {HTMLElement} */ (e.target).closest("button"));
    if (!b || b.getAttribute("aria-pressed") === "true") return;
    row.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    pick(b);
    render();
  });
  choose(facings, (b) => { facingKey = /** @type {keyof typeof FACINGS} */ (b.dataset.ssFacing); });
  choose(days, (b) => { month = Number(b.dataset.ssMonth); });
}
