// @ts-check
/** Gifts, engraving and wrapping: the total from the house's prices as the order is chosen; it goes on WhatsApp. */
import { engraved, fill, pounds } from "../../lib/fragrance.js";
import { giftTotal } from "../../lib/gifts.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), e = data.engraving, g = data.gifts;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-gift-form]"));
  const sizes = root.querySelector("[data-gift-sizes]"), sum = root.querySelector("[data-gift-sum]");
  const go = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-gift-go]"));
  if (!e || !g || !form || !sizes || !sum || !go) throw new Error("gifts markup missing");
  let shown = "";
  const render = () => {
    const fd = new FormData(form), str = (/** @type {string} */ k) => String(fd.get(k) ?? "").trim();
    const x = data.fragrances.find((/** @type {any} */ f) => f.id === fd.get("scent")) ?? data.fragrances[0];
    if (shown !== x.id) { // this fragrance's own sizes
      shown = x.id;
      const legend = sizes.querySelector("legend")?.outerHTML ?? "";
      sizes.innerHTML = legend + x.sizes.map((/** @type {any} */ s, /** @type {number} */ i) => `<label><input type="radio" name="ml" value="${s.ml}"${i === Math.min(1, x.sizes.length - 1) ? " checked" : ""}><span>${s.ml} ml</span></label>`).join("");
      return render();
    }
    const size = x.sizes.find((/** @type {any} */ s) => String(s.ml) === fd.get("ml")) ?? x.sizes[0];
    const words = engraved(str("words"), /** @type {any} */ (str("style") || "caps"), e.max);
    const t = giftTotal(size.price, words ? e.price : 0, fd.get("wrap") ? (g.wrap?.price ?? 0) : 0);
    sum.textContent = `${x.name}, ${size.ml} ml${words ? ", engraved" : ""}${fd.get("wrap") ? ", wrapped" : ""}: ${pounds(t)}`;
    const extras = [words ? `engraved "${words}" on the ${str("place") || "glass"}` : "", fd.get("wrap") ? "gift wrapped" : "", str("card") ? `card: "${str("card")}"` : ""].filter(Boolean).join("; ");
    go.href = ctx.bookHref(fill(g.message, { name: data.name, fragrance: x.name, ml: size.ml, price: pounds(t), extras: extras || "no engraving" }));
  };
  form.addEventListener("input", render);
  form.addEventListener("change", render);
  document.addEventListener("fr-launch", () => { shown = ""; render(); });
  render();
}
