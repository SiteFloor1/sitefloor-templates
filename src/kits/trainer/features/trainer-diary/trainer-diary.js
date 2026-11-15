// @ts-check
/**
 * The diary: reads the trainer's open hours once per page and every minute after, marks the hours that have gone, and
 * offers the open ones. Shares "diary" ({ ok, open: [{ date, time }] }, open hours still to come, earliest first) for
 * the hero line, the phone bar and the first month.
 */
import { diaryWeek, countWord, weekdayIndex } from "../../lib/trainer.js";

/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx) => Promise<import("../../lib/trainer.js").Diary> }} DiaryProvider */

const DAY = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** "Wednesday 18 November" @param {string} ymd */
export const longDate = (ymd) => `${DAY[weekdayIndex(ymd)]} ${Number(ymd.slice(8))} ${MON[Number(ymd.slice(5, 7)) - 1]}`;
/** A time in the look's figures, each digit in an equal box. @param {string} t */
export const tab = (t) => `<span class="tn">${[...t].map((c) => (c === ":" ? '<i class="tc">:</i>' : `<i>${c}</i>`)).join("")}</span>`;

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).trainer.diary;
  const grid = /** @type {HTMLElement} */ (root.querySelector("[data-td-grid]"));
  const pick = /** @type {HTMLElement} */ (root.querySelector("[data-td-pick]"));
  const go = /** @type {HTMLAnchorElement} */ (root.querySelector("[data-td-go]"));
  const photo = /** @type {HTMLElement|null} */ (root.querySelector("[data-td-photo]"));
  const week = /** @type {HTMLElement} */ (root.querySelector("[data-td-week]"));
  const count = /** @type {HTMLElement} */ (root.querySelector("[data-td-count]"));
  const provider = /** @type {DiaryProvider|null} */ (ctx.providers.diary);
  if (!grid || !pick || !go) throw new Error("diary markup missing");
  /** @type {{ date: string, time: string }[]} */
  let open = [];
  /** @type {string|null} */
  let chosen = null;

  /** @param {{ date: string, time: string }} h */
  const choose = (h) => {
    chosen = `${h.date} ${h.time}`;
    grid.querySelectorAll("button.td-o").forEach((b) => b.setAttribute("aria-pressed", String(/** @type {HTMLElement} */ (b).dataset.at === chosen)));
    pick.innerHTML = `<b>${longDate(h.date)}, ${tab(h.time)}</b><small>One hour, the studio to yourselves. From £${cfg.priceFrom}.</small>`;
    const text = `Hello, may I have ${longDate(h.date)} at ${h.time}?`;
    go.href = ctx.bookHref(text);
    if (go.dataset.waText !== undefined) go.dataset.waText = text;
    go.textContent = "Ask for this hour";
  };

  /** @param {import("../../lib/trainer.js").Diary} r */
  const paint = (r) => {
    const now = ctx.now();
    const w = diaryWeek(cfg, r.ok ? r.open : [], now.date, now.minutes);
    open = r.ok ? w.open : [];
    root.dataset.state = r.ok ? "ok" : "closed";
    week.textContent = `Week of ${Number(w.monday.slice(8))} ${MON[Number(w.monday.slice(5, 7)) - 1]}`;
    count.textContent = r.ok ? `${open.length} open` : "";
    w.days.forEach((d) => {
      const head = root.querySelector(`[data-td-day="${d.key}"]`);
      head?.classList.toggle("gone", d.gone);
      const dt = head?.querySelector("[data-td-date]");
      if (dt) dt.textContent = String(Number(d.date.slice(8)));
      d.cells.forEach((c) => {
        const cell = /** @type {HTMLElement|null} */ (root.querySelector(`[data-td-cell="${d.key} ${c.time}"]`));
        if (!cell) return;
        cell.classList.toggle("past", c.passed);
        const at = `${d.date} ${c.time}`;
        if (c.open) {
          if (!cell.querySelector("button")) cell.innerHTML = `<button type="button" class="td-o" data-at="${at}" aria-pressed="false" aria-label="${longDate(d.date)}, ${c.time}, open">${tab(c.time)}</button>`;
        } else cell.textContent = "";
      });
    });
    // The photograph covers spoken-for hours only: an open hour inside its block shows the cells instead.
    if (photo && cfg.block) {
      const b = cfg.block;
      const inside = open.some((h) => b.days.some((/** @type {string} */ k) => w.days.find((d) => d.key === k)?.date === h.date) && h.time >= b.from && h.time <= b.to);
      photo.hidden = inside;
    }
    if (!open.length) {
      chosen = null;
      pick.innerHTML = r.ok ? "<b>The week is full.</b><small>Message for the first free hour next week.</small>" : `<b>Times are arranged by message.</b><small>One hour, the studio to yourselves. From £${cfg.priceFrom}.</small>`;
      go.textContent = "Message for times";
    } else if (!chosen || !open.some((h) => `${h.date} ${h.time}` === chosen)) choose(open[0]);
    else choose(/** @type {any} */ (open.find((h) => `${h.date} ${h.time}` === chosen)));
    // Outside the diary: the hero's sentence and the phone bar's next hour.
    const sentence = document.querySelector("[data-td-sentence]");
    if (sentence) sentence.textContent = !r.ok ? "" : open.length === 1 ? " One hour is still open. Tap it to ask for it." : open.length ? ` ${countWord(open.length)} hours are still open. Tap one to ask for it.` : " This week is full.";
    const next = document.querySelector("[data-td-next]");
    if (next && open[0]) next.innerHTML = `Next private hour<b>${longDate(open[0].date).replace(/^(\w{3})\w*/, "$1,").replace(/ (\d+) (\w{3})\w*$/, " $1 $2")}, ${tab(open[0].time)}</b>`;
    ctx.share("diary", { ok: r.ok, open, words: r.ok ? countWord(open.length) : null });
  };

  grid.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement|null} */ (/** @type {HTMLElement} */ (e.target).closest("button.td-o"));
    if (!b?.dataset.at) return;
    const [date, time] = b.dataset.at.split(" ");
    choose({ date, time });
  });
  if (!provider) { paint({ ok: false }); return; }
  const load = () => provider.load(ctx).then(paint, () => paint({ ok: false }));
  load();
  ctx.everyMinute(() => { if (!document.hidden) load(); });
}
