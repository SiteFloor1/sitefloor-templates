// @ts-check
/** Hands the visitor a calendar file. @param {string} text @param {string} name file name without .ics */
export function saveIcs(text, name) {
  const doc = globalThis.document;
  const a = doc.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/calendar" }));
  a.download = `${name}.ics`;
  doc.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
