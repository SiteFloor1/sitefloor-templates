// @ts-check
/**
 * Plan your visit: live parking status, journey tabs and the "leave by" helper.
 * Without JavaScript every journey shows in full and the board shows the fixed details.
 */
import { parkingStatus, leaveBy, leaveText, leaveTime, MODE_WORDS } from "../../core/lib/arrival.js";

/** @typedef {{ parking: import("../../core/lib/arrival.js").Parking[], region: import("../../core/lib/bank-holidays.js").Region, journeys: { from: string, minutes: number, mode: string, stop?: string }[] }} VisitData */

/** @type {import("../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  /** @type {VisitData} */
  const v = /** @type {any} */ (ctx.data).visit ?? { parking: [], journeys: [], region: "england-wales" };
  parkingLive(root, v, ctx);
  tabs(root);
  leaveHelper(root, v);
}

/** @param {HTMLElement} root @param {VisitData} v @param {import("../../core/js/core.js").Ctx} ctx */
function parkingLive(root, v, ctx) {
  const paint = () => {
    const now = ctx.now();
    v.parking.forEach((p, i) => {
      const s = parkingStatus(p, ctx.data.hours.timezone, now, v.region);
      const bare = parkingStatus({ ...p, price: undefined }, ctx.data.hours.timezone, now, v.region); // the card lists the price below
      for (const el of /** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll(`[data-parking="${i}"], [data-parking-card="${i}"]`))) {
        el.textContent = el.hasAttribute("data-parking") ? (p.walk !== undefined ? `${s.text} · ${p.walk} min walk` : s.text) : bare.text;
        el.classList.toggle("is-free", s.free);
        el.classList.toggle("is-closed", Boolean(s.closed));
        el.hidden = false;
      }
    });
  };
  paint();
  ctx.everyMinute(paint);
}

/** Accessible tabs: arrow keys move between journeys. @param {HTMLElement} root */
function tabs(root) {
  const list = /** @type {HTMLElement|null} */ (root.querySelector("[data-pv-tabs]"));
  if (!list) return;
  const buttons = /** @type {HTMLButtonElement[]} */ ([...list.querySelectorAll('[role="tab"]')]);
  const panels = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-pv-panel]")]);
  const select = (/** @type {number} */ i, /** @type {boolean} */ focus) => {
    buttons.forEach((b, j) => { b.setAttribute("aria-selected", String(i === j)); b.tabIndex = i === j ? 0 : -1; });
    panels.forEach((p, j) => { p.hidden = i !== j; });
    if (focus) buttons[i].focus();
  };
  list.hidden = buttons.length < 2;
  if (buttons.length < 2) return;
  // Tab roles only once the tabs work; without JavaScript the journeys are plain sections.
  panels.forEach((p, j) => { p.setAttribute("role", "tabpanel"); p.setAttribute("aria-labelledby", `pv-tab-${j}`); });
  buttons.forEach((b, i) => b.addEventListener("click", () => select(i, false)));
  list.addEventListener("keydown", (e) => {
    const at = buttons.indexOf(/** @type {HTMLButtonElement} */ (document.activeElement));
    const k = /** @type {KeyboardEvent} */ (e).key;
    if (at === -1 || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(k)) return;
    e.preventDefault();
    const next = k === "Home" ? 0 : k === "End" ? buttons.length - 1 : (at + (k === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
    select(next, true);
  });
  select(0, false);
}

/** @param {HTMLElement} root @param {VisitData} v */
function leaveHelper(root, v) {
  const box = /** @type {HTMLElement|null} */ (root.querySelector("[data-pv-leave]"));
  const input = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-pv-appt]"));
  const out = root.querySelector("[data-pv-leave-list]");
  if (!box || !input || !out || !v.journeys.length) return;
  box.hidden = false;
  const paint = () => {
    const m = /^(\d{2}):(\d{2})$/.exec(input.value);
    if (!m) { out.replaceChildren(); return; }
    const appt = Number(m[1]) * 60 + Number(m[2]);
    out.replaceChildren(...v.journeys.map((j) => {
      const li = document.createElement("li");
      const time = leaveTime(leaveBy(appt, j.minutes));
      const [before] = leaveText(j, time).split(time);
      const how = document.createElement("span");
      how.className = "pv-how";
      how.textContent = MODE_WORDS[/** @type {keyof typeof MODE_WORDS} */ (j.mode)]?.tab ?? "";
      const b = document.createElement("b");
      b.textContent = time;
      li.append(how, " ", before, b);
      return li;
    }));
  };
  input.addEventListener("input", paint);
}
