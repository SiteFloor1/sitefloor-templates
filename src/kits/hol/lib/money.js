// @ts-check
/** Money as the hol kit writes it: whole pounds with thousands commas ("£52,200"), pence only when there are any. */

/** @param {number} n */
export function pounds(n) {
  const v = Math.round(n * 100) / 100;
  const whole = Number.isInteger(v);
  return `${v < 0 ? "−" : ""}£${Math.abs(v).toLocaleString("en-GB", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 })}`;
}

/** The fee on an example amount of bookings, VAT included. @param {number} amount @param {number} percent */
export const feeOn = (amount, percent) => Math.round(amount * percent) / 100;
