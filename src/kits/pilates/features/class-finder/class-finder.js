// @ts-check
/**
 * Find your first class: the three answers pick the studio's own class (lib findClass), then its next three times,
 * each with places when known and a Book link.
 */
import { findClass, upcoming, dayName, shortDay, saidTime, placesWords, waitlistText } from "../../lib/classes.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), pl = data.pilates;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-cf-form]"));
  const name = root.querySelector("[data-cf-class]"), text = root.querySelector("[data-cf-text]"), times = root.querySelector("[data-cf-times]");
  if (!pl?.finder || !form || !name || !text || !times) throw new Error("class finder markup missing");
  /** @type {import("../../lib/places.js").Places} */
  let places = { ok: false };
  const val = (/** @type {string} */ n) => /** @type {HTMLInputElement|null} */ (form.querySelector(`input[name="${n}"]:checked`))?.value ?? "";
  const render = () => {
    const pick = findClass({ isNew: val("cf-new") === "yes", pace: /** @type {any} */ (val("cf-pace") || "steady"), pregnancy: val("cf-preg") === "yes" }, pl.finder);
    const c = pl.classes[pick.class];
    name.textContent = c.name;
    text.textContent = [c.text, pick.why === "pregnancy" ? "Tell your teacher how far along you are, or when your baby was born." : ""].filter(Boolean).join(" ");
    const now = ctx.now();
    const next = upcoming(pl, data.hours, now, 3, pick.class);
    times.replaceChildren(...(next.length ? next.map((s) => {
      const left = places.ok && Object.hasOwn(places.left, s.key) ? places.left[s.key] : null;
      const li = document.createElement("li");
      const when = document.createElement("span");
      when.textContent = `${s.date === now.date ? "Today" : shortDay(s.date)}, ${saidTime(s.time)}${left === null ? "" : ` · ${placesWords(left)}`}`;
      const a = document.createElement("a");
      const words = { class: c.name, day: dayName(s.date), time: saidTime(s.time) };
      if (left === 0 && pl.waitlist) { a.href = ctx.waHref(waitlistText(pl.waitlist, words)); a.textContent = "Waitlist"; }
      else { a.href = ctx.bookHref(waitlistText(pl.book, words)); a.textContent = left === 0 ? "Full" : "Book"; }
      a.target = "_blank"; a.rel = "noopener";
      li.append(when, a);
      return li;
    }) : [Object.assign(document.createElement("li"), { textContent: "Not on the timetable in the next four weeks. Ask the studio." })]));
  };
  form.addEventListener("change", render);
  ctx.watch("places", (p) => { places = p ?? { ok: false }; render(); });
  render();
  ctx.everyMinute(render);
}
