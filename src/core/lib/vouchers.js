// @ts-check
/** Gift vouchers: the order message a customer sends, and which amounts are allowed. */
import { pounds } from "./savings.js";

/**
 * @typedef {{ amounts: number[], custom?: { min: number, max: number }, validMonths: number }} VoucherConfig
 */

/** @param {number} amount @param {VoucherConfig} cfg */
export function isAllowedAmount(amount, cfg) {
  if (!Number.isInteger(amount)) return false;
  if (cfg.amounts.includes(amount)) return true;
  return !!cfg.custom && amount >= cfg.custom.min && amount <= cfg.custom.max;
}

/**
 * The message that orders the voucher, so the shop has every detail in one go.
 * @param {{ amount: number, to?: string, from?: string, note?: string }} v
 */
export function voucherMessage(v) {
  const clean = (/** @type {string|undefined} */ s) => (s ?? "").replace(/\s+/g, " ").trim().slice(0, 140);
  const to = clean(v.to); const from = clean(v.from); const note = clean(v.note);
  return [
    `Hi, I'd like a ${pounds(v.amount)} gift voucher${to ? ` for ${to}` : ""}${from ? `, from ${from}` : ""}.`,
    note ? `Message for the card: "${note}"` : "",
    "How can I pay?",
  ].filter(Boolean).join(" ");
}
