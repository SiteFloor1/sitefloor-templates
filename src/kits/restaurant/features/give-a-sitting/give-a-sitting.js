// @ts-check
/**
 * Give a sitting: the card updates as you write; "Pay" opens the shop's own Stripe Payment Link for that gift (the
 * site takes no payment), and "Send us the names" opens WhatsApp with the gift and the card's words.
 */
import { giftMessage } from "../../lib/tearoom.js";
import { money, toPence } from "../../lib/order.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).giveSitting;
  /** @param {string} k */ const q = (k) => /** @type {any} */ (root.querySelector(`[data-gs-${k}]`));
  const to = q("to"), from = q("from"), note = q("note"), pay = q("pay"), send = q("send");
  if (!cfg || !to || !from || !note || !pay || !send) throw new Error("give a sitting markup or data missing");
  const draw = () => {
    const id = /** @type {HTMLInputElement|null} */ (root.querySelector('input[name="gs-gift"]:checked'))?.value;
    const gift = cfg.gifts.find((/** @type {any} */ g) => g.id === id) ?? cfg.gifts[0];
    pay.href = gift.link;
    pay.textContent = `Pay ${money(toPence(gift.price))} by card`;
    q("what").textContent = gift.name;
    q("cto").textContent = to.value.trim() || " ";
    q("cfrom").textContent = from.value.trim() || " ";
    q("cnote").textContent = note.value.trim();
    send.href = ctx.waHref(giftMessage({ opening: cfg.message, gift, to: to.value.trim(), from: from.value.trim(), note: note.value.trim(), paid: true }));
  };
  root.addEventListener("input", draw);
  root.addEventListener("change", draw);
  draw();
}
