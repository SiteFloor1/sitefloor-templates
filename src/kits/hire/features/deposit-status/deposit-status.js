// @ts-check
/** Where's my deposit: by reference only, from the client's Sheet. Fails closed: "ask us" when it can't be read. */
import { cleanRef, DEPOSIT_WORDS, DEPOSIT_STAGES } from "../../lib/sheet.js";
import { longDate } from "../../lib/words.js";

const REFRESH_MS = 20_000;

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const form = /** @type {HTMLFormElement} */ (root.querySelector("[data-dep-form]"));
  const input = /** @type {HTMLInputElement} */ (root.querySelector("[data-dep-ref]"));
  const out = /** @type {HTMLElement} */ (root.querySelector("[data-dep-out]"));
  const steps = [...root.querySelectorAll("[data-step]")];
  const provider = ctx.providers.fleet;
  /** @type {ReturnType<typeof setInterval>|undefined} */ let timer;
  const show = async (/** @type {string} */ ref) => {
    if (!provider) return;
    const r = await provider.deposit(ctx, ref).catch(() => ({ ok: false, reason: "error" }));
    for (const li of steps) { delete /** @type {HTMLElement} */ (li).dataset.state; const d = li.querySelector("[data-step-date]"); if (d) d.textContent = ""; }
    if (!r.ok) {
      out.textContent = r.reason === "unknown" ? `We can't find ${ref} on our sheet. Check the reference in our message, or ask us.` : "We couldn't read our sheet just now. Ask us on WhatsApp and we'll tell you.";
      return;
    }
    steps.forEach((li, i) => { /** @type {HTMLElement} */ (li).dataset.state = i < r.stage ? "done" : i === r.stage ? "now" : "next"; });
    const d = steps[r.stage]?.querySelector("[data-step-date]"); if (d) d.textContent = longDate(r.date);
    out.textContent = `${ref}: ${DEPOSIT_WORDS[DEPOSIT_STAGES[r.stage]].toLowerCase()} on ${longDate(r.date)}.`;
  };
  const go = () => {
    const ref = cleanRef(input.value);
    if (!ref) return;
    try { history.replaceState(null, "", `?ref=${encodeURIComponent(ref)}`); } catch { /* file preview */ }
    show(ref);
    clearInterval(timer);
    timer = setInterval(() => { if (!document.hidden) show(ref); }, REFRESH_MS);
  };
  form.addEventListener("submit", (e) => { e.preventDefault(); go(); });
  const fromUrl = new URLSearchParams(location.search).get("ref");
  if (fromUrl) { input.value = cleanRef(fromUrl); go(); }
}
