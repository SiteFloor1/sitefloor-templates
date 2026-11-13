// @ts-check
/**
 * The FCA facts a wealth manager's site shows, checked 4 Nov 2026 against the FCA Handbook (COBS 4.2), the FCA's page on
 * risk warnings for mainstream investments (11 Dec 2025) and the Financial Ombudsman Service. The firm's own numbers
 * (its FRN, each adviser's individual reference number) always come from the firm; a demo shows only noughts.
 */
export const CHECKED = "2026-11-04";

/** The FCA's Financial Services Register: anyone can search a firm by name or FRN, or a person by name or reference. */
export const REGISTER = "https://register.fca.org.uk/";

/** Where unresolved complaints go, and when (the firm has eight weeks; then six months from its final response). */
export const OMBUDSMAN = {
  name: "Financial Ombudsman Service",
  phone: "0800 023 4567",
  url: "https://www.financial-ombudsman.org.uk/",
  weeks: 8,
  months: 6,
};

/** COBS 4.2.4G(1): say plainly where capital is at risk. The firm may use its own wording; this is the default. */
export const CAPITAL_AT_RISK = "When you invest, your capital is at risk. The value of investments can fall as well as rise, and you may get back less than you invest.";

/** Every insight carries this; a firm can't remove it. */
export const NOT_ADVICE = "General information, not advice";

/** A firm reference number: six or seven digits. @param {unknown} v */
export const isFrn = (v) => typeof v === "string" && /^\d{6,7}$/.test(v);

/** An individual reference number on the register: three letters and five digits, e.g. ABC01234. @param {unknown} v */
export const isIrn = (v) => typeof v === "string" && /^[A-Z]{3}\d{5}$/.test(v);

/** Demo numbers are all noughts (FRN) or end in five noughts (IRN), so a fictional firm never names a real one. @param {string} v */
export const isDemoNumber = (v) => /^0+$/.test(v) || /^[A-Z]{3}00000$/.test(v);

/**
 * Words that make a promise about returns or performance, which a financial promotion must not make without the balance
 * COBS 4.2 asks for. Used to stop them reaching the page from a firm's own sheet or settings.
 */
export const PROMISES = /\b(guarantee[ds]?|risk[- ]free|no risk|outperform\w*|[a-z]+-beating|beat(s|ing)? (the|our|inflation)\b|never lose|top[- ](decile|quartile)|returns? of \d|\d+(\.\d+)?\s?%\s*(a year|p\.?a\.?|returns?|growth))/i;

/** A warning that says something is NOT guaranteed or risk-free is the opposite of a promise, so it is set aside first. */
const NEGATED = /\b(no|not|never|isn't|aren't|can't|cannot|nothing is)\s+(be\s+)?(a\s+)?(guarantee[ds]?|risk[- ]free)\b/gi;

/** Whether a text promises returns or performance. @param {string} text */
export const promises = (text) => PROMISES.test(text.replace(NEGATED, ""));
