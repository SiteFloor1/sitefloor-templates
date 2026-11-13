// @ts-check
/**
 * The UK rules a whitening and aesthetic dental studio's website must keep, with where each comes from and the day it
 * was checked. The site states them in these words and links the source; nothing here is the studio's to change.
 * Checked 5 November 2026 (docs/trades/teeth/playbook.md, "UK rules").
 */

export const CHECKED = "2026-11-05";

/** Where the rules come from, linked on the patient information page. */
export const SOURCES = {
  whitening: { name: "GDC position statement on tooth whitening", url: "https://www.gdc-uk.org/docs/default-source/what-is-the-legal-position/tooth-whitening-position-statement.pdf" },
  advertising: { name: "GDC guidance on advertising", url: "https://www.gdc-uk.org/standards-guidance/standards-and-guidance/gdc-guidance-for-dental-professionals/guidance-on-advertising" },
  cap: { name: "CAP advice on teeth whitening", url: "https://www.asa.org.uk/advice-online/teeth-whitening.html" },
  law: { name: "The Cosmetic Products (Safety) (Amendment) Regulations 2012", url: "https://www.legislation.gov.uk/uksi/2012/2263" },
};

/** The register every GDC number opens (search by number), the GDC itself and the Dental Complaints Service. */
export const REGISTER = "https://olr.gdc-uk.org/";
export const GDC = { name: "General Dental Council", url: "https://www.gdc-uk.org/" };
export const DCS = { name: "Dental Complaints Service", url: "https://dcs.gdc-uk.org/", covers: "private dental treatment" };

/** The rule, stated as the GDC states it (position statement, 2016). */
export const WHITENING_RULE = "Tooth whitening may only be carried out by a GDC-registered dentist, or by a registered dental hygienist, dental therapist or clinical dental technician on a dentist's prescription. Anyone else whitening teeth is breaking the law.";
export const UNDER_18 = "We don't whiten teeth for anyone under 18, unless it is to treat or prevent disease.";

/**
 * Registered roles. `whitens`: who may carry out whitening (a hygienist, therapist or clinical dental technician on a
 * dentist's prescription, which the studio confirms by setting `prescribedBy`).
 * @type {Record<string, { label: string, whitens: "yes"|"prescription"|"no" }>}
 */
export const ROLES = {
  dentist: { label: "Dentist", whitens: "yes" },
  hygienist: { label: "Dental hygienist", whitens: "prescription" },
  therapist: { label: "Dental therapist", whitens: "prescription" },
  "clinical-technician": { label: "Clinical dental technician", whitens: "prescription" },
  "orthodontic-therapist": { label: "Orthodontic therapist", whitens: "no" },
  nurse: { label: "Dental nurse", whitens: "no" },
  technician: { label: "Dental technician", whitens: "no" },
};

/** Practice status the GDC asks every website to state. */
export const STATUS = { private: "A private practice.", nhs: "An NHS practice.", mixed: "NHS and private treatment." };

/**
 * Words the studio's own text may not use (CAP advice; GDC guidance): a promised number of shades, permanence, a
 * guarantee, a painless promise, a laser or light doing the whitening, and "specialist" for someone on no GDC
 * specialist list. Returns why the text can't be published, or null.
 * @param {string} text @param {{ specialist?: boolean }} [o]
 * @returns {string|null}
 */
export function claimProblem(text, o = {}) {
  if (typeof text !== "string") return null;
  const n = "(?:\\d+|a|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)";
  if (new RegExp(`\\b${n}\\s*(?:(?:to|or|-|–)\\s*${n}\\s*)?shades?\\s+(?:lighter|whiter|brighter)\\b|\\b(?:\\d+|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\\s*(?:(?:to|or|-|–)\\s*${n}\\s*)?shades?\\b|\\ba shade or (?:two|more)\\b`, "i").test(text)) return "promises a number of shades; the clinician shows what's realistic at consultation instead (CAP advice)";
  if (/\bpermanent(?:ly)?\b|\blasts? (?:for ever|forever)\b|\blifetime\b|\blife-long\b|\blifelong\b/i.test(text)) return "says the result is permanent; whitening fades (CAP advice)";
  if (/\bguarant/i.test(text)) return "guarantees a result (CAP advice)";
  if (/\bpain(?:less|-free| free)\b/i.test(text)) return "promises no pain; say what the clinician does about sensitivity instead";
  if (/\blasers?\b|\blight[- ](?:activated|accelerated|assisted|powered)\b|\bblue light\b|\bUV light\b/i.test(text) || /\bLED\b/.test(text)) return "mentions a laser or light; don't imply a laser or light does the whitening (CAP advice)";
  if (!o.specialist && /\bspeciali[sz](?:t|ts|e|es|ing|ed)\b/i.test(text)) return "uses \"specialist\" (or \"specialises\") for someone on no GDC specialist list; say \"special interest in\" or \"experienced in\" (GDC guidance)";
  return null;
}

/** A GDC number as the register prints it. @param {unknown} v */
export const isGdcNumber = (v) => typeof v === "string" && /^\d{1,7}$/.test(v);
