// @ts-check
/**
 * Offices, out of hours: the visitor's opening hours (drag or arrow keys), mornings or evenings, and their counts; the
 * night's minutes per zone from the company's own figures (lib/plan.js officeZones), the window drawn against the day,
 * the total and the survey message all from the same numbers.
 */
import { officeWindow, officeZones, clock } from "../../lib/plan.js";
import { hm } from "../../lib/visit.js";

const MIN = 5 * 60, MAX = 22 * 60;

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).cleaning?.offices;
  const q = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  const say = q("[data-off-say]"), track = q("[data-off-track]"), office = q("[data-off-office]"), clean = q("[data-off-clean]"), cleanT = q("[data-off-clean-t]");
  const hOpen = q("[data-off-open]"), hClose = q("[data-off-close]"), total = q("[data-off-total]"), send = /** @type {HTMLAnchorElement|null} */ (q("[data-off-send]"));
  if (!cfg || !say || !track || !office || !clean || !cleanT || !hOpen || !hClose || !total || !send) throw new Error("offices markup or config missing");
  const toMin = (/** @type {string} */ t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const hours = { open: toMin(cfg.hours.open), close: toMin(cfg.hours.close) };
  let when = /** @type {"before"|"after"} */ ("before");
  /** @type {Record<string, number>} */ const counts = Object.fromEntries(cfg.zones.filter((/** @type {any} */ z) => z.per).map((/** @type {any} */ z) => [z.id, z.count]));
  const pct = (/** @type {number} */ m) => `${((Math.min(MAX, Math.max(MIN, m)) - MIN) / (MAX - MIN)) * 100}%`;

  const render = () => {
    const zones = officeZones(cfg.zones, counts), minutes = zones.reduce((n, z) => n + z.min, 0);
    for (const z of zones) { const el = root.querySelector(`[data-zone-min="${z.id}"]`); if (el) el.textContent = String(z.min); }
    const w = officeWindow(hours, when, minutes, cfg.gap);
    say.textContent = w.words;
    office.style.left = pct(hours.open); office.style.width = `calc(${pct(hours.close)} - ${pct(hours.open)})`;
    clean.style.left = pct(w.start); clean.style.width = `calc(${pct(w.end)} - ${pct(w.start)})`;
    cleanT.textContent = `${clock(w.start)}–${clock(w.end)}`;
    hOpen.style.left = pct(hours.open); hClose.style.left = pct(hours.close);
    for (const [h, v] of /** @type {[HTMLElement, number][]} */ ([[hOpen, hours.open], [hClose, hours.close]])) { h.setAttribute("aria-valuenow", String(v)); h.setAttribute("aria-valuetext", clock(v)); }
    total.textContent = hm(minutes);
    const lines = zones.map((z) => `${z.name}${counts[z.id] ? ` (${counts[z.id]})` : ""}: ${z.min} min`);
    send.href = ctx.bookHref([cfg.message, "", `We open ${clock(hours.open)}, close ${clock(hours.close)}. ${when === "before" ? "Mornings" : "Evenings"}.`, ...lines, `About ${hm(minutes)} a night.`].join("\n"));
  };
  /** @param {HTMLElement} h @param {(v: number) => void} set */
  const drag = (h, set) => {
    h.addEventListener("pointerdown", (e) => {
      h.setPointerCapture(e.pointerId);
      const move = (/** @type {PointerEvent} */ ev) => { const r = track.getBoundingClientRect(); set(Math.round((MIN + ((ev.clientX - r.left) / r.width) * (MAX - MIN)) / 15) * 15); render(); };
      h.addEventListener("pointermove", move);
      h.addEventListener("pointerup", () => h.removeEventListener("pointermove", move), { once: true });
    });
    h.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault(); set(Number(h.getAttribute("aria-valuenow")) + (e.key === "ArrowRight" ? 15 : -15)); render();
    });
  };
  drag(hOpen, (v) => { hours.open = Math.min(720, Math.max(360, v)); });
  drag(hClose, (v) => { hours.close = Math.min(1260, Math.max(840, v)); });
  root.addEventListener("change", (e) => {
    const t = /** @type {HTMLInputElement} */ (e.target);
    if (t.name === "when") when = /** @type {any} */ (t.value);
    if (t.dataset.zoneCount) counts[t.dataset.zoneCount] = Math.max(1, Math.min(Number(t.max), Math.round(Number(t.value) || 1)));
    render();
  });
  render();
}
