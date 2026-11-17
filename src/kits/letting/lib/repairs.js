// @ts-check
/** The repair report as one WhatsApp message. Empty answers are left out. Pure logic, no DOM. */

/** @param {string} start @param {{ home: string, what: string, where: string, keys: string }} a */
export function repairText(start, a) {
  const lines = [start.trim()];
  if (a.home.trim()) lines.push(`Home: ${a.home.trim()}`);
  if (a.what.trim()) lines.push(`What's wrong: ${a.what.trim()}`);
  if (a.where.trim()) lines.push(`Where: ${a.where.trim()}`);
  if (a.keys.trim()) lines.push(`Access: ${a.keys.trim()}`);
  return lines.join("\n");
}
