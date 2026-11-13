// @ts-check
/**
 * The words a jeweller's site sends on WhatsApp: an appointment request, a hint, a shortlist, a bespoke brief and a
 * proposal brief. Each is a request the house answers, never a booking or an order. Every message carries a date the
 * customer chose, never "today", because it may be read later.
 */

/** @param {string} iso YYYY-MM-DD @returns {string} e.g. "Saturday 14 November" */
export function longDate(iso) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}

/** @param {(string|false|null|undefined)[]} lines */
const join = (lines) => lines.filter((l) => typeof l === "string" && l.trim()).join("\n");

/**
 * A private appointment request.
 * @param {{ house: string, reason?: string, when?: string, day?: string, time?: string, pieces?: string[], name?: string, note?: string }} o
 *   when: words ("A weekday morning"); day: YYYY-MM-DD from the date picker, with an optional "HH:MM" time
 */
export function appointmentText(o) {
  return join([
    `Hello ${o.house}, I'd like to request a private appointment.`,
    o.reason && `For: ${o.reason}`,
    o.day ? `The day I'd like: ${longDate(o.day)}${o.time ? ` at ${o.time}` : ""}, or the nearest you can offer` : o.when && `When suits me: ${o.when}`,
    o.pieces?.length ? `I'd like to see: ${o.pieces.join(", ")}` : "",
    o.note && `Note: ${o.note}`,
    o.name && `My name: ${o.name}`,
    "Please let me know what you can offer.",
  ]);
}

/**
 * Drop a hint: a message for the customer to forward to someone, naming the piece and where to find it.
 * @param {{ house: string, piece: string, price?: string, url: string, size?: string }} o
 */
export function hintText(o) {
  return join([
    `A hint: ${o.piece}${o.price ? ` (${o.price})` : ""}, from ${o.house}.`,
    o.size && `My ring size is ${o.size}.`,
    o.url,
  ]);
}

/**
 * Your tray: up to three pieces sent with an appointment request.
 * @param {{ house: string, pieces: string[] }} o
 */
export function trayText(o) {
  return appointmentText({ house: o.house, reason: "the pieces on my tray", pieces: o.pieces });
}

/**
 * A bespoke commission brief.
 * @param {{ house: string, kind?: string, stone?: string, metal?: string, budget?: string, by?: string, story?: string }} o
 *   by: a date (YYYY-MM-DD) the customer would like it by
 */
export function briefText(o) {
  return join([
    `Hello ${o.house}, I'd like to talk about a bespoke commission.`,
    o.kind && `The piece: ${o.kind}`,
    o.stone && `Stone: ${o.stone}`,
    o.metal && `Metal: ${o.metal}`,
    o.budget && `Budget: ${o.budget}`,
    o.by && `Would like it by: ${longDate(o.by)}`,
    o.story && `The story: ${o.story}`,
    "Could we arrange a first appointment?",
  ]);
}

/**
 * A proposal brief: what the house needs to help plan a proposal ring, sent privately.
 * @param {{ house: string, date?: string, size?: string, sizeKnown?: boolean, style?: string, budget?: string, note?: string }} o
 */
export function proposalText(o) {
  return join([
    `Hello ${o.house}, I'm planning a proposal and would like your help, privately.`,
    o.date && `Proposing on: ${longDate(o.date)}`,
    o.size ? `Their ring size: ${o.size}` : o.sizeKnown === false ? "I don't know their ring size yet." : "",
    o.style && `What they wear: ${o.style}`,
    o.budget && `Budget: ${o.budget}`,
    o.note && `Note: ${o.note}`,
    "Please reply to this number only.",
  ]);
}

/**
 * Engraving: the words inside a band, kept to what a band can carry.
 * @param {string} text @param {number} max the house's limit @returns {{ text: string, over: boolean }}
 */
export function engraving(text, max) {
  const clean = String(text ?? "").replace(/\s+/g, " ").trimStart();
  return { text: clean.slice(0, max), over: clean.length > max };
}

/**
 * Pieces for a bridal party: matching pieces for the party, each role with its piece and how many, asked of the house.
 * @param {{ house: string, date?: string, rows: { role: string, piece: string, n: number }[], names?: string, note?: string, name?: string }} o
 */
export function partyText(o) {
  return join([
    `Hello ${o.house}, I'd like to ask about pieces for my bridal party.`,
    o.date && `The wedding: ${longDate(o.date)}`,
    ...o.rows.filter((r) => r.n > 0).map((r) => `${r.n} × ${r.piece}, for ${r.role}`),
    o.names && `Names for the boxes: ${o.names}`,
    o.note && `Note: ${o.note}`,
    o.name && `My name: ${o.name}`,
    "Please let me know if they can be ready in time, and the price.",
  ]);
}

/**
 * A gift, arranged: the piece, the day it's needed and the words for the card in the box.
 * @param {{ house: string, occasion: string, piece?: string, by?: string, card?: string, name?: string }} o
 */
export function giftText(o) {
  return join([
    `Hello ${o.house}, I'd like you to arrange a gift for ${o.occasion}.`,
    o.piece && `The piece: ${o.piece}`,
    o.by && `I need it by: ${longDate(o.by)}`,
    o.card && `For the card in the box: "${o.card}"`,
    o.name && `My name: ${o.name}`,
    "Please let me know it can be ready, and how to pay.",
  ]);
}
