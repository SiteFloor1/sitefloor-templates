// @ts-check
/**
 * Places left per class: reads the school's sheet (or the demo's simulation) once, then marks every session on the page
 * that carries data-pk, and again whenever the finder redraws its answer. Fails closed: if the sheet can't be read or is
 * old, nothing is shown, never a number that may be wrong. "Full" links to a waiting-list message.
 */
import { placesWords } from "../../lib/ballet.js";

/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx) => Promise<import("../../lib/ballet.js").PlacesResult> }} PlacesProvider */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).places;
  /** @type {PlacesProvider|null} */
  const provider = ctx.providers.balletPlaces;
  if (!cfg || !provider) throw new Error("places data or provider missing");
  /** @type {import("../../lib/ballet.js").PlacesResult|null} */
  let result = null;
  const paint = () => {
    for (const el of /** @type {HTMLElement[]} */ ([...document.querySelectorAll("[data-pk]")])) {
      const w = result && result.ok ? placesWords(result.places[el.dataset.pk ?? ""]) : null;
      el.hidden = !w;
      if (!w) { el.replaceChildren(); continue; }
      el.dataset.state = w.state;
      const label = el.dataset.pkLabel ? `${el.dataset.pkLabel}: ` : "";
      if (w.state === "full") {
        const text = `${cfg.message} the ${el.dataset.pkWhen ?? ""} class is full. Could we join the waiting list?`;
        const a = Object.assign(document.createElement("a"), { href: ctx.bookHref(text), textContent: w.words, target: "_blank", rel: "noopener" });
        el.replaceChildren(label, a);
      } else el.textContent = label + w.words;
    }
  };
  ctx.watch("balletAnswered", paint);
  provider.load(ctx).then((r) => { result = r; paint(); }, () => { result = { ok: false }; paint(); });
}
