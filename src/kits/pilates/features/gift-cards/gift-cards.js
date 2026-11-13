// @ts-check
/**
 * Gift class cards: the preview follows the choice and the words typed; Pay opens that card's Stripe link; the
 * WhatsApp message carries the card, who it's for, who it's from and the line, so the studio can write it.
 */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const g = /** @type {any} */ (ctx.data).pilates?.gifts;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-gc-form]"));
  const q = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  const name = q("[data-gc-name]"), to = q("[data-gc-to]"), line = q("[data-gc-line]"), from = q("[data-gc-from]");
  const pay = /** @type {HTMLAnchorElement|null} */ (q("[data-gc-pay]")), send = /** @type {HTMLAnchorElement|null} */ (q("[data-gc-send]"));
  if (!g || !form || !name || !to || !line || !from || !pay || !send) throw new Error("gift cards markup missing");
  const field = (/** @type {string} */ n) => (/** @type {HTMLInputElement|null} */ (form.querySelector(`[name="${n}"]`))?.value ?? "").trim();
  const render = () => {
    const id = /** @type {HTMLInputElement|null} */ (form.querySelector('input[name="gc-card"]:checked'))?.value;
    const card = g.items.find((/** @type {any} */ c) => c.id === id) ?? g.items[0];
    const t = field("gc-to"), f = field("gc-from"), l = field("gc-line");
    name.textContent = card.name;
    to.textContent = t ? `For ${t}` : "For someone";
    line.textContent = l;
    from.textContent = f ? `From ${f}` : "";
    pay.href = card.payLink;
    send.href = ctx.bookHref([g.message, `Card: ${card.name}`, t && `For: ${t}`, f && `From: ${f}`, l && `On the card: "${l}"`].filter(Boolean).join("\n"));
  };
  form.addEventListener("input", render);
  form.addEventListener("change", render);
  render();
}
