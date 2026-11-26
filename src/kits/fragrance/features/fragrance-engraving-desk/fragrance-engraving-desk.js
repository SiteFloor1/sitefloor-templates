// @ts-check
/** The engraving desk: the words drawn on the bottle as they are typed, in the chosen letter style; the order follows. */
import { engraved, fill, pounds } from "../../lib/fragrance.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), e = data.engraving;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-desk-form]"));
  const out = /** @type {HTMLElement|null} */ (root.querySelector("[data-engr]"));
  const count = root.querySelector("[data-engr-count]");
  const go = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-desk-go]"));
  if (!e || !form || !out || !go) throw new Error("engraving desk markup missing");
  const x = data.fragrances.find((/** @type {any} */ f) => f.id === e.fragrance);
  const size = x.sizes.find((/** @type {any} */ s) => s.ml === e.ml);
  const render = () => {
    const fd = new FormData(form);
    const words = String(fd.get("words") ?? ""), style = /** @type {any} */ (String(fd.get("style") ?? "caps")), place = String(fd.get("place") ?? "glass");
    out.textContent = engraved(words, style, e.max);
    out.className = `fr-engr fr-engr-${style}`;
    if (count) count.textContent = `${words.length} of ${e.max}`;
    const msg = fill(e.message, { name: data.name, fragrance: x.name, ml: e.ml, price: pounds(size.price + e.price), words: engraved(words, style, e.max) || "(to follow)", style: style === "caps" ? "capitals" : style === "lower" ? "lower case" : "initials", place: place === "box" ? "box" : "glass" });
    go.href = e.payLink || ctx.bookHref(msg);
  };
  form.addEventListener("input", render);
  form.addEventListener("change", render);
  form.addEventListener("submit", (ev) => { ev.preventDefault(); go.click(); });
  render();
}
