// @ts-check
/**
 * The timetable, drawn from the studio's week and the visitor's own clock: the next four classes in the hero, and the
 * week as seven day tabs below. Classes that have started drop off; places come from the studio's sheet when
 * "spaces-left" is on (shared as "places"), drawn as the room's reformers. A full class becomes a waitlist message
 * when "waitlist" is on. With "your-week" on, each class in the week can be ticked to add to the calendar.
 */
import { upcoming, weekFrom, saidTime, dayName, shortDay, reformerMarks, placesWords, waitlistText } from "../../lib/classes.js";
import { toMinutes } from "../../../../core/lib/hours.js";

/** @typedef {import("../../lib/classes.js").Session} Session */

/** @type {Set<string>} keys ticked for "your week", kept across redraws */
const picked = new Set();

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), pl = data.pilates;
  if (!pl) throw new Error("pilates data missing");
  const mode = root.dataset.tt;
  /** @type {import("../../lib/places.js").Places} */
  let places = { ok: false };
  let day = "";

  /** @param {string} id */
  const cls = (id) => pl.classes[id] ?? { name: id, minutes: 50 };
  /** @param {Session} s */
  const leftOf = (s) => (places.ok && Object.hasOwn(places.left, s.key) ? places.left[s.key] : null);

  /** The reformers as marks: filled booked, open free. @param {number|null} left */
  const marks = (left) => {
    const m = reformerMarks(pl.reformers, left);
    const box = document.createElement("span");
    box.className = "pl-six";
    if (!m) { box.hidden = true; return box; }
    box.setAttribute("role", "img");
    const free = m.filter((b) => !b).length;
    box.setAttribute("aria-label", free ? `${m.length - free} of ${m.length} reformers booked, ${free} free` : `All ${m.length} reformers booked`);
    for (const booked of m) { const i = document.createElement("i"); if (!booked) i.className = "o"; box.append(i); }
    return box;
  };

  /** Book, or the waitlist on a full class (or just "Full" without one). @param {Session} s @param {number|null} left @param {string} label */
  const action = (s, left, label) => {
    const name = cls(s.class).name, words = { class: name, day: dayName(s.date), time: saidTime(s.time) };
    if (left === 0 && pl.waitlist) {
      const a = document.createElement("a");
      a.href = ctx.waHref(waitlistText(pl.waitlist, words)); a.target = "_blank"; a.rel = "noopener";
      a.textContent = "Waitlist"; a.dataset.ttWait = "";
      return a;
    }
    if (left === 0) { const sp = document.createElement("span"); sp.textContent = "Full"; return sp; }
    const a = document.createElement("a");
    a.href = ctx.bookHref(waitlistText(pl.book, words)); a.target = "_blank"; a.rel = "noopener";
    a.textContent = label; a.dataset.ttGo = "";
    return a;
  };

  const renderToday = () => {
    const now = ctx.now();
    const list = root.querySelector("[data-tt-list]"), label = root.querySelector("[data-tt-label]"), date = root.querySelector("[data-tt-date]");
    if (!list || !label || !date) throw new Error("timetable markup missing");
    const next = upcoming(pl, data.hours, now, 4);
    const first = next[0]?.date ?? now.date;
    label.textContent = first === now.date ? "Today" : next.length ? (first === addDay(now.date) ? "Tomorrow" : "Next") : "This week";
    date.textContent = next.length ? dayName(first) : "No classes in the next four weeks";
    list.replaceChildren(...next.map((s) => {
      const left = leftOf(s), c = cls(s.class);
      const li = document.createElement("li"); li.className = "pl-slot"; li.dataset.key = s.key;
      const go = action(s, left, "");
      go.classList.add("pl-slot-a");
      const t = document.createElement("time"); t.className = "pl-slot-t"; t.dateTime = `${s.date}T${s.time}`;
      t.textContent = s.date === first ? saidTime(s.time) : `${shortDay(s.date)}, ${saidTime(s.time)}`;
      const n = document.createElement("span"); n.className = "pl-slot-c"; n.textContent = c.name;
      const l = document.createElement("span"); l.className = "pl-slot-l";
      l.textContent = left === null ? `${c.minutes} min` : left === 0 ? (pl.waitlist ? "Full · join the waitlist" : "Full") : placesWords(left);
      go.replaceChildren(t, n, marks(left), l);
      li.append(go);
      return li;
    }));
  };

  const renderWeek = () => {
    const now = ctx.now();
    const tabs = root.querySelector("[data-tt-days]");
    if (!tabs) throw new Error("timetable markup missing");
    const week = weekFrom(pl, data.hours, now.date);
    if (!week.some((d) => d.date === day)) {
      // Start on today, or on tomorrow once today's last class has started.
      const todayLeft = week[0].classes.some((s) => toMinutes(s.time) > now.minutes);
      day = todayLeft || !week[1] ? now.date : week[1].date;
    }
    const pick = Boolean(root.querySelector('[data-feature="your-week"]'));
    tabs.replaceChildren(...week.map((d, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "pl-day"; b.setAttribute("role", "tab"); b.id = `pl-day-${i}`;
      b.setAttribute("aria-selected", String(d.date === day)); b.dataset.day = d.date;
      b.textContent = i === 0 ? "Today" : shortDay(d.date);
      return b;
    }));
    for (const ol of root.querySelectorAll("[data-tt-rows]")) ol.remove();
    const anchor = tabs;
    const lists = week.map((d) => {
      const ol = document.createElement("ol");
      ol.className = "pl-rows"; ol.dataset.ttRows = d.date; ol.setAttribute("aria-label", dayName(d.date)); ol.hidden = d.date !== day;
      const live = d.classes.filter((s) => !(s.date === now.date && toMinutes(s.time) <= now.minutes));
      if (!live.length) {
        const li = document.createElement("li"); li.className = "pl-row pl-row-none";
        li.textContent = d.classes.length ? "That's today's last class gone. The week carries on tomorrow." : "No classes this day.";
        ol.append(li);
      }
      for (const s of live) {
        const c = cls(s.class), left = leftOf(s);
        const li = document.createElement("li"); li.className = "pl-row"; li.dataset.key = s.key;
        if (left === 0) li.dataset.full = "";
        const t = document.createElement("time"); t.className = "pl-row-t"; t.dateTime = `${s.date}T${s.time}`; t.textContent = saidTime(s.time);
        const n = document.createElement("span"); n.className = "pl-row-c";
        const b = document.createElement("b"); b.textContent = c.name;
        const x = document.createElement("span");
        x.textContent = [`${c.minutes} min`, c.level, s.teacher, left === null ? "" : placesWords(left)].filter(Boolean).join(" · ");
        n.append(b, x);
        const go = action(s, left, "Book"); go.classList.add("pl-row-go");
        const parts = [t, n, marks(left), go];
        if (pick) {
          const lab = document.createElement("label"); lab.className = "pl-pick";
          const box = document.createElement("input"); box.type = "checkbox"; box.id = `yw-${s.key.replace(/[^0-9]/g, "")}`;
          Object.assign(box.dataset, { ywPick: "", date: s.date, time: s.time, name: c.name, minutes: String(c.minutes) });
          box.checked = picked.has(s.key);
          box.addEventListener("change", () => { if (box.checked) picked.add(s.key); else picked.delete(s.key); });
          const sr = document.createElement("span"); sr.className = "sr-only"; sr.textContent = `Add ${c.name}, ${dayName(s.date)} at ${saidTime(s.time)}, to my week`;
          lab.append(box, sr);
          parts.unshift(lab);
        }
        li.append(...parts);
        ol.append(li);
      }
      return ol;
    });
    anchor.after(...lists);
    root.dispatchEvent(new CustomEvent("tt:drawn", { bubbles: false }));
  };

  /** @param {string} d */
  const addDay = (d) => { const x = new Date(`${d}T12:00:00Z`); x.setUTCDate(x.getUTCDate() + 1); return x.toISOString().slice(0, 10); };
  /** The phone bar: the next class, its reformers, and Book (or the waitlist). */
  const renderBar = () => {
    const name = root.querySelector("[data-tt-bar-name]"), go = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-tt-bar-go]"));
    const box = root.querySelector("[data-tt-marks]");
    if (!name || !go || !box) throw new Error("phone bar markup missing");
    const now = ctx.now();
    const s = upcoming(pl, data.hours, now, 1)[0];
    if (!s) return;
    const left = leftOf(s), c = cls(s.class);
    name.textContent = `${s.date === now.date ? "" : `${shortDay(s.date)}, `}${saidTime(s.time)} ${c.name}`;
    box.replaceWith(Object.assign(marks(left), { className: "pl-six" }));
    root.querySelector(".pl-six")?.setAttribute("data-tt-marks", "");
    const a = action(s, left, "Book");
    go.href = a instanceof HTMLAnchorElement ? a.href : go.href;
    go.textContent = left === 0 ? (pl.waitlist ? "Join the waitlist" : "Full") : left === null ? "Book" : `Book, ${placesWords(left)}`;
    go.removeAttribute("data-wa-text");
  };
  const render = () => (mode === "today" ? renderToday() : mode === "bar" ? renderBar() : renderWeek());

  if (mode === "week") {
    root.addEventListener("click", (e) => {
      const b = /** @type {HTMLElement} */ (e.target).closest("[data-day]");
      if (!b || !root.contains(b)) return;
      day = /** @type {HTMLElement} */ (b).dataset.day ?? day;
      for (const t of root.querySelectorAll("[data-day]")) t.setAttribute("aria-selected", String(/** @type {HTMLElement} */ (t).dataset.day === day));
      for (const ol of root.querySelectorAll("[data-tt-rows]")) /** @type {HTMLElement} */ (ol).hidden = /** @type {HTMLElement} */ (ol).dataset.ttRows !== day;
    });
    root.addEventListener("keydown", (e) => {
      const t = /** @type {HTMLElement} */ (e.target);
      if (!t.matches("[data-day]") || (e.key !== "ArrowRight" && e.key !== "ArrowLeft")) return;
      const all = [...root.querySelectorAll("[data-day]")];
      const next = /** @type {HTMLElement|undefined} */ (all[(all.indexOf(t) + (e.key === "ArrowRight" ? 1 : all.length - 1)) % all.length]);
      next?.focus(); next?.click();
    });
  }
  ctx.watch("places", (p) => { places = p ?? { ok: false }; render(); });
  render();
  ctx.everyMinute(render);
}
