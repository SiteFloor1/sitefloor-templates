// @ts-check
/** Hands a calendar file to the visitor's device (their calendar app opens it). @param {string} file @param {string} name */
export function saveIcs(file, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([file], { type: "text/calendar" }));
  a.download = name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/** Now as an iCalendar UTC stamp. */
export const stamp = () => new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
