// @ts-check
/**
 * Your car, in the bay: a code from the booking text opens one car from the studio's sheet (simulated on a demo).
 * The rail lights up to the car's stage; the note, the facts and the photo fill boxes already the right size. An
 * unknown code, a stale sheet or one that can't be read shows a plain sentence and no stage. On the your-car page a
 * code in the address (your-car#CODE) opens straight away; on a demo the example code does.
 */
import { stageStates, updatedAgo, normaliseCode } from "../../lib/progress.js";

/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx, code: string) => Promise<import("../../lib/progress.js").Lookup> }} ProgressProvider */

const SAY = {
  unknown: "That code isn't on our list. Check the booking text, or message us.",
  stale: "We haven't updated this for a while. Message us and we'll tell you where it is.",
  unreadable: "We can't show this right now. Message us and we'll tell you where it is.",
};

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).detailing.progress;
  const provider = /** @type {ProgressProvider|null} */ (ctx.providers.carProgress);
  const q = (/** @type {string} */ s) => /** @type {HTMLElement} */ (root.querySelector(s));
  const form = q("[data-cp-form]"), input = /** @type {HTMLInputElement} */ (q("[data-cp-code]")), note = q("[data-cp-note]"), when = q("[data-cp-when]");
  const facts = q("[data-cp-facts]"), photo = /** @type {HTMLImageElement} */ (q("[data-cp-photo]")), cap = q("[data-cp-cap]");
  if (!cfg || !provider || !form || !input || !note || !photo) throw new Error("car progress markup or data missing");
  const studio = { src: photo.src, alt: photo.alt, cap: cap.textContent };
  const rail = (/** @type {string} */ stage, /** @type {string} */ name) => {
    for (const st of stageStates(cfg.stages, stage, name)) {
      const li = /** @type {HTMLElement|null} */ (root.querySelector(`[data-st="${st.id}"]`));
      if (!li) continue;
      li.className = `dt-st is-${st.state}`;
      if (st.state === "now") li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
      const n = li.querySelector("[data-st-name]"), w = li.querySelector("[data-st-w]");
      if (n) n.textContent = st.name;
      if (w) w.textContent = st.state === "done" ? "Done" : st.state === "now" ? "Today" : " ";
    }
  };
  const reset = () => { rail("", ""); facts.hidden = true; photo.src = studio.src; photo.alt = studio.alt; cap.textContent = studio.cap; when.textContent = " "; };
  const open = async (/** @type {string} */ raw) => {
    const code = normaliseCode(raw);
    if (!code) return;
    input.value = code;
    note.textContent = "Looking…";
    const r = await provider.load(ctx, code).catch(() => /** @type {const} */ ({ ok: false, reason: "unreadable" }));
    if (!r.ok) { reset(); note.textContent = SAY[r.reason]; return; }
    const car = r.car;
    rail(car.stage, car.stageName);
    note.textContent = car.note || `${car.stageName}.`;
    when.textContent = `${updatedAgo(car.updated, Date.now())}${cfg.example === code ? ". Example for the demo." : ""}`;
    q("[data-cp-car]").textContent = car.car || "—";
    q("[data-cp-work]").textContent = car.work || "—";
    q("[data-cp-hand]").textContent = car.handover || "We'll tell you";
    facts.hidden = false;
    if (car.photo) { photo.src = car.photo; photo.alt = `${car.car || "Your car"} in the bay today`; cap.textContent = cfg.example === code ? "Today in the bay. Example photograph for the demo." : "Today in the bay."; }
  };
  form.addEventListener("submit", (e) => { e.preventDefault(); open(input.value); });
  const fromHash = normaliseCode(decodeURIComponent(location.hash.slice(1)));
  if (document.body.dataset.page === "your-car" && fromHash) open(fromHash);
  else if (cfg.example) open(cfg.example);
}
