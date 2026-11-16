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

/** Conditions a cosmetic treatment may never claim to treat; the clinic may still name them as a reason not to have one. */
const CONDITION = /\b(acne|rosacea|eczema|psoriasis|dermatitis|melasma|vitiligo|keloids?|hyperpigmentation)\b/i;
/** A sentence that names a condition as a contraindication or something to tell the facialist, not as a result. */
const CONTRA = /\b(if you (have|had|are|get|suffer)|not suitable|unsuitable|tell us|let us know|mention|before your patch test|we can't treat|we cannot treat|we don't treat|we do not treat|avoid if|unless)\b/i;

/** A result claimed for "it" after a condition has been named. */
const PRONOUN_CLAIM = /\b(calms?|soothes?|clears?|fades?|treats?|helps?|improves?|reduces?|settles?|eases?|fixes?|heals?)\b[^.]*?\b(it|them|this|that|these|those)\b|\b(it|this)\b[^.]*?\b(calms?|soothes?|clears?|fades?|improves?|settles?|eases?|goes)\b/i;

/** @type {[RegExp, string][]} */
const BANNED = [
  [/\b(cures?|(?<!gel )cured(?! under))\b|\bheals\b|\bheal (your|the) skin\b/i, "a medical claim; a cosmetic treatment can't cure or heal (CAP 12.1)"],
  [/\b(guarantee[ds]?|(?<!semi[- ])permanent(ly)?|forever|clinically[- ]proven|medical[- ]grade)\b|\blast(s|ing)? (for )?(years|months)\b/i, "promises a result the clinic can't hold evidence for (CAP 3.7)"],
  [/\b(anti-?ag(e)?ing|reverse[sd]? (the )?ag(e)?ing|younger|wrinkle-free|face[- ]?lift(ing)?|lifts? (the|your) (face|skin|jaw)|(boosts?|builds?|stimulates?|increases?|restores?|rebuilds?) (your )?collagen|collagen (boost|induction|stimulation))\b/i, "an anti-ageing claim; CAP allows only temporary, evidenced effects, and none for peels"],
  [/\b(erases?|eliminates?|removes?|gets? rid of|treats?) (your |the )?(fine lines|lines|wrinkles|scars?|scarring|pigmentation|hyperpigmentation|stretch marks|cellulite)\b/i, "promises to remove or treat a skin condition (CAP 12.1, 3.7)"],
  [/\b(botox|botulinum|anti-?wrinkle|dermal fillers?|fillers?|lip (filler|enhancement|augmentation)|hyaluronic acid (injections?|fillers?)|injectables?|inject\w*|skin boosters?|profhilo|polynucleotides?|PRP|platelet-rich|vampire facial)\b/i, "injectables are prescription-only or medical, outside this kit, and their advertising is restricted"],
  [/\b(painless|risk-free|no side effects|100% safe)\b/i, "a safety promise no treatment can make"],
];

/**
 * Why a sentence breaks the rules, or null. A condition may be named when the sentence is about who shouldn't have a
 * treatment or what to tell the facialist ("Tell us if you have eczema before your patch test").
 * @param {string} s
 */
export function claimProblem(s) {
  for (const [re, why] of BANNED) if (re.test(s)) return `"${s.match(re)?.[0]}" ${why}`;
  // A warning covers only its own clause: "Not suitable for rosacea; our peel fades melasma." is still a claim.
  const clauses = s.split(/(?<=[.!?])\s+|[;:\u2014]|\s-\s|,\s*and\s/);
  let named = false;
  for (const clause of clauses) {
    const m = clause.match(CONDITION);
    if (m && !CONTRA.test(clause)) return `"${m[0]}" names a medical condition; describe how skin looks or feels instead (CAP 12.1). Naming it as a reason not to have a treatment is fine ("Tell us if you have …").`;
    // "Tell us if you have eczema. This facial calms it." claims a result for the condition just named.
    if (named && PRONOUN_CLAIM.test(clause)) return `"${clause.match(PRONOUN_CLAIM)?.[0]}" claims a result for the condition named before it (CAP 12.1)`;
    if (m) named = true;
  }
  return null;
}

