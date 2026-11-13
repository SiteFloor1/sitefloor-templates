// @ts-check
/**
 * Is our date free? Reads the studio's diary through its provider (the sheet, or example data on a demo), answers for
 * the date chosen, and builds the WhatsApp message. Fails closed: an unreadable or stale diary says "send it to us",
 * never "free". With sunset-line on, adds that day's sunset at the place chosen. The date is shared with the delivery
 * timeline and the light planner (ctx.share("wedding")).
 */
import { answerFor, ANSWER_WORDS, dateText } from "../../lib/dates.js";
import { dayLight } from "../../lib/sun.js";
import { ukDate, isYmd } from "../../../../core/lib/diary.js";

/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx) => Promise<import("../../lib/dates.js").Diary> }} DatesProvider */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).weddingfilm;
  const date = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-dc-date]"));
  const venue = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-dc-venue]"));
  const place = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-dc-place]"));
  const answer = root.querySelector("[data-dc-answer]");
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-dc-send]"));
  if (!cfg?.dates || !date || !venue || !answer || !send) throw new Error("date check markup missing");
  /** @type {DatesProvider|undefined} */ const provider = ctx.providers.weddingDates;
  const diary = provider ? provider.load(ctx).catch(() => /** @type {const} */ ({ ok: false, reason: "unreadable" })) : Promise.resolve(/** @type {const} */ ({ ok: false, reason: "unreadable" }));
  let run = 0;

  const update = async () => {
    const mine = ++run, ymd = date.value;
    if (!isYmd(ymd)) { answer.textContent = "Choose your date to see if it's free."; send.href = ctx.bookHref(dateText(cfg.dates.message, { date: "", venue: venue.value, answer: "ask" })); return; }
    const d = await diary;
    if (mine !== run) return;
    const a = answerFor(d, ymd, ctx.now().date);
    const p = cfg.sunset && place ? cfg.places.find((/** @type {any} */ x) => x.id === place.value) : null;
    const light = p && a !== "past" ? dayLight(ymd, p.lat, p.lon, p.tz) : null;
    answer.textContent = a === "ask" ? `${ukDate(ymd)}: ${ANSWER_WORDS.ask}` : `${ukDate(ymd)} ${ANSWER_WORDS[a]}`;
    if (light?.sunset) answer.textContent += ` The sun sets at ${light.sunset}${p ? ` around ${p.name}` : ""}.`;
    answer.setAttribute("data-answer", a);
    send.href = ctx.bookHref(dateText(cfg.dates.message, { date: ymd, venue: venue.value, answer: a, sunset: light?.sunset ?? undefined }));
    ctx.share("wedding", ymd);
  };
  date.addEventListener("change", update);
  venue.addEventListener("input", update);
  place?.addEventListener("change", update);
  update();
}
