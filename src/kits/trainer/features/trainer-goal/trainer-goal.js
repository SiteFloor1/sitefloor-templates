// @ts-check
/** Goal finder (PT-3): the answers pick the trainer's programme and lay out a sample week; the message says it all. */
import { sampleWeek } from "../../lib/trainer.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).trainer.goal;
  const q = (/** @type {string} */ s) => /** @type {HTMLElement} */ (root.querySelector(s));
  const prog = /** @type {HTMLAnchorElement} */ (q("[data-tg-prog]")), line = q("[data-tg-line]"), week = q("[data-tg-week]");
  const level = q("[data-tg-level]"), inj = q("[data-tg-inj]"), go = /** @type {HTMLAnchorElement} */ (q("[data-tg-go]"));
  if (!prog || !week || !go) throw new Error("goal finder markup missing");
  const base = prog.getAttribute("href")?.replace(/programme-[a-z0-9-]+/, "programme-{id}") ?? "";
  /** @type {Record<string, string>} */
  const pick = {};
  root.querySelectorAll("[data-tg]").forEach((grp) => { pick[/** @type {HTMLElement} */ (grp).dataset.tg ?? ""] = /** @type {HTMLElement|null} */ (grp.querySelector('[aria-pressed="true"]'))?.dataset.v ?? ""; });

  const paint = () => {
    root.querySelectorAll("[data-tg]").forEach((grp) => grp.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === pick[/** @type {HTMLElement} */ (grp).dataset.tg ?? ""]))));
    const goal = cfg.goals.find((/** @type {any} */ x) => x.id === pick.goal) ?? cfg.goals[0];
    const p = cfg.programmes.find((/** @type {any} */ x) => x.id === goal.programme);
    const lv = cfg.levels.find((/** @type {any} */ x) => x.id === pick.level) ?? cfg.levels[0];
    const days = Number(pick.days) || 2;
    prog.textContent = p.name;
    prog.href = base.replace("{id}", p.id);
    line.textContent = p.line;
    week.innerHTML = sampleWeek(days, p.sessions).map((s) => `<li><span>${s.day}</span>${s.focus.replace(/[<&]/g, "")}</li>`).join("");
    level.textContent = lv.text;
    inj.hidden = pick.injury !== "yes";
    const text = `${cfg.message} ${goal.label}; ${lv.label.toLowerCase()}; ${days} ${days === 1 ? "day" : "days"} a week${pick.injury === "yes" ? "; I have an injury or condition to tell you about" : ""}.`;
    go.href = ctx.bookHref(text);
    if (go.dataset.waText !== undefined) go.dataset.waText = text;
  };
  root.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement} */ (e.target).closest("[data-tg] button");
    if (!(b instanceof HTMLElement)) return;
    pick[/** @type {HTMLElement} */ (b.closest("[data-tg]")).dataset.tg ?? ""] = b.dataset.v ?? "";
    paint();
  });
  paint();
}
