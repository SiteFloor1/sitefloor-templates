// @ts-check
/** The owner's two messages: a valuation request (no figure is worked out: the agent replies) and the onboarding checklist. Pure logic. */

/**
 * @param {string} start the agent's opening line
 * @param {{ address: string, postcode: string, kind: string, beds: string, baths: string, size: string, unit: string, outside: string, furnished: string, when: string, service: string }} a
 */
export function valuationText(start, a) {
  const t = (/** @type {string} */ s) => s.trim();
  const size = t(a.size) ? `${t(a.size)} ${a.unit === "sqft" ? "sq ft" : "m²"}` : "";
  const lines = [t(start), ""];
  const home = [t(a.beds) && `${t(a.beds)} bedroom${t(a.beds) === "1" ? "" : "s"}`, t(a.baths) && `${t(a.baths)} bathroom${t(a.baths) === "1" ? "" : "s"}`, t(a.kind).toLowerCase(), size && `about ${size}`].filter(Boolean).join(", ");
  if (t(a.address) || t(a.postcode)) lines.push(`Address: ${[t(a.address), t(a.postcode).toUpperCase()].filter(Boolean).join(", ")}`);
  if (home) lines.push(`The home: ${home}`);
  if (t(a.outside)) lines.push(`Outside: ${t(a.outside)}`);
  if (t(a.furnished)) lines.push(`Furnished: ${t(a.furnished)}`);
  if (t(a.when)) lines.push(`Free from: ${t(a.when)}`);
  if (t(a.service)) lines.push(`Interested in: ${t(a.service)}`);
  return lines.join("\n").trim();
}

/** @param {string} start @param {string[]} ready @param {string[]} missing */
export function checklistText(start, ready, missing) {
  const lines = [start.trim()];
  if (ready.length) lines.push("", "Ready:", ...ready.map((x) => `- ${x}`));
  if (missing.length) lines.push("", "Still to sort:", ...missing.map((x) => `- ${x}`));
  return lines.join("\n");
}
