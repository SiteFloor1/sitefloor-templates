// @ts-check
/**
 * Hyrox race prep: reads a UK date (dd/mm/yyyy) and lays out the weeks to it over the club's phases, with every session
 * from the club's own timetable in one calendar file. Starts with a sample race about sixteen weeks away, said as such under the field.
 */
import { zonedNow } from "../../../../core/lib/hours.js";
import { parseUkDate, ukNumeric, shortDate, numberWords, racePlan, planSessions, planIcs, sampleRace } from "../../lib/gym.js";

/** @param {string} s */
const esc = (s) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const g = /** @type {any} */ (ctx.data).gym, cfg = g.hyrox;
  const q = (/** @type {string} */ s) => /** @type {HTMLElement} */ (root.querySelector(s));
  const input = /** @type {HTMLInputElement} */ (q("[data-gh-date]")), err = q("[data-gh-err]"), weeks = q("[data-gh-weeks]"), list = q("[data-gh-phases]");
  const cal = /** @type {HTMLAnchorElement} */ (q("[data-gh-cal]")), note = q("[data-gh-note]");
  if (!cfg || !input || !weeks || !list || !cal) return;
  const tz = ctx.data.hours.timezone;
  const today = zonedNow(new Date(), tz).date;
  // A sample race on the Saturday about sixteen weeks away (the build drew the same for its own day), so the plan shows
  // before anyone types; a date the visitor has already typed is kept.
  if (!input.value || input.defaultValue === input.value) input.value = ukNumeric(sampleRace(today));
  let url = "";
  const draw = (/** @type {boolean} */ typed) => {
    const race = parseUkDate(input.value);
    if (url) { URL.revokeObjectURL(url); url = ""; }
    cal.classList.add("is-off"); cal.setAttribute("aria-disabled", "true"); cal.removeAttribute("href");
    if (!race) {
      if (typed && input.value.length >= 8) err.textContent = "Type the date as day, month, year: 14/03/2027.";
      return;
    }
    err.textContent = "";
    const plan = racePlan(today, race, cfg);
    if (!plan.ok) {
      list.innerHTML = "";
      weeks.textContent = plan.reason === "past" ? "That date has passed. Type the date of your next race." : plan.reason === "short" ? cfg.short : cfg.long;
      return;
    }
    if (note) note.hidden = typed;
    weeks.innerHTML = `${numberWords(plan.weeks)} weeks. <b>Here's how we'd use them.</b>`;
    list.innerHTML = plan.phases.map((p) => `<li class="gh-p"><p class="gh-pn">${esc(p.name)}, ${p.weeks} ${p.weeks === 1 ? "week" : "weeks"}</p><p>${esc(p.text)}</p><time>${shortDate(p.from)} – ${shortDate(p.to)}</time></li>`).join("");
    const sessions = planSessions(plan.phases, g.weekly, ctx.data.hours);
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    url = URL.createObjectURL(new Blob([planIcs({ sessions, names: g.classes, race, club: g.name, place: g.place, tz, stamp })], { type: "text/calendar" }));
    cal.href = url;
    cal.textContent = `Add the plan to my calendar (${sessions.length} sessions)`;
    cal.classList.remove("is-off"); cal.removeAttribute("aria-disabled");
  };
  input.addEventListener("input", () => draw(true));
  input.addEventListener("change", () => draw(true));
  root.querySelector("form")?.addEventListener("submit", (e) => { e.preventDefault(); draw(true); });
  draw(false);
}
