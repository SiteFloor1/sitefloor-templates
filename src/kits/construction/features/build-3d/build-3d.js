// @ts-check
/** The build in 3D: loads the same house as the visualiser on tap and shows the stage chosen in the list. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const stages = /** @type {any} */ (ctx.data).build?.stages;
  const tryBtn = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-b3-try]"));
  const canvas = /** @type {HTMLCanvasElement|null} */ (root.querySelector("[data-b3-canvas]"));
  const status = /** @type {HTMLElement|null} */ (root.querySelector("[data-b3-status]"));
  if (!stages || !tryBtn || !canvas || !status) throw new Error("build 3D markup or config missing");
  /** @type {any} */ let model = null;
  let at = stages.length - 1;
  const buttons = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-b3-step]")]);
  const show = () => {
    buttons.forEach((b, i) => b.setAttribute("aria-pressed", String(i === at)));
    model?.set({ phase: stages[at].model, show: "after" });
  };
  for (const b of buttons) b.addEventListener("click", () => { at = Number(b.dataset.b3Step); show(); if (!model) tryBtn.click(); });
  tryBtn.addEventListener("click", async () => {
    let ok;
    try { ok = !!(canvas.getContext("webgl2") || canvas.getContext("webgl")); } catch { ok = false; }
    if (!ok) { tryBtn.disabled = true; status.hidden = false; status.textContent = "3D isn't available on this device or browser. The stages are listed beside it."; return; }
    tryBtn.disabled = true; status.hidden = false; status.textContent = "Loading the model…";
    try {
      const { createHouse } = await import("../visualiser/house-3d.js");
      canvas.hidden = false;
      model = createHouse(canvas, { house: "semi", depth: 4.5, roof: "lantern", show: "after", phase: stages[at].model }, { reduceMotion: matchMedia("(prefers-reduced-motion: reduce)").matches });
      tryBtn.hidden = true; status.hidden = true; root.dataset.live = "";
      /** @type {any} */ (canvas).sfModel = model;
    } catch (err) {
      console.error("[sitefloor] the 3D build didn't load", err);
      tryBtn.disabled = false; status.textContent = "The 3D model didn't load. Check the connection and tap again.";
    }
  });
}
