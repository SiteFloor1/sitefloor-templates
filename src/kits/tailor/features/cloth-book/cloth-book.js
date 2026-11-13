// @ts-check
/**
 * The cloth book: tapping a length opens its weave full screen; previous and next walk the lengths that are showing
 * (the cloth page's season filter hides some); Esc closes and focus goes back to the length. On the cloth page the
 * season buttons filter the book.
 */

import { swatchSetText, SWATCH_SET_MAX } from "../../lib/tailor.js";

const KEY = "sf-swatches";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const q = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  const sheet = /** @type {HTMLDialogElement|null} */ (q("[data-cb-weave]"));
  const img = /** @type {HTMLImageElement|null} */ (q("[data-cb-img]")), tall = /** @type {HTMLSourceElement|null} */ (q("[data-cb-tall]"));
  const name = q("[data-cb-name]"), cloth = q("[data-cb-cloth]"), weight = q("[data-cb-weight]"), weightRow = q("[data-cb-weight-row]"), season = q("[data-cb-season]"), count = q("[data-cb-count]");
  const ask = /** @type {HTMLAnchorElement|null} */ (q("[data-cb-ask]")), add = /** @type {HTMLButtonElement|null} */ (q("[data-cb-add]"));
  const all = /** @type {HTMLAnchorElement[]} */ ([...root.querySelectorAll("[data-cb-open]")]);
  if (!add || !sheet || !img || !tall || !name || !cloth || !weight || !weightRow || !season || !count || !ask || !all.length || typeof sheet.showModal !== "function") throw new Error("cloth book markup missing");
  const showing = () => all.filter((a) => !(/** @type {HTMLElement} */ (a.closest("li"))).hidden);
  /** @type {HTMLAnchorElement|null} */ let current = null;
  const byId = (/** @type {string} */ id) => all.find((a) => a.dataset.cbOpen === id);
  const swatches = swatchSet(root, ctx, all, add, byId, () => current);


  /** @param {HTMLAnchorElement} a */
  const fill = (a) => {
    current = a;
    const d = a.dataset, list = showing();
    tall.srcset = d.tall ?? ""; img.src = d.wide ?? ""; img.alt = d.alt ?? "";
    img.classList.remove("in"); void img.offsetWidth; img.classList.add("in");
    name.textContent = d.name ?? ""; cloth.textContent = d.cloth ?? ""; season.textContent = d.season ?? "";
    weight.textContent = d.weight ?? "";
    weightRow.hidden = !d.weight;
    ask.href = d.ask ?? ask.href;
    count.textContent = `${list.indexOf(a) + 1} of ${list.length}`;
    swatches.button(a);
  };
  const step = (/** @type {number} */ by) => { const list = showing(); if (current) fill(list[(list.indexOf(current) + by + list.length) % list.length]); };
  for (const a of all) a.addEventListener("click", (e) => { e.preventDefault(); fill(a); sheet.showModal(); /** @type {HTMLElement} */ (q("[data-cb-close]")).focus(); });
  q("[data-cb-close]")?.addEventListener("click", () => sheet.close());
  q("[data-cb-prev]")?.addEventListener("click", () => step(-1));
  q("[data-cb-next]")?.addEventListener("click", () => step(1));
  sheet.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") step(1); if (e.key === "ArrowLeft") step(-1); });
  sheet.addEventListener("close", () => current?.focus());

  // Another feature (the commission's cloth) can ask for a weave to open.
  ctx.watch("open-cloth", (/** @type {string} */ id) => { const a = id ? byId(id) : null; if (a) { a.click(); ctx.share("open-cloth", ""); } });
  swatches.show();

  // The cloth page's season filter.
  const filters = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-cb-season-pick]")]);
  for (const b of filters) b.addEventListener("click", () => {
    const s = b.dataset.cbSeasonPick ?? "";
    for (const x of filters) x.setAttribute("aria-pressed", String(x === b));
    for (const li of /** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll("[data-seasons]"))) {
      const ss = (li.dataset.seasons ?? "").split(" ");
      li.hidden = Boolean(s) && !ss.includes(s) && !ss.includes("all-year");
    }
  });
}

/**
 * The swatch set (up to five cloths, one WhatsApp message): the bar under the book and the weave's Add button.
 * @param {HTMLElement} root @param {import("../../../../core/js/core.js").Ctx} ctx @param {HTMLAnchorElement[]} all
 * @param {HTMLButtonElement} add @param {(id: string) => HTMLAnchorElement|undefined} byId @param {() => HTMLAnchorElement|null} current
 */
function swatchSet(root, ctx, all, add, byId, current) {
  const q = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  const bar = q("[data-cb-set]"), barNames = q("[data-cb-set-names]"), barCount = q("[data-cb-set-count]"), barAsk = /** @type {HTMLAnchorElement|null} */ (q("[data-cb-set-ask]"));
  if (!bar || !barNames || !barCount || !barAsk) throw new Error("swatch set markup missing");
  const opening = /** @type {any} */ (ctx.data).cloths?.message ?? "";
  /** @type {string[]} */ let set = [];
  try { set = JSON.parse(localStorage.getItem(KEY) ?? "[]").filter((/** @type {string} */ id) => byId(id)).slice(0, SWATCH_SET_MAX); } catch { /* storage off: fine */ }
  const showSet = () => {
    const items = set.map((id) => { const d = byId(id)?.dataset ?? {}; return { name: d.name ?? "", cloth: d.cloth ?? "" }; });
    bar.hidden = !set.length;
    barNames.textContent = set.length ? `Your swatch set: ${items.map((x) => x.name).join(", ")}.` : "";
    barCount.textContent = `${set.length} of ${SWATCH_SET_MAX}`;
    barAsk.href = ctx.bookHref(swatchSetText(opening, items));
    barAsk.textContent = set.length === 1 ? "Ask for this swatch" : "Ask for these swatches";
    for (const a of all) /** @type {HTMLElement|null} */ (a.querySelector("[data-cb-in]"))?.toggleAttribute("hidden", !set.includes(a.dataset.cbOpen ?? ""));
    const cur = current(); if (cur) setButton(cur);
    try { localStorage.setItem(KEY, JSON.stringify(set)); } catch { /* storage off: fine */ }
    ctx.share("swatches", [...set]);
  };
  /** @param {HTMLAnchorElement} a */
  const setButton = (a) => {
    const id = a.dataset.cbOpen ?? "", on = set.includes(id), full = !on && set.length >= SWATCH_SET_MAX;
    add.setAttribute("aria-pressed", String(on));
    add.disabled = full;
    add.textContent = on ? "In your swatch set · remove" : full ? `Your set is full (${SWATCH_SET_MAX})` : "Add to my swatch set";
  };
  add.addEventListener("click", () => {
    const id = current()?.dataset.cbOpen ?? "";
    if (!id) return;
    set = set.includes(id) ? set.filter((x) => x !== id) : set.length < SWATCH_SET_MAX ? [...set, id] : set;
    showSet();
  });
  q("[data-cb-set-clear]")?.addEventListener("click", () => { set = []; showSet(); });
  return { show: showSet, button: setButton };
}
