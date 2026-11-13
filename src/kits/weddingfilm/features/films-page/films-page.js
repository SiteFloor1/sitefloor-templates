// @ts-check
/** The films: a film loads only when its Play is pressed (the still shows until then); venue chips show that venue's films. */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  for (const btn of /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-fp-play]")])) {
    const box = btn.closest(".wf-fl-media"), vid = /** @type {HTMLVideoElement|null} */ (box?.querySelector("video") ?? null);
    if (!box || !vid) continue;
    btn.addEventListener("click", () => {
      vid.src = vid.dataset.src ?? "";
      vid.hidden = false;
      btn.hidden = true;
      box.classList.add("on");
      vid.play().catch(() => { /* the controls are there to press */ });
      vid.focus();
    });
  }
  const bar = /** @type {HTMLElement|null} */ (root.querySelector("[data-fp-venues]"));
  if (!bar) return;
  const chips = /** @type {HTMLButtonElement[]} */ ([...bar.querySelectorAll("[data-venue]")]);
  const items = /** @type {HTMLElement[]} */ ([...root.querySelectorAll(".wf-fl")]);
  for (const c of chips) c.addEventListener("click", () => {
    const want = c.dataset.venue ?? "";
    for (const x of chips) x.setAttribute("aria-pressed", String(x === c));
    for (const it of items) it.hidden = !!want && it.dataset.venue !== want;
  });
}
