// @ts-check
/** Ready to Pass? (DRIVE-3): five answers, then the verdict in the instructor's words. Nothing is stored. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).driving.ready;
  const rows = [...root.querySelectorAll(".dv-checks li")];
  const verdict = /** @type {HTMLElement} */ (root.querySelector("[data-dr-verdict]"));
  const paint = () => {
    const ans = rows.map((li) => li.querySelector('[aria-pressed="true"]')?.getAttribute("data-dr") ?? null);
    const no = ans.filter((a) => a === "no").length, yes = ans.filter((a) => a === "yes").length;
    if (no) verdict.textContent = `${no === 1 ? "One thing" : `${no} things`} to work on first. ${cfg.notYet}`;
    else if (yes === rows.length) verdict.textContent = cfg.yes;
    else verdict.textContent = yes ? `${yes} of ${rows.length} so far.` : "";
  };
  rows.forEach((li) => li.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
    li.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    li.setAttribute("data-a", /** @type {string} */ (b.getAttribute("data-dr")));
    paint();
  })));
}
