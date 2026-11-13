// @ts-check
/**
 * Your film's progress: the code typed (or in the link's #hash, which never reaches a server) is looked up in the
 * studio's sheet through a provider. Fails closed: an unknown code or an unreadable or stale sheet shows only why.
 */
import { cleanCode } from "../../lib/couples.js";
import { ukDate } from "../../../../core/lib/diary.js";

/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx, code: string) => Promise<import("../../lib/couples.js").Progress> }} ProgressProvider */

const REASONS = {
  short: "Codes are six letters or numbers or more. It's in the message we sent you.",
  unknown: "We don't recognise that code. Check it against our message, or ask us on WhatsApp.",
  stale: "We're updating our records. Try again later today, or ask us on WhatsApp.",
  unreadable: "We can't reach our records just now. Try again in a moment.",
};

/** @param {import("../../lib/couples.js").Part} p @param {string} done */
const said = (p, done) => (p.state === "delivered" ? done : p.state === "due" ? `Due ${ukDate(p.date)}` : "Date to follow");

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const form = root.querySelector("[data-pg-form]"), input = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-pg-code]"));
  const msg = root.querySelector("[data-pg-msg]"), out = /** @type {HTMLElement|null} */ (root.querySelector("[data-pg-out]"));
  const title = root.querySelector("[data-pg-title]"), note = /** @type {HTMLElement|null} */ (root.querySelector("[data-pg-note]"));
  const steps = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-pg-stage]")]);
  if (!form || !input || !msg || !out || !title || !note || steps.length !== 5) throw new Error("film progress markup missing");
  /** @type {ProgressProvider|undefined} */ const provider = ctx.providers.progress;
  const show = async (/** @type {string} */ raw) => {
    out.hidden = true; msg.textContent = "Looking…";
    const p = provider ? await provider.load(ctx, raw).catch(() => /** @type {const} */ ({ ok: false, reason: "unreadable" })) : /** @type {const} */ ({ ok: false, reason: "unreadable" });
    if (!p.ok) { msg.textContent = REASONS[p.reason]; return; }
    msg.textContent = "";
    title.textContent = p.wedding ? `Your wedding, ${ukDate(p.wedding)}` : "Your wedding";
    steps.forEach((li, i) => { li.dataset.state = i < p.stage ? "done" : i === p.stage ? "now" : "next"; if (i === p.stage) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current"); });
    const t = root.querySelector('[data-pg-part="trailer"] [data-pg-state]');
    if (t) t.textContent = said(p.trailer, "Delivered");
    const ph = /** @type {HTMLElement|null} */ (root.querySelector('[data-pg-part="photographs"]'));
    if (ph) { ph.hidden = !p.photographs; const d = ph.querySelector("[data-pg-state]"); if (d && p.photographs) d.textContent = said(p.photographs, "Delivered"); }
    note.hidden = !p.note; note.textContent = p.note;
    out.hidden = false;
  };
  form.addEventListener("submit", (e) => { e.preventDefault(); const code = cleanCode(input.value); if (code) { history.replaceState(null, "", `#${code}`); show(code); } });
  const fromHash = cleanCode(decodeURIComponent(location.hash.slice(1)));
  if (fromHash) { input.value = fromHash; show(fromHash); }
}
