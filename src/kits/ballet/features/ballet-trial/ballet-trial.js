// @ts-check
/**
 * The trial request. On the home page it follows the class picked in the finder (ctx.watch "balletPick"). On the trial
 * page the parent picks the age and the day here, and the request names that class and that session.
 */
import { ageGroups, trialText, sessionWords, lengthWords, weekOrder } from "../../lib/ballet.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const classes = /** @type {any} */ (ctx.data).classes;
  const ask = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-bt-trial]"));
  if (!classes || !ask) throw new Error("trial markup or data missing");
  /** @param {string} text */
  const point = (text) => { ask.href = ctx.bookHref(text); if (ask.dataset.waText !== undefined) ask.dataset.waText = text; };

  const pickers = root.querySelector("[data-bt-pickers]");
  if (!pickers) { ctx.watch("balletPick", (p) => point(trialText(classes.message, p))); return; }

  const groups = ageGroups(classes.items);
  const ages = /** @type {HTMLButtonElement[]} */ ([...pickers.querySelectorAll("[data-tgroup]")]);
  const days = /** @type {HTMLElement} */ (pickers.querySelector("[data-bt-days]"));
  const chosen = /** @type {HTMLElement} */ (pickers.querySelector("[data-bt-chosen]"));
  let gi = Math.max(0, ages.findIndex((b) => b.getAttribute("aria-pressed") === "true"));
  let di = 0;
  const draw = () => {
    ages.forEach((b, i) => b.setAttribute("aria-pressed", String(i === gi)));
    const g = groups[gi];
    const sessions = g.classes.flatMap((c) => weekOrder(c.sessions).map((s) => ({ c, s })));
    di = Math.min(di, sessions.length - 1);
    days.replaceChildren(...sessions.map(({ s }, i) => {
      const b = Object.assign(document.createElement("button"), { type: "button", textContent: sessionWords(s) });
      b.setAttribute("aria-pressed", String(i === di));
      b.addEventListener("click", () => { di = i; draw(); });
      return b;
    }));
    const { c, s } = sessions[di];
    chosen.textContent = `${c.name}, ${lengthWords(c.minutes)}`;
    point(trialText(classes.message, { ages: g.ages, name: c.name, when: sessionWords(s) }));
  };
  ages.forEach((b, i) => b.addEventListener("click", () => { gi = i; di = 0; draw(); }));
  draw();
}
