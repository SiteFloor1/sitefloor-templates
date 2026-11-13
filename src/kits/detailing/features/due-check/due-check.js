// @ts-check
/** Is my car due? The chosen item's due day from the day it was last done, the reminder file and the WhatsApp message. */
import { dueOn, daysUntil, dueWords, dueIcs } from "../../lib/dates.js";
import { isYmd } from "../../../../core/lib/diary.js";
import { download } from "../first-wash/download.js";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
/** "Sunday 10 January 2027". @param {string} ymd */
const long = (ymd) => { const d = new Date(`${ymd}T12:00:00Z`); return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), dc = data.detailing.due;
  const form = root.querySelector("[data-dc-form]"), date = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-dc-date]"));
  const when = root.querySelector("[data-dc-when]"), on = root.querySelector("[data-dc-on]");
  const cal = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-dc-cal]")), go = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-dc-go]"));
  if (!form || !date || !when || !on || !cal || !go || !dc) throw new Error("due check markup missing");
  const today = ctx.now().date;
  date.max = today;
  /** @type {{ item: any, due: string }|null} */ let now = null;
  const update = () => {
    const item = dc.items.find((/** @type {any} */ x) => x.id === (/** @type {HTMLInputElement|null} */ (form.querySelector("[name=dt-due]:checked")))?.value);
    if (!item || !isYmd(date.value) || date.value > today) {
      now = null; cal.disabled = true;
      when.textContent = date.value > today ? "That day hasn't happened yet." : "Pick the day it was last done.";
      on.textContent = " ";
      go.href = ctx.waHref(dc.message);
      return;
    }
    const due = dueOn(date.value, item);
    now = { item, due };
    cal.disabled = false;
    when.textContent = dueWords(daysUntil(due, today));
    on.textContent = `${item.name}: ${long(due)}.`;
    go.href = ctx.waHref(`${dc.message}\n\n${item.name}: last done ${date.value.split("-").reverse().join("/")}, due ${due.split("-").reverse().join("/")}.`);
  };
  form.addEventListener("change", update);
  form.addEventListener("input", update);
  form.addEventListener("submit", (e) => e.preventDefault());
  cal.addEventListener("click", () => {
    if (!now) return;
    download(dueIcs({ item: now.item, due: now.due, business: data.name, place: data.detailing.place, tz: data.hours.timezone, stamp: new Date() }), `${data.name}-${now.item.id}-due.ics`);
    on.textContent = `${now.item.name}: a reminder at 9am on ${long(now.due)}.`;
  });
  update();
}
