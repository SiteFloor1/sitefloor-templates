// @ts-check
/**
 * Rules where the owner's home is (HOL-2): what applies to letting a holiday home in each part of Great Britain, each
 * line linked to the official page and dated when it was last checked. The kit never paraphrases a rule as advice: it
 * says what the official page says and links to it. Six months after a line was checked, the site stops showing it as
 * current and sends the owner to the official page instead (rulesState), until someone checks it again.
 */

export const STALE_MONTHS = 6;

/** @typedef {{ text: string, url: string, source: string, checked: string }} Rule */
/** @typedef {{ id: string, name: string, rules: Rule[] }} Region */

const ENGLAND = "https://www.gov.uk/guidance/letting-out-a-self-catering-holiday-home-in-england-rules-and-regulations";

/** @type {Region[]} */
export const REGIONS = [
  { id: "england", name: "England", rules: [
    { text: "Fire safety: a fire risk assessment for the home, with smoke and carbon monoxide alarms where they're needed.", url: ENGLAND, source: "GOV.UK, letting out a self-catering holiday home in England", checked: "2026-11-26" },
    { text: "Gas appliances checked every year by a Gas Safe registered engineer, and electrical equipment kept safe.", url: ENGLAND, source: "GOV.UK, letting out a self-catering holiday home in England", checked: "2026-11-26" },
    { text: "A national register of short-term lets is coming. GOV.UK says it is expected to begin in March 2027; it is not in force yet.", url: ENGLAND, source: "GOV.UK, letting out a self-catering holiday home in England", checked: "2026-11-26" },
  ] },
  { id: "london", name: "London", rules: [
    { text: "Short lets in Greater London are limited to 90 nights a year without planning permission, and whoever lets the home must pay its council tax.", url: "https://www.legislation.gov.uk/ukpga/2015/20/section/44", source: "Deregulation Act 2015, s.44", checked: "2026-11-26" },
    { text: "Everything that applies in England applies in London too.", url: ENGLAND, source: "GOV.UK, letting out a self-catering holiday home in England", checked: "2026-11-26" },
  ] },
  { id: "scotland", name: "Scotland", rules: [
    { text: "Every short-term let in Scotland needs a licence from the local council before it takes bookings or guests.", url: "https://www.gov.scot/publications/short-term-lets/pages/licensing-scheme/", source: "gov.scot, short-term lets: regulation information", checked: "2026-11-26" },
  ] },
  { id: "wales", name: "Wales", rules: [
    { text: "Anyone taking bookings for overnight stays in Wales must register with the Welsh Revenue Authority by 31 March 2027. Registration is free.", url: "https://www.gov.wales/registering-visitor-accommodation-overview", source: "GOV.WALES, registering visitor accommodation", checked: "2026-11-26" },
    { text: "Councils in Wales may add a Visitor Levy on overnight stays; each council announces its own start date.", url: "https://www.gov.wales/visitor-levy-accommodation-providers-steps", source: "GOV.WALES, Visitor Levy", checked: "2026-11-26" },
  ] },
];

/** @param {string} id */
export const region = (id) => REGIONS.find((r) => r.id === id);

/** "26 November 2026" @param {string} ymd */
export const longDate = (ymd) => new Date(`${ymd}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/**
 * Whether a rule can still be shown as current on a given day: "current" up to six months after it was checked,
 * then "check" (the site shows only the official link). @param {{ checked: string }} rule @param {string} today YYYY-MM-DD
 */
export function rulesState(rule, today) {
  const c = new Date(`${rule.checked}T12:00:00Z`);
  const limit = new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth() + STALE_MONTHS, c.getUTCDate(), 12));
  return new Date(`${today}T12:00:00Z`) > limit ? "check" : "current";
}

/** Every rule's link, checked date and wording are present (used by the unit tests). @returns {string[]} */
export function rulesProblems() {
  const out = [];
  for (const r of REGIONS) for (const [i, x] of r.rules.entries()) {
    if (!/^https:\/\/(www\.)?(gov\.uk|legislation\.gov\.uk|gov\.scot|gov\.wales)\//.test(x.url)) out.push(`${r.id}[${i}]: link must be an official page`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(x.checked)) out.push(`${r.id}[${i}]: checked date`);
    if (!x.text || !x.source) out.push(`${r.id}[${i}]: text and source`);
  }
  return out;
}
