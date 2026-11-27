// @ts-check
/** Key dates: the agency's milestones worked back from the brief's date, listed and saved as one calendar file (.ics). */
import { keyDates, icsFile, dayMonth } from "../../lib/events.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data).events;
  const list = root.querySelector("[data-ek-list]"), intro = root.querySelector("[data-ek-intro]");
  const save = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-ek-save]"));
  if (!data?.keyDates || !list || !intro || !save) throw new Error("key dates markup missing");
  const first = intro.textContent ?? "";
  /** @type {{ label: string, date: string }[]} */ let dates = [];
  ctx.watch("briefDate", (/** @type {string} */ when) => {
    dates = when ? keyDates(when, data.keyDates, ctx.now().date) : [];
    list.replaceChildren(...dates.map((k) => {
      const li = root.ownerDocument.createElement("li");
      const t = Object.assign(root.ownerDocument.createElement("time"), { dateTime: k.date, textContent: dayMonth(k.date) });
      li.append(t, ` ${k.label}`);
      return li;
    }));
    intro.textContent = !when ? first : dates.length ? "Worked back from your date:" : "Your date is close: we'll plan the next steps with you.";
    save.hidden = !dates.length;
  });
  save.addEventListener("click", () => {
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const blob = new Blob([icsFile(data.name, dates, stamp, data.host)], { type: "text/calendar" });
    const a = Object.assign(root.ownerDocument.createElement("a"), { href: URL.createObjectURL(blob), download: `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-key-dates.ics` });
    root.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
}
