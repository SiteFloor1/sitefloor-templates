// @ts-check
/**
 * A spa day as a gift: the card drawn from the day and the names as they're typed; Buy goes to the clinic's own
 * Stripe Payment Link (then the names on WhatsApp) or, without one, the whole gift to the clinic on WhatsApp.
 */
import { giftMessage, pounds } from "../../lib/skin.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), cfg = data.spaDays;
  const q = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  const form = /** @type {HTMLFormElement|null} */ (q("[data-sd-form]"));
  const to = q("[data-gc-to]"), day = q("[data-gc-day]"), inc = q("[data-gc-inc]"), note = q("[data-gc-note]"), from = q("[data-gc-from]");
  const buy = /** @type {HTMLAnchorElement|null} */ (q("[data-sd-buy]")), send = /** @type {HTMLAnchorElement|null} */ (q("[data-sd-send]"));
  if (!cfg || !form || !to || !day || !inc || !note || !from || !buy || !send) throw new Error("spa day markup missing");
  const includes = new Map([...root.querySelectorAll(".sk-sd-day")].map((l) => [/** @type {HTMLInputElement} */ (l.querySelector("input")).value, l.querySelector(".sk-sd-inc")?.textContent ?? ""]));
  const render = () => {
    const fd = new FormData(form), str = (/** @type {string} */ k) => String(fd.get(k) ?? "").trim();
    const d = cfg.days.find((/** @type {any} */ x) => x.id === fd.get("day")) ?? cfg.days[0];
    const card = { to: str("to"), from: str("from"), note: str("note") };
    to.textContent = card.to ? `A gift for ${card.to}` : "A gift for you";
    day.textContent = d.name;
    inc.textContent = includes.get(d.id) ?? "";
    note.textContent = card.note ? `“${card.note}”` : ""; note.hidden = !card.note;
    from.textContent = card.from ? `With love from ${card.from}` : ""; from.hidden = !card.from;
    const msg = ctx.bookHref(giftMessage(d, card, cfg.message, data.name));
    buy.textContent = `Buy this gift · ${pounds(d.price)}`;
    buy.href = d.payLink || msg;
    send.href = msg; send.hidden = !d.payLink;
  };
  form.addEventListener("input", render);
  form.addEventListener("change", render);
  render();
}
