// @ts-check
/** Florist kit additions to the shared Eleventy setup: home sections, the week's colour, prices, dates and the care-card QR. */
import { HOME_PARTS, HOME_ELSEWHERE } from "./home.js";
import { weekTokens } from "./lib/week.js";
import { cutoffLabel } from "./lib/delivery.js";
import { pounds } from "./lib/orders.js";
import { weeklyRows } from "../../core/lib/hours.js";
import qrcode from "qrcode-generator";

/** The look's ground and ink, which the week's colour is mixed with (look.json → "week"). */
const DEFAULT_LOOK = { ground: "#F7F6F3", ink: "#1C1B19" };

/** @param {any} eleventyConfig */
export default function floristKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS, elsewhere: HOME_ELSEWHERE });
  // The three tokens a look uses from the week's colour, as a style attribute on <html>: built once, so the first
  // paint is already in this week's colour; the live Sheet can change them later in the browser.
  eleventyConfig.addFilter("weekStyle", (/** @type {any} */ week, /** @type {any} */ look) => {
    if (!week?.colour) return "";
    const t = weekTokens(week.colour, look ?? DEFAULT_LOOK);
    const dots = [week.colour, ...(week.dots ?? [])];
    return `--week:${t.week};--week-deep:${t.weekDeep};--week-wash:${t.weekWash};${dots.map((d, i) => `--dot-${i + 1}:${d}`).join(";")}`;
  });
  eleventyConfig.addFilter("pounds", (/** @type {number} */ n) => pounds(n));
  eleventyConfig.addFilter("cutoffLabel", cutoffLabel);
  // One delivery area's cut-offs: the studio's, with the days the area has its own.
  eleventyConfig.addFilter("areaCutoffs", (/** @type {any} */ d, /** @type {any} */ a) => ({ ...d.cutoffs, ...(a?.cutoffs ?? {}) }));
  eleventyConfig.addFilter("fromPrice", (/** @type {{ price: number }[]} */ items) => Math.min(...items.map((x) => x.price)));
  eleventyConfig.addFilter("monthName", (/** @type {number} */ i) => ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][i]);
  // The pre-order window for an occasion page (shown only while open: at build time here, and in the browser).
  eleventyConfig.addFilter("windowFor", (/** @type {any} */ pre, /** @type {string} */ id) => (pre?.windows ?? []).find((/** @type {any} */ w) => w.occasion === id) ?? null);
  eleventyConfig.addFilter("pageFor", (/** @type {any} */ pages, /** @type {string} */ id) => (pages ?? []).find((/** @type {any} */ p) => p.id === id) ?? null);
  eleventyConfig.addFilter("weekPhoto", (/** @type {any} */ week) => week.photos.find((/** @type {any} */ p) => p.id === week.photo));
  // The house's initial for its monogram ("Ambry" → "A"; "Rose and Ivy" → "R").
  eleventyConfig.addFilter("initial", (/** @type {string} */ name) => (name.match(/[A-Za-z]/)?.[0] ?? "").toUpperCase());
  // Opening days grouped where the hours repeat ("Mon–Fri 8am–6pm").
  eleventyConfig.addFilter("hoursGroups", (/** @type {any} */ hours) => {
    const rows = weeklyRows(hours);
    /** @type {{ days: string, label: string }[]} */ const out = [];
    /** @type {any[]} */ let run = [];
    const flush = () => { if (run.length) out.push({ days: run.length > 1 ? `${run[0].day.slice(0, 3)}–${run[run.length - 1].day.slice(0, 3)}` : run[0].day.slice(0, 3), label: run[0].label }); run = []; };
    for (const r of rows) { if (run.length && run[0].label !== r.label) flush(); run.push(r); }
    flush();
    return out;
  });
  // Delivery days grouped the same way, from the florist's own cut-offs ("Mon–Fri by 1pm · Sat by 11am").
  eleventyConfig.addFilter("cutoffGroups", (/** @type {Record<string, string|null>} */ c) => {
    const keys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    /** @type {string[]} */ const out = [];
    let i = 0;
    while (i < 7) {
      let j = i;
      while (j + 1 < 7 && c[keys[j + 1]] === c[keys[i]]) j++;
      if (c[keys[i]]) out.push(`${i === j ? names[i] : `${names[i]}–${names[j]}`} by ${cutoffLabel(/** @type {string} */ (c[keys[i]]))}`);
      i = j + 1;
    }
    return out.join(" · ");
  });
  eleventyConfig.addFilter("ukDate", (/** @type {string} */ d) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }));
  eleventyConfig.addFilter("upcoming", (/** @type {any[]} */ items, /** @type {string} */ today) => (items ?? []).filter((x) => x.date >= today).sort((a, b) => (a.date < b.date ? -1 : 1)));
  // 150 → "2½ hours", 120 → "2 hours", 90 → "1½ hours".
  eleventyConfig.addFilter("lengthLabel", (/** @type {number} */ m) => { const h = Math.floor(m / 60), half = m % 60 >= 30; return `${h || ""}${half ? "½" : ""} hour${h > 1 || (h === 1 && half) ? "s" : ""}`; });
  eleventyConfig.addFilter("timeLabel", (/** @type {string} */ t) => cutoffLabel(t));
  eleventyConfig.addFilter("dayName", (/** @type {string} */ k) => ({ mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" })[k] ?? k);
  // The care card's QR code, made at build time as an SVG for the florist to print (no service, no tracking).
  eleventyConfig.addFilter("qrSvg", (/** @type {string} */ url) => {
    const qr = qrcode(0, "M");
    qr.addData(url);
    qr.make();
    const n = qr.getModuleCount(), q = 4, size = n + q * 2;
    let d = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + q} ${r + q}h1v1h-1z`;
    return `<svg class="fl-qr" viewBox="0 0 ${size} ${size}" role="img" aria-label="QR code for ${url}" shape-rendering="crispEdges"><rect class="fl-qr-bg" width="${size}" height="${size}"/><path class="fl-qr-on" d="${d}"/></svg>`;
  });
  eleventyConfig.addFilter("byPalette", (/** @type {any[]} */ b, /** @type {string} */ p) => b.filter((x) => x.palette === p));
}
