// @ts-check
/**
 * Will I make it?: done-by time, the cut and where they're coming from give a straight answer,
 * a timeline (walk, wait, cut, walk back) against their deadline, and a leave-by time.
 * The wait comes only from the live queue. Without it the answer assumes no queue and says so,
 * with the usual busyness as a word. Before opening it plans from today's opening time.
 * If it won't fit, it suggests the quietest time left today with a calendar reminder.
 */
import { planVisit, bestTimeToday, reminderIcs } from "../../core/lib/fit-cut.js";
import { waitMinutes, busyHours, BUSY_WORDS } from "../../core/lib/queue.js";
import { formatTime12, DAY_KEYS, DAY_NAMES, rangesFor, toMinutes, wallTimeToUtc } from "../../core/lib/hours.js";

/** @typedef {ReturnType<typeof planVisit>} Plan */
/** @typedef {"live"|"usual"|"opening"|"closed"} Mode */
/** @typedef {{ now: import("../../core/lib/hours.js").ZonedNow, status: import("../../core/lib/hours.js").OpenStatus, svc: any, travel: number, back: boolean, from: string, deadline: number, wait: number, mode: Mode, start: number, opensAt: number, closesAt: number|null, today: { hour: number, level: number }[] }} Situation */

/** @param {number} m */
const hhmm = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
/** @param {string} t */
const strong = (t) => Object.assign(document.createElement("b"), { textContent: t });

