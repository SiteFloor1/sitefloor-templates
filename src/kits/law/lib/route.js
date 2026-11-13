// @ts-check
/**
 * Who a first enquiry goes to, and the words of a conflict-safe first message. Pure, so it is tested without a page.
 *
 * Conflict-safe: before a firm can hear about a matter it must check it doesn't already act for anyone on the other
 * side. So the first message carries only who is involved and how to reply, never what happened.
 */

/** @typedef {{ id: string, name: string, role: string, email?: string, phone?: string, practice?: string[], sraId?: string }} Person */
/** @typedef {{ id: string, name: string, lead: string }} Area */

/** The person who leads a practice area. @param {string} areaId @param {Area[]} areas @param {Person[]} people */
export function leadFor(areaId, areas, people) {
  const area = areas.find((a) => a.id === areaId);
  return area ? people.find((p) => p.id === area.lead) ?? null : null;
}

/** mailto: with a subject and body, encoded so any mail app opens it pre-filled. @param {string} to @param {string} subject @param {string} body */
export const mailHref = (to, subject, body) => `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

/** Names typed one per line or separated by commas; blanks and repeats dropped, at most 12. @param {string} raw */
export function partiesFrom(raw) {
  const seen = new Set();
  return raw.split(/[\n,;]+/).map((s) => s.trim().replace(/\s+/g, " ")).filter((s) => {
    const k = s.toLowerCase();
    if (!s || seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 12);
}

/**
 * The first message: the sender, how to reach them, the area, and the other people or companies involved. Nothing
 * else, by design.
 * @param {{ name: string, reach: string, area: string, parties: string[], firm: string }} o
 */
export function firstContactBody(o) {
  return [
    `Dear ${o.firm},`,
    "",
    `I would like to speak to someone about ${o.area.toLowerCase()}. Before I say more, please check you can act for me.`,
    "",
    "The other people or companies involved:",
    ...o.parties.map((p) => `- ${p}`),
    "",
    `My name: ${o.name}`,
    `How to reach me: ${o.reach}`,
  ].join("\n");
}
