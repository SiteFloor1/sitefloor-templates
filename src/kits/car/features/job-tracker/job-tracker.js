// @ts-check
/**
 * Your car, live: reads the code from the link (#K7M2QX) or the box, asks the provider (the studio's sheet on client
 * sites, a simulation on demos) where that car is, and checks again every two minutes while the page is visible.
 * Anything uncertain says to message the studio instead of guessing.
 */
import { agoText, cleanCode } from "../../lib/tracker.js";

/**
 * @typedef {import("../../lib/tracker.js").Job | import("../../lib/tracker.js").NoJob} Result
 * @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx, code: string) => Promise<Result>, every?: number }} TrackerProvider
 */

const EVERY_MS = 120_000;
const WHY = {
  unknown: "We can't find that code. Check it against our message, or message us and we'll tell you where your car is.",
  stale: "We haven't updated this for a while, so it may be out of date. Message us and we'll tell you where your car is.",
  unreadable: "Your car's progress isn't loading right now. Message us and we'll tell you where it is.",
};

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  /** @type {TrackerProvider|null} */
  const provider = ctx.providers.tracker;
  const cfg = /** @type {any} */ (ctx.data).jobTracker;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-jt-form]"));
  const input = /** @type {HTMLInputElement|null} */ (root.querySelector("#jt-code"));
  const card = /** @type {HTMLElement|null} */ (root.querySelector("[data-jt-card]"));
  const off = /** @type {HTMLElement|null} */ (root.querySelector("[data-jt-off]"));
  if (!provider || !cfg || !form || !input || !card || !off) throw new Error("job tracker markup or provider missing");
  const $ = (/** @type {string} */ s) => /** @type {HTMLElement} */ (root.querySelector(s));
  let code = "", timer = 0, lastPhoto = "";

  /** @param {Result} r */
  const show = (r) => {
    if (!r.ok) {
      card.hidden = true; off.hidden = false;
      $("[data-jt-why]").textContent = WHY[r.reason];
      /** @type {HTMLAnchorElement} */ ($("[data-jt-ask]")).href = ctx.waHref(`Hi, how is my car getting on? My code is ${code}.`);
      return;
    }
    off.hidden = true; card.hidden = false;
    const s = cfg.stages[r.stage], last = r.stage === cfg.stages.length - 1;
    $("[data-jt-stage]").textContent = s.name;
    $("[data-jt-about]").textContent = s.about;
    $("[data-jt-upd]").textContent = `Updated ${agoText(Date.now() - r.updatedAt)}`;
    const note = $("[data-jt-note]"); note.hidden = !r.note; note.textContent = r.note;
    const fig = $("[data-jt-fig]"), img = /** @type {HTMLImageElement} */ ($("[data-jt-photo]"));
    fig.hidden = !r.photo;
    if (r.photo && r.photo !== lastPhoto) { img.src = r.photo; lastPhoto = r.photo; }
    for (const li of root.querySelectorAll("[data-jt-step]")) {
      const i = Number(/** @type {HTMLElement} */ (li).dataset.jtStep);
      li.classList.toggle("done", i < r.stage || (last && i === r.stage));
      li.classList.toggle("now", i === r.stage && !last);
      if (i === r.stage) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    }
    $("[data-jt-ready]").hidden = !last;
    /** @type {HTMLAnchorElement} */ ($("[data-jt-way]")).href = ctx.waHref(`Hi, I'm on my way to collect my car. My code is ${code}.`);
  };

  const check = () => {
    if (!code || document.hidden) return;
    provider.load(ctx, code).then(show, () => show({ ok: false, reason: "unreadable" }));
  };
  /** @param {string} raw */
  const open = (raw) => {
    const c = cleanCode(raw);
    if (!c) { input.setCustomValidity("Codes are 4 to 10 letters and numbers."); input.reportValidity(); return; }
    input.setCustomValidity("");
    code = c; input.value = c;
    if (location.hash.slice(1) !== c) history.replaceState(null, "", `#${c}`);
    check();
    clearInterval(timer); timer = window.setInterval(check, provider.every ?? EVERY_MS);
  };

  form.addEventListener("submit", (e) => { e.preventDefault(); open(input.value); });
  input.addEventListener("input", () => input.setCustomValidity(""));
  document.addEventListener("visibilitychange", check);
  const fromLink = cleanCode(decodeURIComponent(location.hash.slice(1)));
  if (fromLink) open(fromLink);
}
