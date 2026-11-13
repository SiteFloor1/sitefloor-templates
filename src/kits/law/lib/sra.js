// @ts-check
/**
 * The regulator's facts every law firm site shows, checked against the SRA and the Legal Ombudsman. These are
 * facts about the rules, not about the firm: the firm's own procedure, prices and insurance come from its site.json.
 *
 * Sources (checked 29 Oct 2026):
 * - SRA Transparency Rules, version in effect from 11 April 2025 (rule 1 services, rule 2.1 complaints, rule 4.1 the
 *   SRA number and digital badge): https://www.sra.org.uk/solicitors/standards-regulations/transparency-rules/
 * - SRA guidance "Transparency in price and service" (updated 30 Sep 2024).
 * - Legal Ombudsman: eight weeks for the firm to put things right; time limits from 1 April 2023 (one year from the
 *   problem or from realising it, six months from the firm's final response); 0300 555 0333.
 * Recheck these when the SRA or the Ombudsman changes its rules, and update CHECKED.
 */

export const CHECKED = "2026-10-29";

/**
 * Services the SRA Transparency Rules (rule 1) say must have published prices and service information, when a firm
 * offers them. `who` is the client: the public, or businesses.
 * @type {Record<string, { label: string, who: "public"|"business" }>}
 */
export const SRA_SERVICES = {
  "conveyancing": { label: "Residential conveyancing", who: "public" },
  "probate": { label: "Uncontested probate (assets in the UK)", who: "public" },
  "motoring": { label: "Motoring offences (summary only)", who: "public" },
  "employment-claim": { label: "Employment tribunal claims for unfair or wrongful dismissal", who: "public" },
  "immigration": { label: "Immigration (not asylum)", who: "public" },
  "debt-recovery": { label: "Debt recovery up to £100,000", who: "business" },
  "employment-defence": { label: "Defending employment tribunal claims for unfair or wrongful dismissal", who: "business" },
  "licensing": { label: "Licensing applications for business premises", who: "business" },
};

/** The Legal Ombudsman, as it describes itself. */
export const OMBUDSMAN = {
  name: "the Legal Ombudsman",
  url: "https://www.legalombudsman.org.uk",
  phone: "0300 555 0333",
  firmWeeks: 8,
  limits: [
    "within one year of the problem happening, or of when you realised there was a problem",
    "and within six months of our final response to your complaint",
  ],
};

export const SRA = {
  name: "the Solicitors Regulation Authority",
  url: "https://www.sra.org.uk",
  consumers: "https://www.sra.org.uk/consumers/",
  register: "https://www.sra.org.uk/consumers/register/",
};

/** An SRA number or SRA ID: digits only, as the register prints them. @param {unknown} v */
export const isSraNumber = (v) => typeof v === "string" && /^\d{3,7}$/.test(v);

/**
 * The SRA digital badge is a frame the SRA's badge supplier serves for one firm (Rule 4.1). Only that supplier's frame
 * address is accepted, so the page's security policy can allow exactly that one host.
 */
export const BADGE_HOST = "https://cdn.yoshki.com";
/** @param {unknown} v */
export const isBadgeFrame = (v) => typeof v === "string" && /^https:\/\/cdn\.yoshki\.com\/iframe\/[\w-]+\.html$/.test(v);
