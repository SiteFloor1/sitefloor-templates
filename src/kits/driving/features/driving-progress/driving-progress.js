// @ts-check
/**
 * Learner progress (DRIVE-5): a code opens the learner's card from the instructor's sheet. Nothing is stored in the
 * browser; a wrong code, an unknown one or a stale sheet says so in a sentence.
 * @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx, code: string) => Promise<import("../../lib/driving.js").Progress> }} ProgressProvider
 */
import { LEVELS } from "../../lib/driving.js";

const MSG = {
  code: "A learner code is 6 to 12 letters and numbers, like the one your instructor gave you.",
  unknown: "That code isn't on the sheet. Check it with your instructor.",
  sheet: "Your card isn't up to date right now. Ask your instructor after your next lesson.",
};

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).driving.progress;
  const provider = /** @type {ProgressProvider|null} */ (ctx.providers.drivingProgress);
  const $ = (/** @type {string} */ s) => /** @type {HTMLElement} */ (root.querySelector(s));
  const form = /** @type {HTMLFormElement} */ ($("[data-dg-form]"));
  const input = /** @type {HTMLInputElement} */ ($("[data-dg-code]"));
  const msg = $("[data-dg-msg]"), card = $("[data-dg-card]");
  const open = async (/** @type {string} */ code) => {
    const r = provider ? await provider.load(ctx, code).catch(() => ({ ok: /** @type {const} */ (false), reason: /** @type {const} */ ("sheet") })) : { ok: /** @type {const} */ (false), reason: /** @type {const} */ ("sheet") };
    if (!r.ok) { card.hidden = true; msg.textContent = MSG[r.reason]; return; }
    const L = r.learner;
    const when = new Date(r.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: ctx.data.hours.timezone });
    $("[data-dg-who]").textContent = `${L.lessons} ${L.lessons === 1 ? "lesson" : "lessons"} · updated ${when}${cfg.example && code === cfg.example ? " · sample learner" : ""}`;
    $("[data-dg-skills]").replaceChildren(...L.skills.map((s) => {
      const li = document.createElement("li"), lv = document.createElement("span");
      li.textContent = s.skill;
      lv.textContent = s.level ? LEVELS[s.level - 1] : "Not started";
      lv.setAttribute("data-l", String(s.level));
      li.append(lv);
      return li;
    }));
    const last = L.last ? new Date(`${L.last}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }) : null;
    $("[data-dg-last]").textContent = L.covered ? `${last ? `Last lesson, ${last}: ` : "Last lesson: "}${L.covered}` : "";
    $("[data-dg-practise]").textContent = L.practise ? `To practise before the next one: ${L.practise}` : "";
    msg.textContent = "";
    card.hidden = false;
  };
  form.addEventListener("submit", (e) => { e.preventDefault(); open(input.value); });
  root.querySelector("[data-dg-example]")?.addEventListener("click", () => { input.value = cfg.example; open(cfg.example); });
}
