import { test } from "node:test";
import assert from "node:assert/strict";
import { openStatus, statusLabel, zonedNow, nextOpening, toMinutes, formatTime12, weeklyRows } from "../../src/core/lib/hours.js";

const weekly = {
  mon: [["09:00", "19:00"]], tue: [["09:00", "19:00"]], wed: [["09:00", "12:00"], ["13:00", "19:00"]],
  thu: [["09:00", "20:00"]], fri: [["18:00", "02:00"]], sat: [], sun: [["10:00", "16:00"]],
};
const hours = { timezone: "Europe/London", weekly, exceptions: [{ date: "2026-12-25", ranges: [], note: "Closed for Christmas Day" }] };
// 2026-10-19 is a Monday
const at = (date, hhmm, weekday) => ({ date, weekday, minutes: toMinutes(hhmm) });

test("open during normal hours, with closing time", () => {
  const s = openStatus(hours, at("2026-10-19", "10:30", 1));
  assert.equal(s.open, true);
  assert.equal(s.closesAt, toMinutes("19:00"));
  assert.equal(statusLabel(s, at("2026-10-19", "10:30", 1)), "Open now · closes 7pm");
});

test("closed exactly at closing time (end is exclusive)", () => {
  assert.equal(openStatus(hours, at("2026-10-19", "19:00", 1)).open, false);
});

test("closed before opening says 'opens today'", () => {
  const now = at("2026-10-19", "08:15", 1);
  assert.equal(statusLabel(openStatus(hours, now), now), "Closed · opens today at 9am");
});

test("split day: closed over lunch, reopens at 1pm", () => {
  const now = at("2026-10-21", "12:30", 3);
  const s = openStatus(hours, now);
  assert.equal(s.open, false);
  assert.equal(statusLabel(s, now), "Closed · opens today at 1pm");
});

test("overnight range: open after midnight on the following day", () => {
  const s = openStatus(hours, at("2026-10-24", "01:30", 6)); // Saturday 01:30, Friday's 18:00–02:00 range
  assert.equal(s.open, true);
  assert.equal(s.closesAt, toMinutes("02:00"));
});

test("overnight range: closed at 02:00 and next opening is Sunday 10am", () => {
  const now = at("2026-10-24", "02:00", 6);
  const s = openStatus(hours, now);
  assert.equal(s.open, false);
  assert.equal(statusLabel(s, now), "Closed · opens tomorrow at 10am");
});

test("holiday exception overrides the weekly schedule and carries its note", () => {
  const s = openStatus(hours, at("2026-12-25", "11:00", 5));
  assert.equal(s.open, false);
  assert.equal(s.note, "Closed for Christmas Day");
});

test("next opening skips closed days and names the weekday", () => {
  const now = at("2026-10-24", "12:00", 6); // Saturday, closed all day
  assert.deepEqual(nextOpening(hours, now), { date: "2026-10-25", weekday: 0, minutes: toMinutes("10:00") });
});

test("never open: next opening is null and label says Closed", () => {
  const closed = { timezone: "Europe/London", weekly: { sun: [], mon: [], tue: [], wed: [], thu: [], fri: [], sat: [] } };
  const now = at("2026-10-19", "10:00", 1);
  const s = openStatus(closed, now);
  assert.equal(s.nextOpen, null);
  assert.equal(statusLabel(s, now), "Closed");
});

test("zonedNow uses the shop's timezone, including BST/GMT changes", () => {
  // 25 Oct 2026, clocks go back at 02:00 BST → 01:00 GMT
  assert.equal(zonedNow(new Date("2026-10-25T00:30:00Z"), "Europe/London").minutes, toMinutes("01:30")); // still BST
  assert.equal(zonedNow(new Date("2026-10-25T01:30:00Z"), "Europe/London").minutes, toMinutes("01:30")); // now GMT
  assert.equal(zonedNow(new Date("2026-07-01T23:30:00Z"), "Europe/London").date, "2026-07-02");
});

test("12-hour formatting", () => {
  assert.equal(formatTime12(toMinutes("00:00")), "12am");
  assert.equal(formatTime12(toMinutes("12:00")), "12pm");
  assert.equal(formatTime12(toMinutes("17:30")), "5:30pm");
  assert.equal(formatTime12(24 * 60 + 120), "2am");
});

test("weekly table starts on Monday and shows closed days", () => {
  const rows = weeklyRows(hours);
  assert.equal(rows[0].day, "Monday");
  assert.equal(rows[5].label, "Closed");
  assert.equal(rows[2].label, "9am – 12pm, 1pm – 7pm");
});

test("invalid times are rejected", () => {
  assert.throws(() => toMinutes("24:00"));
  assert.throws(() => toMinutes("9:00"));
});
