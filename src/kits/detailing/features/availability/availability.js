// @ts-check
/**
 * The next start for each package, from the studio's diary (simulated on a demo, its published sheet otherwise):
 * the first run of free working days as long as the job. Asking for that date opens WhatsApp with the studio's
 * message. If the diary can't be read or is stale, every row keeps "Ask for a date".
 */
import { nextStart } from "../../lib/dates.js";
import { ukDate } from "../../../../core/lib/diary.js";
import { addDays } from "../../../../core/lib/hours.js";

/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx) => Promise<import("../../lib/dates.js").Diary> }} DiaryProvider */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).detailing.diary;
  const provider = /** @type {DiaryProvider|null} */ (ctx.providers.detailDiary);
  const note = root.querySelector("[data-av-note]");
  if (!cfg || !provider || !note) throw new Error("availability markup or diary missing");
  const draw = async () => {
    const diary = await provider.load(ctx).catch(() => /** @type {const} */ ({ ok: false, reason: "unreadable" }));
    if (!diary.ok) { note.textContent = "Ask us for the next free date: we'll reply with what we have."; return; }
    const from = addDays(ctx.now().date, 1);
    for (const row of /** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll("[data-av-for]"))) {
      const when = row.querySelector("[data-av-when]"), go = /** @type {HTMLAnchorElement|null} */ (row.querySelector("[data-av-go]"));
      if (!when || !go) continue;
      const run = nextStart(diary.days, from, Number(row.dataset.avDays) || 1, cfg.workdays);
      if (!run) { when.textContent = "Ask for a date"; continue; }
      const day = ukDate(run.start).replace(/ \d{4}$/, "");
      when.textContent = day;
      go.textContent = "Ask for it";
      go.href = ctx.waHref(cfg.message.replace("{date}", day).replace("{package}", row.dataset.avName ?? ""));
    }
    note.textContent = "From the studio's diary. We confirm the date when you book.";
  };
  draw();
}
