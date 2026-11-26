// @ts-check
/**
 * The class finder: a tap on an age group shows its classes (days, times, length), points "Ask for a trial" at that
 * class, and tells the page which class was picked (ctx.share "balletPick") so the trial section below asks for it too.
 */
import { ageGroups, sessionsWords, lengthWords, trialText, weekOrder, placeKey, sessionWords } from "../../lib/ballet.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).classes;
  const answer = /** @type {HTMLElement|null} */ (root.querySelector("[data-bt-answer]"));
  const ask = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-bt-trial]"));
  const buttons = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-group]")]);
  if (!cfg || !answer || !ask || !buttons.length) throw new Error("class finder markup or data missing");
  const groups = ageGroups(cfg.items);
  const withPlaces = Boolean(/** @type {any} */ (ctx.data).places);

  /** @param {number} i @param {boolean} paint */
  const pick = (i, paint) => {
    const g = groups[i];
    if (!g) return;
    buttons.forEach((b, j) => b.setAttribute("aria-pressed", String(i === j)));
    const first = g.classes[0];
    const text = trialText(cfg.message, { ages: g.ages, name: first.name, when: sessionsWords(first.sessions) });
    ask.href = ctx.bookHref(text);
    if (ask.dataset.waText !== undefined) ask.dataset.waText = text;
    if (paint) {
      answer.replaceChildren(...g.classes.map((c) => {
        const p = Object.assign(document.createElement("p"), { className: "bt-class" });
        p.append(Object.assign(document.createElement("b"), { textContent: c.name }), " ",
          Object.assign(document.createElement("span"), { textContent: `${sessionsWords(c.sessions)} · ${lengthWords(c.minutes)}` }));
        if (withPlaces) for (const s of weekOrder(c.sessions)) {
          const pl = Object.assign(document.createElement("span"), { className: "bt-pl", hidden: true });
          pl.dataset.pk = placeKey(c.id, s); pl.dataset.pkWhen = sessionWords(s);
          if (c.sessions.length > 1) pl.dataset.pkLabel = sessionWords(s);
          p.append(pl);
        }
        return p;
      }));
      ctx.share("balletAnswered", Date.now());
    }
    ctx.share("balletPick", { ages: g.ages, name: first.name, when: sessionsWords(first.sessions) });
  };
  buttons.forEach((b, i) => b.addEventListener("click", () => pick(i, true)));
  pick(Math.max(0, buttons.findIndex((b) => b.getAttribute("aria-pressed") === "true")), false);
}
