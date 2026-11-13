// @ts-check
/**
 * "If there's no will": who inherits under the intestacy rules of England and Wales, in words. The visitor says who in
 * the family is alive; this returns who would inherit and how it is shared. No money is entered and no amount is
 * worked out beyond the fixed sum the law sets. General information, not advice.
 *
 * Checked 2 Nov 2026 against HMRC's Trusts, Settlements and Estates Manual (TSEM7826, TSEM7830) and Citizens Advice:
 * - spouse or civil partner, no children: everything;
 * - spouse or civil partner and children: personal possessions, the first £322,000 (for deaths on or after
 *   26 July 2023) and half of the rest; the children share the other half equally;
 * - no spouse: the children equally; a child who has died is replaced by their own children;
 * - then, in order: parents; brothers and sisters (or their children); half-brothers and half-sisters (or theirs);
 *   grandparents; aunts and uncles (or their children); half-aunts and half-uncles (or theirs); then the Crown;
 * - an unmarried partner inherits nothing under the rules (they may be able to ask a court for provision);
 * - anyone under 18 has their share held in trust until 18.
 */

export const CHECKED = "2026-11-02";
export const FIXED_SUM = 322000;
export const FIXED_SUM_FROM = "26 July 2023";
export const SOURCES = [
  { name: "HMRC manual TSEM7826", url: "https://www.gov.uk/hmrc-internal-manuals/trusts-settlements-and-estates-manual/tsem7826" },
  { name: "HMRC manual TSEM7830", url: "https://www.gov.uk/hmrc-internal-manuals/trusts-settlements-and-estates-manual/tsem7830" },
  { name: "Citizens Advice", url: "https://www.citizensadvice.org.uk/family/death-and-wills/who-can-inherit-if-there-is-no-will-the-rules-of-intestacy/" },
];

/** Who the visitor can say is alive, in the law's order after the spouse and children. */
export const RELATIVES = /** @type {const} */ ([
  ["parents", "A parent", "Your parents"],
  ["siblings", "A brother or sister, or their children", "Your brothers and sisters (a brother or sister who has died is replaced by their children)"],
  ["halfSiblings", "A half-brother or half-sister, or their children", "Your half-brothers and half-sisters (or their children)"],
  ["grandparents", "A grandparent", "Your grandparents"],
  ["auntsUncles", "An aunt or uncle, or their children", "Your aunts and uncles (an aunt or uncle who has died is replaced by their children)"],
  ["halfAuntsUncles", "A half-aunt or half-uncle, or their children", "Your half-aunts and half-uncles (or their children)"],
]);

/**
 * @typedef {{ spouse?: boolean, partner?: boolean, children?: boolean, grandchildrenOfDeadChild?: boolean,
 *   parents?: boolean, siblings?: boolean, halfSiblings?: boolean, grandparents?: boolean, auntsUncles?: boolean, halfAuntsUncles?: boolean }} Family
 * @typedef {{ who: string, gets: string }} Share
 */

/** @param {number} n */
const gbp = (n) => `£${n.toLocaleString("en-GB")}`;

/**
 * @param {Family} f who is alive
 * @returns {{ shares: Share[], notes: string[] }}
 */
export function intestacy(f) {
  /** @type {Share[]} */ const shares = [];
  /** @type {string[]} */ const notes = [];
  const issue = Boolean(f.children || f.grandchildrenOfDeadChild);
  const issueWho = f.children && f.grandchildrenOfDeadChild ? "Your children, and the children of a child who has died" : f.children ? "Your children" : "The children of your child who has died";
  if (f.spouse && !issue) shares.push({ who: "Your spouse or civil partner", gets: "Everything." });
  else if (f.spouse) {
    shares.push({ who: "Your spouse or civil partner", gets: `Your personal possessions, the first ${gbp(FIXED_SUM)} and half of what is left.` });
    notes.push(`The ${gbp(FIXED_SUM)} is for deaths on or after ${FIXED_SUM_FROM}. Earlier deaths had a lower fixed sum; ask us.`);
    shares.push({ who: issueWho, gets: "The other half, shared equally (a child who has died is replaced by their own children)." });
  } else if (issue) shares.push({ who: issueWho, gets: "Everything, shared equally (a child who has died is replaced by their own children)." });
  else {
    const first = RELATIVES.find(([k]) => f[k]);
    if (first) shares.push({ who: first[2], gets: "Everything, shared equally between them. Nobody further down the family inherits." });
    else shares.push({ who: "The Crown", gets: "Everything, as ownerless property (bona vacantia)." });
  }
  if (f.partner) notes.push("An unmarried partner inherits nothing under these rules, however long you have lived together. They may be able to ask a court for financial provision.");
  if (issue) notes.push("A share for anyone under 18 is held in trust until they are 18.");
  if (f.spouse && issue) notes.push(`If everything is worth ${gbp(FIXED_SUM)} or less, your spouse or civil partner inherits all of it.`);
  if (f.spouse && issue) notes.push("A home you own jointly as joint tenants passes to the other owner automatically and is not part of this.");
  return { shares, notes };
}
