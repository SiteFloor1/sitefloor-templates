// @ts-check
/**
 * Right now: walk-in tables from the restaurant's sheet (hidden when older than staleAfterMinutes), the
 * kitchen line and an "on our way" WhatsApp with the party size.
 */
import { TABLE_WORDS, ago } from "../../lib/tonight.js";
import { kitchenLine } from "../../lib/sittings.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  /** @type {import("../specials/sheet-provider.js").TonightProvider|null} */
  const provider = ctx.providers.tonight;
  const tables = root.querySelector("[data-tn-tables]"), kitchen = root.querySelector("[data-tn-kitchen]"), note = root.querySelector("[data-tn-note]");
  const off = /** @type {HTMLElement|null} */ (root.querySelector("[data-tn-off]")), size = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-tn-size]"));
  const go = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-tn-go]"));
  if (!provider || !tables || !kitchen || !note || !off || !size || !go) throw new Error("tonight markup or provider missing");
  const sittings = /** @type {any} */ (ctx.data).sittings ?? [];
  const wa = () => {
    const n = size.value === "8" ? "8 or more" : size.value;
    go.href = ctx.waHref(`Hi, we're on our way for a walk-in: ${n} ${n === "1" ? "person" : "people"}, there in about 15 minutes. Is that OK?`);
  };
  size.addEventListener("change", wa);
  wa();
  /** @param {import("../../lib/tonight.js").Tonight} r */
  const paint = (r) => {
    const k = kitchenLine(sittings, ctx.now());
    const kt = k.text.replace(/^[^·]+· /, "");
    kitchen.textContent = kt.charAt(0).toUpperCase() + kt.slice(1);
    kitchen.setAttribute("data-state", k.state);
    if (!r.ok || !r.tables) {
      tables.textContent = "Ask us";
      tables.removeAttribute("data-state");
      note.textContent = r.ok ? "We haven't updated the walk-in line lately." : "";
      off.hidden = false;
      return;
    }
    tables.textContent = TABLE_WORDS[r.tables.state];
    tables.setAttribute("data-state", r.tables.state);
    note.textContent = [r.tables.note, `Updated ${ago(Date.now() - r.tables.updatedAt)}`].filter(Boolean).join(". ");
    off.hidden = true;
  };
  ctx.watch("tonight", paint);
  // On a site without the specials feature, load the sheet here.
  if (!document.querySelector('[data-feature="specials"]')) {
    const load = () => provider.load(ctx).then((r) => ctx.share("tonight", r), () => ctx.share("tonight", { ok: false }));
    load();
    ctx.everyMinute(load);
  }
}
