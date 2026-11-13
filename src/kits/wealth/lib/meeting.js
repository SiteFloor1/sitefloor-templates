// @ts-check
/**
 * "Arrange a meeting": the visitor's request, written out for an email or a WhatsApp message in their own words. It asks
 * nothing about money, and it stops a message that looks like it carries an account number, a sort code or a card number,
 * because those should never be sent by email. Pure: no DOM.
 */

/** Long runs of digits (an account or card number) or a sort code. @param {string} s */
export function looksSensitive(s) {
  const t = s.replace(/[\s-]/g, "");
  return /\d{8,}/.test(t) || /\b\d{2}-\d{2}-\d{2}\b/.test(s);
}

/**
 * @param {{ name: string, reach: string, about: string, where: string, when: string, adviser?: string, note?: string }} r
 * @param {string} firm
 * @returns {{ ok: true, subject: string, body: string } | { ok: false, field: string, why: string }}
 */
export function meetingMessage(r, firm) {
  const name = r.name.trim();
  const reach = r.reach.trim();
  if (!name) return { ok: false, field: "name", why: "Please give your name." };
  if (!reach) return { ok: false, field: "reach", why: "Please give a phone number or an email address so we can reply." };
  for (const [field, v] of /** @type {[string, string][]} */ ([["reach", reach], ["when", r.when], ["note", r.note ?? ""]])) {
    if (looksSensitive(field === "reach" ? v.replace(/^\+?\d[\d ]{7,17}$/, "") : v)) return { ok: false, field, why: "Please don't send account, card or sort-code numbers here. We will never ask for them by email." };
  }
  const lines = [
    `Hello ${firm},`,
    "",
    `I would like to arrange a first meeting${r.about ? ` about ${r.about}` : ""}.`,
    r.where ? `Where: ${r.where}` : "",
    r.when.trim() ? `When suits me: ${r.when.trim()}` : "",
    r.adviser ? `I'd like to meet: ${r.adviser}` : "",
    (r.note ?? "").trim() ? `\n${(r.note ?? "").trim()}` : "",
    "",
    `${name}`,
    reach,
  ].filter((l, i, a) => l !== "" || (a[i - 1] ?? "") !== "");
  return { ok: true, subject: `First meeting: ${name}`, body: lines.join("\n").trim() };
}

/** @param {string} email @param {{ subject: string, body: string }} m */
export const mailHref = (email, m) => `mailto:${email}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.body)}`;
