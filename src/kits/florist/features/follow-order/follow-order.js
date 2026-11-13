// @ts-check
/**
 * Follow your order: reads the reference from the link (your-order#AMB4K7) or the box, asks the provider (the
 * florist's Sheet on client sites, a simulation on the demo) and checks again every two minutes while the page is
 * visible. Unknown, stale or unreadable: "message us", never a guess.
 */
import { agoLabel, cleanRef } from "../../lib/track.js";

const EVERY_MS = 120_000;
const WHY = {
  unknown: "We can't find that reference. Check it against our message, or message us and we'll tell you where your flowers are.",
  stale: "We haven't updated this for a while, so it may be out of date. Message us and we'll tell you where your flowers are.",
  unreadable: "Your order isn't loading right now. Message us and we'll tell you where your flowers are.",
};

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  /** @type {import("./sheet-provider.js").FloristProvider|null} */
  const provider = ctx.providers.florist;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-track-form]"));
  const input = /** @type {HTMLInputElement|null} */ (root.querySelector("#track-ref"));
  const card = /** @type {HTMLElement|null} */ (root.querySelector("[data-track-card]"));
  const off = /** @type {HTMLElement|null} */ (root.querySelector("[data-track-off]"));
  if (!provider || !form || !input || !card || !off) throw new Error("follow your order: markup or provider missing");
  const $ = (/** @type {string} */ s) => /** @type {HTMLElement} */ (root.querySelector(s));
  let ref = "", timer = 0, lastPhoto = "";

  /** @param {import("../../lib/track.js").Order | import("../../lib/track.js").NoResult} r */
  const show = (r) => {
    if (!r.ok) {
      card.hidden = true; off.hidden = false;
      $("[data-track-why]").textContent = WHY[r.reason];
      /** @type {HTMLAnchorElement} */ ($("[data-track-ask]")).href = ctx.waHref(`Hello, where are my flowers? My reference is ${ref}.`);
      return;
    }
    off.hidden = true; card.hidden = false;
    const last = r.stage === root.querySelectorAll("[data-track-step]").length - 1;
    for (const li of root.querySelectorAll("[data-track-step]")) {
      const i = Number(/** @type {HTMLElement} */ (li).dataset.trackStep);
      li.classList.toggle("done", i < r.stage || (last && i === r.stage));
      li.classList.toggle("now", i === r.stage && !last);
      if (i === r.stage) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    }
    $("[data-track-upd]").textContent = `Updated ${agoLabel(Date.now() - r.updatedAt)}`;
    const note = $("[data-track-note]"); note.hidden = !r.note; note.textContent = r.note;
    const fig = $("[data-track-fig]"), img = /** @type {HTMLImageElement} */ ($("[data-track-photo]"));
    fig.hidden = !r.photo;
    if (r.photo && r.photo !== lastPhoto) { img.src = r.photo; lastPhoto = r.photo; }
  };
  const check = () => {
    if (!ref || document.hidden) return;
    provider.order(ctx, ref).then(show, () => show({ ok: false, reason: "unreadable" }));
  };
  /** @param {string} raw */
  const open = (raw) => {
    const c = cleanRef(raw);
    if (!c) { input.setCustomValidity("References are 4 to 10 letters and numbers."); input.reportValidity(); return; }
    input.setCustomValidity("");
    ref = c; input.value = c;
    if (location.hash.slice(1) !== c) history.replaceState(null, "", `#${c}`);
    check();
    clearInterval(timer); timer = window.setInterval(check, provider.every ?? EVERY_MS);
  };
  form.addEventListener("submit", (e) => { e.preventDefault(); open(input.value); });
  input.addEventListener("input", () => input.setCustomValidity(""));
  document.addEventListener("visibilitychange", check);
  const fromLink = cleanRef(decodeURIComponent(location.hash.slice(1)));
  if (fromLink) open(fromLink);
}
