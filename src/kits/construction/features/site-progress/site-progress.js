// @ts-check
/** Your house, this week: reads the code (the box, ?code= from the home page's strip, or #code in the builder's link). */
import { cleanCode, agoWords } from "../../lib/progress.js";

const WHY = {
  unknown: "We can't find that code. Check it against our message, or call us and your project manager will tell you where the build has reached.",
  stale: "We haven't updated this for a while, so it may be out of date. Please call us for the latest.",
  unreadable: "This isn't loading right now. Please call us and your project manager will tell you where the build has reached.",
};

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const provider = ctx.providers.siteProgress;
  const cfg = /** @type {any} */ (ctx.data).build?.progress;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("#sp-form"));
  const input = /** @type {HTMLInputElement|null} */ (root.querySelector("#sp-code"));
  const out = /** @type {HTMLElement|null} */ (root.querySelector("#sp-out"));
  const off = /** @type {HTMLElement|null} */ (root.querySelector("#sp-off"));
  if (!provider || !cfg || !form || !input || !out || !off) throw new Error("site progress markup or provider missing");
  const q = (/** @type {string} */ s) => /** @type {HTMLElement} */ (root.querySelector(s));
  /** @param {string} raw */
  const open = async (raw) => {
    const code = cleanCode(raw);
    if (!code) { input.setCustomValidity("Site codes are 8 to 12 letters and numbers."); input.reportValidity(); return; }
    input.setCustomValidity(""); input.value = code;
    history.replaceState(null, "", `${location.pathname}#${code}`);
    /** @type {any} */ let r;
    try { r = await provider.load(ctx, code); } catch { r = { ok: false, reason: "unreadable" }; }
    if (!r.ok) { out.hidden = true; off.hidden = false; off.textContent = WHY[/** @type {"unknown"|"stale"|"unreadable"} */ (r.reason)] ?? WHY.unreadable; return; }
    off.hidden = true; out.hidden = false;
    const names = cfg.stages.map((/** @type {string} */ _s, /** @type {number} */ i) => q(`[data-sp-stage="${i}"] span`)?.textContent ?? "");
    for (const li of /** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll("[data-sp-stage]"))) {
      const i = Number(li.dataset.spStage);
      li.classList.toggle("done", i <= r.stage);
      if (i === r.stage) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    }
    q("[data-sp-when]").textContent = `Updated ${agoWords(Date.now() - r.updatedAt)}`;
    q("[data-sp-done]").textContent = r.done || names[r.stage];
    q("[data-sp-stage-name]").textContent = `${names[r.stage]} · stage ${r.stage + 1} of ${cfg.stages.length}`;
    const next = q("[data-sp-next]"); next.hidden = !r.next; next.textContent = r.next ? `Next: ${r.next}` : "";
    const img = /** @type {HTMLImageElement} */ (q("[data-sp-photo]"));
    img.hidden = !r.photo; if (r.photo) img.src = r.photo; else img.removeAttribute("src");
    out.classList.toggle("has-photo", !!r.photo);
  };
  form.addEventListener("submit", (e) => { e.preventDefault(); open(input.value); });
  input.addEventListener("input", () => input.setCustomValidity(""));
  root.querySelector("[data-sp-try]")?.addEventListener("click", (e) => open(/** @type {HTMLElement} */ (e.currentTarget).dataset.spTry ?? ""));
  const fromLink = cleanCode(new URLSearchParams(location.search).get("code") ?? "") || cleanCode(decodeURIComponent(location.hash.slice(1)));
  if (fromLink) open(fromLink);
}
