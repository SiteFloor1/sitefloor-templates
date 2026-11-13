// @ts-check
/** Your matter, by code: reads the code (from the box or the link after #) and shows the stage from the provider. */
import { cleanMatterCode } from "../../lib/matter.js";

const WHY = {
  unknown: "We can't find that code. Check it against our letter, or call us and we will tell you where your matter has reached.",
  stale: "We haven't updated this for a while, so it may be out of date. Please call us for the latest.",
  unreadable: "This isn't loading right now. Please call us and we will tell you where your matter has reached.",
};

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const provider = ctx.providers.matter;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("#mc-form"));
  const input = /** @type {HTMLInputElement|null} */ (root.querySelector("#mc-code"));
  const out = /** @type {HTMLElement|null} */ (root.querySelector("#mc-out"));
  const off = /** @type {HTMLElement|null} */ (root.querySelector("#mc-off"));
  if (!provider || !form || !input || !out || !off) throw new Error("matter code markup or provider missing");
  const ago = (/** @type {number} */ ms) => { const h = Math.round(ms / 3_600_000); return h < 1 ? "within the hour" : h < 24 ? `${h} hour${h === 1 ? "" : "s"} ago` : h < 48 ? "yesterday" : `${Math.round(h / 24)} days ago`; };
  /** @param {string} raw */
  const open = async (raw) => {
    const code = cleanMatterCode(raw);
    if (!code) { input.setCustomValidity("Codes are 8 to 12 letters and numbers."); input.reportValidity(); return; }
    input.setCustomValidity(""); input.value = code;
    if (location.hash.slice(1) !== code) history.replaceState(null, "", `#${code}`);
    /** @type {any} */ let r;
    try { r = await provider.load(ctx, code); } catch { r = { ok: false, reason: "unreadable" }; }
    if (!r.ok) { out.hidden = true; off.hidden = false; off.textContent = WHY[/** @type {"unknown"|"stale"|"unreadable"} */ (r.reason)] ?? WHY.unreadable; return; }
    off.hidden = true; out.hidden = false;
    for (const li of /** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll("[data-mc-stage]"))) {
      const i = Number(li.dataset.mcStage);
      li.classList.toggle("done", i < r.stage); li.classList.toggle("now", i === r.stage);
      if (i === r.stage) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    }
    /** @type {HTMLElement} */ (root.querySelector("[data-mc-upd]")).textContent = `Updated ${ago(Date.now() - r.updatedAt)}.`;
  };
  form.addEventListener("submit", (e) => { e.preventDefault(); open(input.value); });
  input.addEventListener("input", () => input.setCustomValidity(""));
  root.querySelector("[data-mc-try]")?.addEventListener("click", (e) => open(/** @type {HTMLElement} */ (e.currentTarget).dataset.mcTry ?? ""));
  root.setAttribute("data-ready", "");
  const fromLink = cleanMatterCode(decodeURIComponent(location.hash.slice(1)));
  if (fromLink) open(fromLink);
}
