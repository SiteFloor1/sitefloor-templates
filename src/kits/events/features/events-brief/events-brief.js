// @ts-check
/**
 * Start your event: keeps the WhatsApp and email links written as the brief is filled in, shows the message, and with
 * the date check on says whether the chosen date is free (from the same diary as the hero; never guessed).
 */
import { briefMessage, statusOf, dateWords } from "../../lib/events.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data).events;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-eb-form]"));
  const wa = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-eb-wa]"));
  const mail = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-eb-mail]"));
  const preview = root.querySelector("[data-eb-preview]"), note = root.querySelector("[data-eb-date-note]");
  if (!data || !form || !wa || !mail || !preview) throw new Error("brief markup missing");
  const field = (/** @type {string} */ k) => /** @type {HTMLInputElement|null} */ (form.querySelector(`[data-eb="${k}"]`));
  const to = mail.href.replace(/^mailto:/, "").split("?")[0];
  /** @type {any} */ let diary = null;
  ctx.watch("eventDates", (d) => { diary = d; draw(); });
  const draw = () => {
    const g = Number.parseInt(field("guests")?.value ?? "", 10);
    const b = {
      type: field("type")?.value || undefined, date: field("date")?.value || undefined, flexible: field("flexible")?.checked,
      guests: Number.isInteger(g) ? g : undefined, budget: field("budget")?.value || undefined, venue: field("venue")?.value || undefined,
      name: field("name")?.value, note: field("note")?.value,
    };
    const text = briefMessage(data.name, b);
    preview.textContent = text;
    wa.href = ctx.waHref(text);
    mail.href = `mailto:${to}?subject=${encodeURIComponent(`${b.type ?? "Event"}: a brief`)}&body=${encodeURIComponent(text)}`;
    if (note) note.textContent = b.date && diary?.ok ? dateWords(statusOf(diary.taken, b.date), b.date) : "";
    ctx.share("briefDate", b.date ?? "");
  };
  const d = field("date"); if (d) d.min = ctx.now().date;
  form.addEventListener("input", draw);
  form.addEventListener("submit", (e) => e.preventDefault());
  draw();
}
