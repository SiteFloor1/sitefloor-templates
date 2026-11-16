// @ts-check
/**
 * The FCA facts a financial adviser's site shows, checked 16 Nov 2026 against the FCA Handbook (COBS 4.2 fair, clear and
 * not misleading; COBS 6.2B describing advice as independent or restricted; GEN 4 Annex 1 statutory status), the FCA's
 * page on risk warnings for mainstream investments (11 Dec 2025) and the Financial Ombudsman Service's contact page.
 * The firm's own numbers (its FRN, its register entry, each adviser's individual reference number) always come from the
 * firm; a demo shows only noughts.
 */
export const CHECKED = "2026-11-16";

/** The FCA's Financial Services Register. A firm's own entry has its own address on it; this is the search page. */
export const REGISTER = "https://register.fca.org.uk/";

/** A link into the register: the firm's own entry (https://register.fca.org.uk/s/firm?id=…) or an individual's. */
export const isRegisterLink = (/** @type {unknown} */ v) => typeof v === "string" && /^https:\/\/register\.fca\.org\.uk\/[\w/?=&.%-]*$/.test(v);

/** Where unresolved complaints go, and when: the firm has eight weeks; then six months from its final response. */
export const OMBUDSMAN = {
  name: "Financial Ombudsman Service",
  phone: "0800 023 4567",
  tel: "+448000234567",
  url: "https://www.financial-ombudsman.org.uk/",
  weeks: 8,
  months: 6,
};

/** The FCA's ScamSmart page: how to check a firm and report a scam. */
export const SCAMSMART = "https://www.fca.org.uk/scamsmart";

/** COBS 4.2.4G(1): say plainly where capital is at risk. One sentence beside every mention of investing. */
export const RISK = "Investments can fall as well as rise, and you may get back less than you put in.";

/** Every article in the journal carries this; a firm can't remove it. */
export const NOT_ADVICE = "General information, not advice";

/** A firm reference number: six or seven digits. @param {unknown} v */
export const isFrn = (v) => typeof v === "string" && /^\d{6,7}$/.test(v);

/** An individual reference number on the register: three letters and five digits, e.g. ABC01234. @param {unknown} v */
export const isIrn = (v) => typeof v === "string" && /^[A-Z]{3}\d{5}$/.test(v);

/** Demo numbers are all noughts (FRN) or end in five noughts (IRN), so a fictional firm never names a real one. @param {string} v */
export const isDemoNumber = (v) => /^0+$/.test(v) || /^[A-Z]{3}00000$/.test(v);

/**
 * Words that promise returns or performance, which a financial promotion must not make (COBS 4.2), and growth
 * projections, which this kit never shows. Used to stop them reaching the page from anything the firm writes.
 */
export const PROMISES = /\b(guarantee[ds]?|risk[- ]free|no risk|outperform\w*|[a-z]+-beating|beat(s|ing)? (the|our|inflation)\b|never lose|top[- ](decile|quartile)|returns? of \d|projected (growth|returns?|value)|could grow to|\d+(\.\d+)?\s?%\s*(a year|p\.?a\.?|returns?|growth))/i;

/** A sentence that says something is NOT guaranteed or risk-free is the opposite of a promise, so it is set aside first. */
const NEGATED = /\b(no|not|never|isn't|aren't|can't|cannot|nothing is)\s+(be\s+)?(a\s+)?(guarantee[ds]?|risk[- ]free)\b/gi;

/** Whether a text promises returns or performance. @param {string} text */
export const promises = (text) => PROMISES.test(text.replace(NEGATED, ""));
