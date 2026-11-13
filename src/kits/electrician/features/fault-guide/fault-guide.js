// @ts-check
/**
 * The fault guide: one choice at a time; the list of what to tell us follows it, and the WhatsApp message carries the
 * choice so the client knows what they're walking into. Never a repair instruction.
 */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).faultGuide;
  const picks = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-case]")]);
  const tells = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-tell]")]);
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-fault-send]"));
  if (!cfg || !picks.length || !send) throw new Error("fault guide markup missing");
  /** @param {string} id */
  const choose = (id) => {
    const c = cfg.cases.find((/** @type {any} */ x) => x.id === id);
    for (const p of picks) p.setAttribute("aria-checked", String(p.dataset.case === id));
    for (const t of tells) {
      t.classList.toggle("on", t.dataset.tell === id);
      const h = t.querySelector("h3");
      if (h) h.textContent = "What to tell us when you call";
    }
    send.href = ctx.waHref(`${cfg.message}\n\nWhat's happening: ${c?.label ?? ""}.`);
  };
  picks.forEach((p, i) => {
    p.addEventListener("click", () => choose(p.dataset.case ?? ""));
    p.addEventListener("keydown", (e) => {
      const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      const next = picks[(i + step + picks.length) % picks.length];
      next.focus(); choose(next.dataset.case ?? "");
    });
  });
  for (const p of picks) p.tabIndex = p.getAttribute("aria-checked") === "true" ? 0 : -1;
  root.addEventListener("click", () => { for (const p of picks) p.tabIndex = p.getAttribute("aria-checked") === "true" ? 0 : -1; });
  choose(picks[0].dataset.case ?? "");
}
