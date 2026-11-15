// @ts-check
/**
 * The UK rules a skin clinic's site keeps, checked 15 November 2026 (docs/trades/beauty/playbook.md, "UK rules").
 * Every claim on the page is the clinic's own; these checks refuse the words the ASA and CAP say a cosmetic
 * treatment can't use: a named medical condition (CAP 12.1: only licensed medicines and devices may claim to treat
 * one), a permanent or guaranteed result, collagen or lifting claims for peels (CAP AdviceOnline), and prescription-only
 * injectables (out of scope for this kit).
 */

export const CHECKED = "2026-11-15";

/** Where the rules come from, shown on the first-visit page. */
export const SOURCES = [
  { label: "CAP Code, rule 12.1 (medicinal claims)", url: "https://www.asa.org.uk/type/non_broadcast/code_section/12.html" },
  { label: "CAP advice: beauty and cosmetics", url: "https://www.asa.org.uk/advice-online/beauty-and-cosmetics-general.html" },
  { label: "CAP advice: cosmetic interventions and under-18s", url: "https://www.asa.org.uk/advice-online/cosmetic-interventions.html" },
];

/** @type {[RegExp, string][]} */
const BANNED = [
  [/\b(acne|rosacea|eczema|psoriasis|dermatitis|melasma|vitiligo|keloids?)\b/i, "names a medical condition; describe how skin looks or feels instead (CAP 12.1)"],
  [/\b(cures?|cured|heals?|healing)\b/i, "a medical claim; a cosmetic treatment can't cure or heal (CAP 12.1)"],
  [/\b(guarantee[ds]?|permanent(ly)?|forever|clinically proven|medical[- ]grade)\b/i, "promises a result the clinic can't hold evidence for (CAP 3.7)"],
  [/\b(collagen|anti-?ag(e)?ing|reverse[sd]? (the )?ag(e)?ing|younger-looking|wrinkle-free|face[- ]?lift(ing)?|lifts? (the|your) (face|skin|jaw))\b/i, "an anti-ageing claim; CAP allows only temporary, evidenced effects, and none for peels"],
  [/\b(botox|botulinum|dermal fillers?|fillers?|skin boosters?|profhilo|lip filler)\b/i, "prescription-only injectables are outside this kit (and their advertising is restricted)"],
  [/\b(painless|risk-free|no side effects|100% safe)\b/i, "a safety promise no treatment can make"],
];

/** Why a sentence breaks the rules, or null. @param {string} s */
export function claimProblem(s) {
  for (const [re, why] of BANNED) if (re.test(s)) return `"${s.match(re)?.[0]}" ${why}`;
  return null;
}
