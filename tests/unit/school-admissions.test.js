import { test } from "node:test";
import assert from "node:assert/strict";
import {
  receptionYear, groupStart, groupOn, groupName, summerBorn, compulsoryFrom, deadlineDate, timeline, nextEntry,
  timelineIcs, bornWords, monthWords, schoolYearOf, ENTRY_POINTS,
} from "../../src/kits/school/lib/admissions.js";

const ENTRIES = [
  { id: "11", label: "11+", yearGroup: 7, deadlines: [
    { id: "reg", label: "Registration closes", day: 1, month: 11, yearsBefore: 1 },
    { id: "test", label: "Entrance assessment", day: 15, month: 1, yearsBefore: 0 },
  ] },
  { id: "4", label: "4+", yearGroup: 0 },
  { id: "13", label: "13+", yearGroup: 9, deadlines: [{ id: "pre", label: "Pre-test", day: 10, month: 10, yearsBefore: 2 }] },
];

test("the owner's example: born 14 March 2021 joins Reception in September 2025", () => {
  assert.equal(receptionYear("2021-03-14"), 2025);
  assert.equal(groupStart("2021-03-14", 0), "2025-09-01");
  assert.equal(bornWords("2021-03-14"), "Born 14 March 2021");
});

test("the 1 September cut-off: 31 August and 1 September a year apart start together", () => {
  assert.equal(receptionYear("2021-08-31"), 2025);
  assert.equal(receptionYear("2020-09-01"), 2025);
  assert.equal(receptionYear("2021-09-01"), 2026);
  assert.equal(receptionYear("2020-08-31"), 2024);
});

test("entry points map to the right year groups and names", () => {
  assert.deepEqual(ENTRY_POINTS, { "3+": -1, "4+": 0, "7+": 3, "11+": 7, "13+": 9, "16+": 12 });
  assert.equal(groupName(-1), "Nursery");
  assert.equal(groupName(0), "Reception");
  assert.equal(groupName(7), "Year 7");
  assert.equal(groupName(12), "Year 12 (Lower Sixth)");
  assert.equal(groupStart("2021-03-14", 7), "2032-09-01");
  assert.equal(groupStart("2021-03-14", 12), "2037-09-01");
});

test("year group on a day, including either side of school", () => {
  assert.equal(schoolYearOf("2026-08-31"), 2025);
  assert.equal(schoolYearOf("2026-09-01"), 2026);
  assert.equal(groupOn("2021-03-14", "2026-11-28"), 1);
  assert.equal(groupOn("2021-03-14", "2024-10-01"), -1);
  assert.equal(groupOn("2024-01-01", "2026-11-28"), "too young");
  assert.equal(groupOn("2005-01-01", "2026-11-28"), "left");
});

test("summer-born and compulsory school age", () => {
  assert.equal(summerBorn("2021-04-01"), true);
  assert.equal(summerBorn("2021-08-31"), true);
  assert.equal(summerBorn("2021-03-31"), false);
  assert.equal(compulsoryFrom("2021-03-14"), "2026-03-31");
  assert.equal(compulsoryFrom("2021-03-31"), "2026-03-31");
  assert.equal(compulsoryFrom("2021-06-01"), "2026-08-31");
  assert.equal(compulsoryFrom("2021-10-01"), "2026-12-31");
  assert.equal(compulsoryFrom("2020-02-29"), "2025-03-31");
});

test("deadlines are counted back from the September of entry; impossible days throw", () => {
  assert.equal(deadlineDate({ id: "r", label: "", day: 1, month: 11, yearsBefore: 1 }, 2032), "2031-11-01");
  assert.throws(() => deadlineDate({ id: "x", label: "", day: 31, month: 2, yearsBefore: 0 }, 2032), RangeError);
  assert.throws(() => receptionYear("2021-02-30"), RangeError);
});

test("the timeline is in year-group order, with past entries and deadlines marked", () => {
  const t = timeline({ dob: "2021-03-14", today: "2026-11-28", entries: ENTRIES });
  assert.deepEqual(t.map((e) => [e.label, e.start, e.past]), [["4+", "2025-09-01", true], ["11+", "2032-09-01", false], ["13+", "2034-09-01", false]]);
  assert.deepEqual(t[1].deadlines.map((d) => [d.date, d.past]), [["2031-11-01", false], ["2032-01-15", false]]);
  assert.equal(t[2].deadlines[0].date, "2032-10-10");
  assert.equal(nextEntry(t)?.label, "11+");
  assert.equal(monthWords("2032-09-01"), "September 2032");
});

test("nextEntry skips an entry whose deadlines have passed and is null when all are behind", () => {
  const t = timeline({ dob: "2020-10-01", today: "2032-03-01", entries: ENTRIES });
  assert.equal(t.find((e) => e.label === "11+")?.past, false);
  assert.equal(nextEntry(t)?.label, "13+");
  assert.equal(nextEntry(timeline({ dob: "2000-01-01", today: "2026-11-28", entries: ENTRIES })), null);
});

test("the calendar file holds only dates still to come, escaped and with CRLF lines", () => {
  const t = timeline({ dob: "2020-10-01", today: "2031-11-05", entries: ENTRIES });
  const e = t.find((x) => x.label === "11+");
  assert.ok(e);
  const ics = timelineIcs({ entry: e, school: "Mercombe", place: "Mercombe, Somerset", stamp: "20261128T100000Z" });
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n"));
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
  assert.ok(!ics.includes("20311101"), "a past registration date is left out");
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20320115"));
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20320901"));
  assert.ok(ics.includes("LOCATION:Mercombe\\, Somerset"));
  const own = timelineIcs({ entry: e, school: "Mercombe", place: "x", stamp: "20261128T100000Z", startDay: "2032-09-06" });
  assert.ok(own.includes("DTSTART;VALUE=DATE:20320906"));
});
