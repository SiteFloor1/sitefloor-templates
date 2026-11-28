// @ts-check
/**
 * HOL-2: choosing a region shows its rules. Every panel is in the page already; this only shows one. The build marks a
 * line "due a fresh check" six months after it was checked; a site that hasn't been rebuilt since gets the same
 * check here, on the visitor's day.
 */
import { rulesState } from "../../lib/rules.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const today = ctx.now().date;
  for (const li of /** @type {HTMLElement[]} */ ([...root.querySelectorAll("li[data-checked]")])) {
    if (rulesState({ checked: li.dataset.checked ?? "" }, today) === "current") continue;
    const a = li.querySelector("a[data-source]");
    if (!a) continue;
    const p = document.createElement("p"); p.className = "st-rl-s";
    const link = document.createElement("a"); link.href = a.getAttribute("href") ?? ""; link.rel = "noopener";
    link.textContent = `Read it on ${a.getAttribute("data-source")}`;
    p.append("This line is due a fresh check. ", link, ".");
    li.replaceChildren(p); li.removeAttribute("data-checked");
  }
  const btns = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-st-region]")]);
  const panels = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-st-panel]")]);
  for (const b of btns) b.addEventListener("click", () => {
    for (const x of btns) x.setAttribute("aria-pressed", String(x === b));
    for (const p of panels) p.hidden = p.dataset.stPanel !== b.dataset.stRegion;
  });
}