/** @type {import("../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-fc-form]"));
  const cfg = ctx.data.queue;
  if (!form || !cfg) throw new Error("fit-a-cut markup or queue data missing");
  const $ = (/** @type {string} */ s) => /** @type {HTMLElement} */ (root.querySelector(s));
  const out = $("[data-fc-out]"), timeInput = /** @type {HTMLInputElement} */ ($("[data-fc-time]"));
  /** @type {{ ok: boolean, waiting?: number, updatedAt?: number }} */
  let live = { ok: false };
  let reminderUrl = "";
  const picked = (/** @type {string} */ name) => /** @type {HTMLInputElement|null} */ (form.querySelector(`input[name="${name}"]:checked`));

  /**
   * When they'd set off and which answer we can give: live, open without a live number, opening later today, or closed.
   * @param {import("../../core/lib/hours.js").ZonedNow} now @param {import("../../core/lib/hours.js").OpenStatus} status @param {number} travel
   * @returns {{ mode: Mode, start: number, opensAt: number, closesAt: number|null }}
   */
  const windowFor = (now, status, travel) => {
    if (status.open) return { mode: live.ok ? "live" : "usual", start: now.minutes, opensAt: 0, closesAt: status.closesAt };
    const next = status.nextOpen;
    const range = next && next.date === now.date ? rangesFor(ctx.data.hours, now.date).ranges.find((r) => toMinutes(r[0]) === next.minutes) : undefined;
    if (!next || !range) return { mode: "closed", start: now.minutes, opensAt: 0, closesAt: null };
    // opens later today: plan as if they set off to arrive at opening time
    return { mode: "opening", start: Math.max(now.minutes, next.minutes - travel), opensAt: next.minutes, closesAt: toMinutes(range[1]) };
  };

  /** @returns {Situation} */
  const read = () => {
    const now = ctx.now(), status = ctx.status();
    const svc = ctx.data.services.find((s) => s.id === picked("fc-cut")?.value) ?? ctx.data.services[0];
    const fromEl = picked("fc-from");
    const travel = Number(fromEl?.value ?? 0);
    const back = travel > 0 && /** @type {HTMLInputElement} */ ($("[data-fc-back]")).checked;
    if (!timeInput.value) timeInput.value = hhmm(Math.ceil((now.minutes + 45) / 5) * 5);
    const inPick = picked("fc-in")?.value ?? "45";
    const [th, tm] = timeInput.value.split(":").map(Number);
    let deadline = inPick === "at" ? th * 60 + tm : now.minutes + Number(inPick);
    if (deadline < now.minutes) deadline += 24 * 60; // earlier than now = tomorrow; it simply won't fit today
    const today = busyHours(cfg.busyness, ctx.data.hours, DAY_KEYS[now.weekday]);
    const { mode, start, opensAt, closesAt } = windowFor(now, status, travel);
    const wait = mode === "live" ? waitMinutes(live.waiting ?? 0, cfg.chairs, cfg.minutesPerCut) : 0;
    return { now, status, svc, travel, back, from: fromEl?.dataset.fcLabel ?? "", deadline, wait, mode, start, opensAt, closesAt, today };
  };

  /** @param {Situation} s @param {Plan} p */
  const paintVerdict = (s, p) => {
    out.classList.toggle("yes", p.fits);
    out.classList.toggle("no", !p.fits);
    const verdict = $("[data-fc-verdict]"), sub = $("[data-fc-sub]");
    const usual = BUSY_WORDS[s.today.find((h) => h.hour === Math.floor(s.start / 60))?.level ?? 0]?.toLowerCase();
    if (p.fits) {
      const done = `You'll be done by ${formatTime12(p.done)}.`;
      if (s.mode === "live") verdict.replaceChildren(strong("Yes."), ` ${done}`);
      else if (s.mode === "opening") verdict.replaceChildren(strong(`Yes, if you're here for ${formatTime12(s.opensAt)}.`), ` ${done}`);
      else verdict.replaceChildren(strong("Probably."), ` If there's no queue, you'll be done by ${formatTime12(p.done)}.`);
      const leave = p.leaveBy <= s.now.minutes + 1 ? "Leave now." : `Leave by ${formatTime12(p.leaveBy)} at the latest.`;
      const spare = p.spare >= 2 ? `${p.spare} min to spare${s.back ? " once you're back" : ""}. ${leave}` : "Just about. Leave now.";
      sub.textContent = s.mode === "usual" ? `It's usually ${usual} at this hour. The live queue isn't available, so ask us before you set off.` : spare;
      return;
    }
    const noQueue = s.mode === "live" ? "" : ", even with no queue";
    if (p.reason === "deadline") verdict.replaceChildren(strong("Too tight."), ` About ${-p.spare} min short${noQueue}.`);
    else if (p.reason === "closing") verdict.replaceChildren(strong("Not today."), ` We close at ${formatTime12(s.closesAt ?? 0)}, so it won't fit today.`);
    else verdict.replaceChildren(strong("Not today."), " We're closed right now.");
    sub.textContent = "Message us and we'll tell you the quietest time.";
  };

  /** @param {Situation} s @param {Plan} p */
  const paintTimeline = (s, p) => {
    const span = Math.max(s.deadline, p.finish) - s.start || 1;
    const pct = (/** @type {number} */ m) => `${Math.max(0, (m / span) * 100)}%`;
    $("[data-fc-bar]").hidden = p.reason === "closed";
    for (const [seg, m] of /** @type {[string, number][]} */ ([["go", s.travel], ["wait", s.wait], ["cut", s.svc.minutes], ["back", s.back ? s.travel : 0]])) {
      $(`[data-fc-seg="${seg}"]`).style.setProperty("--w", pct(m));
    }
    const dead = $("[data-fc-dead]"), at = (s.deadline - s.start) / span;
    dead.style.setProperty("--d", pct(s.deadline - s.start));
    dead.dataset.at = at > 0.8 ? "end" : at < 0.2 ? "start" : ""; // keep the "your time" label inside the panel
    const steps = $("[data-fc-steps]");
    steps.hidden = p.reason === "closed";
    const row = (/** @type {number} */ t, /** @type {string} */ what) => { const li = document.createElement("li"); li.append(strong(formatTime12(t)), what); return li; };
    const rows = [
      s.travel ? row(s.start, `Leave ${s.from}`) : null,
      row(p.arrive, s.mode === "opening" ? "At the shop as we open" : s.wait ? `At the shop · about ${s.wait} min wait` : s.mode === "live" ? "At the shop · straight in" : "At the shop · if there's no queue"),
      row(p.inChair, `In the chair · ${s.svc.name.toLowerCase()}, ${s.svc.minutes} min`),
      row(p.done, "Done"),
      s.back ? row(p.finish, `Back at ${s.from}`) : null,
    ];
    steps.replaceChildren(...rows.filter((x) => x !== null));
    const ago = s.mode === "live" && live.updatedAt ? Math.max(0, Math.round((Date.now() - live.updatedAt) / 60_000)) : 0;
    $("[data-fc-src]").textContent = {
      live: `Using the live queue: ${live.waiting} waiting, updated ${ago ? `${ago} min ago` : "just now"}. Times are estimates.`,
      usual: "Live queue not available: these times assume there's no queue.",
      opening: `Planned from our opening time, ${formatTime12(s.opensAt)}. Times are estimates.`,
      closed: "",
    }[s.mode];
  };

  /** @param {Situation} s @param {Plan} p */
  const paintActions = (s, p) => {
    const go = /** @type {HTMLAnchorElement} */ ($("[data-fc-go]")), remind = /** @type {HTMLAnchorElement} */ ($("[data-fc-remind]"));
    $("[data-fc-act]").hidden = false;
    go.hidden = !p.fits;
    go.href = ctx.waHref(`Hi, I'm on my way for a ${s.svc.name.toLowerCase()}, there in about ${Math.max(1, s.travel)} min.`);
    if (reminderUrl) URL.revokeObjectURL(reminderUrl);
    reminderUrl = "";
    remind.hidden = true;
    if (p.fits) return;
    const best = bestTimeToday(s.today, { now: s.start, cut: s.svc.minutes, closesAt: s.closesAt });
    const next = s.status.nextOpen;
    const when = best ? { date: s.now.date, start: best.at } : s.mode === "closed" && next ? { date: next.date, start: next.minutes } : null;
    if (!when) return;
    const day = when.date === s.now.date ? "today" : next && next.weekday === (s.now.weekday + 1) % 7 ? "tomorrow" : `on ${DAY_NAMES[next?.weekday ?? 0]}`;
    $("[data-fc-sub]").textContent = best
      ? `Best time left today: ${formatTime12(best.at)}, usually ${BUSY_WORDS[best.level].toLowerCase()}.`
      : `We open ${day} at ${formatTime12(when.start)}. Early is quietest.`;
    const [y, mo, d] = when.date.split("-").map(Number);
    const ics = reminderIcs({
      startMs: wallTimeToUtc({ year: y, month: mo, day: d, hour: Math.floor(when.start / 60), minute: when.start % 60 }, ctx.data.hours.timezone),
      minutes: s.svc.minutes, title: `${s.svc.name} at ${ctx.data.name}`,
      place: ctx.data.name, note: "Walk-in. Check the live queue before you set off.",
      uid: `${when.date}-${when.start}-${s.svc.id}@sitefloor`, stamp: new Date(),
    });
    reminderUrl = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    remind.href = reminderUrl;
    remind.download = `${s.svc.id}-reminder.ics`;
    remind.textContent = `Remind me at ${formatTime12(Math.max(0, when.start - 15))}`;
    remind.hidden = false;
  };

  const render = () => {
    const s = read();
    const p = planVisit({ now: s.start, deadline: s.deadline, travel: s.travel, back: s.back, wait: s.wait, cut: s.svc.minutes, closesAt: s.closesAt });
    paintVerdict(s, p);
    paintTimeline(s, p);
    paintActions(s, p);
  };

  form.addEventListener("input", (e) => {
    if (e.target === timeInput) { const at = /** @type {HTMLInputElement|null} */ (form.querySelector('input[name="fc-in"][value="at"]')); if (at) at.checked = true; }
    render();
  });
  ctx.watch("queue", (q) => { live = q ?? { ok: false }; render(); });
  ctx.everyMinute(render);
  render();
}
