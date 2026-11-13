// @ts-check
/** Hands the visitor a calendar file to open: a temporary link to a Blob, clicked once. @param {string} text @param {string} name */
export function download(text, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/calendar" }));
  a.download = name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
