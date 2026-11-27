// @ts-check
/**
 * Free now and free from: the operator's free homes as cards, opening a home's detail (photo, size, the all-in
 * prices, the tenancy terms with their GOV.UK sources, an enquiry by WhatsApp). Listens for "residences-stay" from the
 * stay bar and re-prices every card to that stay. Fails closed: no home is listed when the sheet is stale.
 */
import { homesState, countWords } from "./load.js";
import { card, detail } from "./card.js";
import { updatedText } from "../../lib/homes.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const list = /** @type {HTMLElement} */ (root.querySelector("[data-rh-list]"));
  const upd = /** @type {HTMLElement} */ (root.querySelector("[data-rh-updated]"));
  const count = document.querySelector("[data-rh-count]");
  const d = /** @type {HTMLDialogElement} */ (root.querySelector("[data-rh-dialog]"));
  const limit = Number(root.dataset.limit ?? 0);
  /** @type {import("./card.js").Stay} */ let stay = null;
  /** @type {import("./load.js").HomesState|null} */ let state = null;
  const draw = () => {
    if (!state?.ok) return;
    const homes = limit ? state.homes.slice(0, limit) : state.homes;
    list.replaceChildren(...homes.map((h) => card(h, ctx, stay, (x) => detail(d, x, ctx, stay, /** @type {any} */ (state).updatedAt))));
  };
  homesState(ctx).then((s) => {
    state = s;
    if (!s.ok) { root.classList.add("rh-stale"); return; }
    if (count) count.textContent = countWords(s.homes.length);
    upd.textContent = `${updatedText(s.updatedAt, Date.now(), ctx.data.hours.timezone)}.${ctx.data.mode === "demo" ? " Sample homes and figures." : ""}`;
    draw();
    ctx.share("residences-homes", s);
  });
  ctx.watch("residences-stay", (/** @type {{ stay: import("./card.js").Stay }} */ v) => { stay = v.stay; draw(); });
  d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
}
