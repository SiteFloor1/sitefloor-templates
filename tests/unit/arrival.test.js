import { test } from "node:test";
import assert from "node:assert/strict";
import { parkingStatus, parkingSummary, leaveBy, leaveTime, boardTime, directionsUrl, checkArrival, checkedText } from "../../src/core/lib/arrival.js";

const TZ = "Europe/London";
const paid = { mon: [["08:00", "18:00"]], tue: [["08:00", "18:00"]], wed: [["08:00", "18:00"]], thu: [["08:00", "18:00"]], fri: [["08:00", "18:00"]], sat: [["08:00", "18:00"]] };
const at = (date, hhmm, weekday) => ({ date, weekday, minutes: Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3)) });
const lane = { name: "Call Lane", price: "£2.40 an hour", paid };

test("parking says whether it's free right now, and until when", () => {
  assert.deepEqual(parkingStatus(lane, TZ, at("2026-10-19", "10:30", 1)), { free: false, text: "Paid until 6pm · £2.40 an hour" });
  assert.deepEqual(parkingStatus(lane, TZ, at("2026-10-19", "19:00", 1)), { free: true, text: "Free now · charges from 8am tomorrow" });
  assert.deepEqual(parkingStatus(lane, TZ, at("2026-10-19", "07:15", 1)), { free: true, text: "Free now · charges from 8am" });
  assert.deepEqual(parkingStatus(lane, TZ, at("2026-10-24", "19:00", 6)), { free: true, text: "Free now · charges from 8am Monday" }); // Saturday evening, free Sunday
  assert.equal(parkingStatus({ name: "x", paid: "never" }, TZ, at("2026-10-19", "10:00", 1)).text, "Free");
  assert.equal(parkingStatus({ name: "x", paid: "always", price: "from £4" }, TZ, at("2026-10-19", "10:00", 1)).text, "Paid · from £4");
});

test("leave-by allows five minutes to find the door", () => {
  assert.equal(leaveBy(15 * 60, 10), 14 * 60 + 45);
  assert.equal(leaveBy(9 * 60, 30, 0), 8 * 60 + 30);
});

test("directions open Google Maps in the right mode, from the journey's start when given", () => {
  const loc = { streetAddress: "14 Kirkgate", locality: "Leeds", postcode: "LS1 6BY" };
  const walk = new URL(directionsUrl(loc, { mode: "walk", from: "Leeds station", origin: "Leeds railway station, Leeds", minutes: 10, steps: ["x"] }));
  assert.equal(walk.searchParams.get("travelmode"), "walking");
  assert.equal(walk.searchParams.get("origin"), "Leeds railway station, Leeds");
  assert.equal(walk.searchParams.get("destination"), "14 Kirkgate, Leeds LS1 6BY");
  const bus = new URL(directionsUrl(loc, { mode: "bus", from: "Bus 1", minutes: 2, steps: ["x"] }));
  assert.equal(bus.searchParams.get("travelmode"), "transit");
  assert.equal(bus.searchParams.get("origin"), null); // from wherever the visitor is
});

test("arrival settings are checked", () => {
  const errors = [];
  checkArrival({
    journeys: [{ mode: "hovercraft", from: "", minutes: 0, steps: [] }],
    parking: [{ name: "P", walk: -1, paid: { mon: [["8am", "6pm"]] } }, { name: "Q", paid: "sometimes" }],
    access: [{ label: "Lift" }],
  }, (p, m) => errors.push(`${p}: ${m}`));
  for (const f of ["journeys[0].mode", "journeys[0].from", "journeys[0].minutes", "journeys[0].steps", "parking[0].walk", "parking[0].paid.mon", "parking[1].paid", "access[0]"]) assert.ok(errors.some((e) => e.includes(f)), f);
});

test("leave-by wording suits the way people travel", async () => {
  const { leaveText } = await import("../../src/core/lib/arrival.js");
  assert.equal(leaveText({ mode: "walk", from: "Leeds station" }, "2:45pm"), "Leave Leeds station by 2:45pm");
  assert.equal(leaveText({ mode: "bus", from: "Buses 1, 4 or 16", stop: "Kirkgate Market" }, "2:53pm"), "Get off at Kirkgate Market by 2:53pm");
});

const day24 = [["00:00", "00:00"]];
test("bank holidays: charged like Sundays, free, or as normal; region matters", () => {
  const council = { ...lane, bankHolidays: "sunday" };
  assert.equal(parkingStatus(council, TZ, at("2026-12-25", "11:00", 5)).text, "Free now (bank holiday) · charges from 8am tomorrow"); // Christmas Day (Fri); Boxing Day is a Saturday, so it is charged as normal
  assert.equal(parkingStatus(council, TZ, at("2026-12-28", "11:00", 1)).text, "Free now (bank holiday) · charges from 8am tomorrow");
  assert.equal(parkingStatus({ ...lane, bankHolidays: "normal" }, TZ, at("2026-12-25", "11:00", 5)).text, "Paid until 6pm · £2.40 an hour");
  // Easter Monday is a bank holiday in England but not in Scotland.
  assert.equal(parkingStatus(council, TZ, at("2026-04-06", "11:00", 1), "england-wales").free, true);
  assert.equal(parkingStatus(council, TZ, at("2026-04-06", "11:00", 1), "scotland").free, false);
  // A one-off exception beats the rule.
  const fair = { ...council, exceptions: [{ date: "2026-12-25", ranges: [["10:00", "16:00"]] }] };
  assert.equal(parkingStatus(fair, TZ, at("2026-12-25", "11:00", 5)).text, "Paid until 4pm · £2.40 an hour");
});

test("24-hour charging says so, and runs on past midnight correctly", () => {
  const always = { name: "A", paid: Object.fromEntries(["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map((d) => [d, day24])), bankHolidays: "normal" };
  assert.equal(parkingStatus(always, TZ, at("2026-10-19", "15:00", 1)).text, "Paid 24 hours");
  const weekdays = { name: "W", paid: { mon: day24, tue: day24, wed: day24, thu: day24, fri: day24 }, bankHolidays: "normal" };
  assert.equal(parkingStatus(weekdays, TZ, at("2026-10-19", "15:00", 1)).text, "Paid until midnight Friday");
  assert.equal(parkingStatus(weekdays, TZ, at("2026-10-23", "15:00", 5)).text, "Paid until midnight");
  const late = { name: "L", paid: { fri: [["18:00", "00:00"]], sat: [["00:00", "03:00"]] }, bankHolidays: "normal" };
  assert.equal(parkingStatus(late, TZ, at("2026-10-23", "20:00", 5)).text, "Paid until 3am tomorrow");
  const overnight = { name: "O", paid: { sat: [["22:00", "03:00"]] }, bankHolidays: "normal" };
  assert.equal(parkingStatus(overnight, TZ, at("2026-10-24", "23:00", 6)).text, "Paid until 3am tomorrow");
  assert.equal(parkingStatus(overnight, TZ, at("2026-10-25", "01:30", 0)).text, "Paid until 3am");
});

test("a car park that has closed for the night says so, before anything about charges", () => {
  const multi = { name: "M", paid: "always", price: "from £4", open: { mon: [["07:00", "20:00"]], tue: [["07:00", "20:00"]] } };
  assert.deepEqual(parkingStatus(multi, TZ, at("2026-10-19", "23:00", 1)), { free: false, closed: true, text: "Closed now · opens 7am tomorrow" });
  assert.equal(parkingStatus(multi, TZ, at("2026-10-19", "12:00", 1)).text, "Paid · from £4");
  assert.equal(parkingStatus(multi, TZ, at("2026-10-20", "21:00", 2)).text, "Closed now · opens 7am Monday");
});

test("the charging and opening times read as one line, for the page without JavaScript", () => {
  assert.equal(parkingSummary({ ...lane, bankHolidays: "sunday" }), "Charges Mon–Sat 8am–6pm · free on Sundays and bank holidays");
  assert.equal(parkingSummary({ name: "x", paid: { mon: [["08:00", "18:00"]], tue: [["08:00", "18:00"]], wed: [["08:00", "18:00"]], thu: [["08:00", "18:00"]], fri: [["08:00", "18:00"]] }, bankHolidays: "normal" }), "Charges Mon–Fri 8am–6pm · free at weekends");
  assert.equal(parkingSummary({ name: "x", paid: Object.fromEntries(["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((d) => [d, day24])), bankHolidays: "normal" }), "Charges 24 hours a day");
  assert.equal(parkingSummary({ name: "x", paid: "always", open: { mon: [["07:00", "20:00"]], tue: [["07:00", "20:00"]], wed: [["07:00", "20:00"]], thu: [["07:00", "20:00"]], fri: [["07:00", "20:00"]], sat: [["07:00", "20:00"]] } }), "Open Mon–Sat 7am–8pm, closed Sundays · Paid whenever it's open");
  assert.equal(parkingSummary({ name: "x", paid: "never" }), "Free");
});

test("bad car-park schedules are refused, not shown as free", () => {
  const errors = [];
  const e = (p, m) => errors.push(`${p}: ${m}`);
  checkArrival({ parking: [
    { name: "Typo", paid: { monday: [["08:00", "18:00"]] }, bankHolidays: "sunday" },
    { name: "Empty", paid: {}, bankHolidays: "sunday" },
    { name: "Same", paid: { mon: [["08:00", "08:00"]] }, bankHolidays: "sunday" },
    { name: "No rule", paid: { mon: [["08:00", "18:00"]] } },
    { name: "Bad open", paid: "always", open: { mon: [["7am", "8pm"]] } },
  ] }, e);
  for (const f of ["parking[0].paid.monday", "parking[1].paid", "parking[2].paid.mon[0]", "parking[3].bankHolidays", "parking[4].open.mon"]) assert.ok(errors.some((x) => x.includes(f)), f);
  const ok = [];
  checkArrival({ parking: [{ name: "24h", paid: { mon: day24 }, bankHolidays: "normal" }] }, (p, m) => ok.push(p + m));
  assert.deepEqual(ok, []);
});

test("client sites say when the arrival facts were checked", () => {
  const errors = [];
  checkArrival({ journeys: [{ mode: "walk", from: "Station", minutes: 5, steps: ["Left"] }] }, (p) => errors.push(p), true);
  assert.deepEqual(errors, ["visitInfo.checked"]);
  const fine = [];
  checkArrival({ checked: "2026-10", journeys: [{ mode: "walk", from: "Station", minutes: 5, steps: ["Left"] }] }, (p) => fine.push(p), true);
  assert.deepEqual(fine, []);
  assert.equal(checkedText("2026-10"), "October 2026");
});

test("driving times are approximate; a leave time before midnight says so", () => {
  assert.equal(boardTime({ mode: "car", minutes: 8 }), "about 8 min drive");
  assert.equal(boardTime({ mode: "walk", minutes: 10 }), "10 min walk");
  assert.equal(leaveTime(leaveBy(10, 20)), "11:45pm the night before");
  assert.equal(leaveTime(leaveBy(15 * 60, 10)), "2:45pm");
});

test("a car park shut on Christmas Day or bank holidays says so", () => {
  const multi = { name: "M", paid: "always", price: "from £4", open: { mon: [["07:00", "20:00"]], fri: [["07:00", "20:00"]], sat: [["07:00", "20:00"]] }, closures: { dates: ["2026-12-25"] } };
  assert.equal(parkingStatus(multi, TZ, at("2026-12-25", "11:00", 5)).text, "Closed now · opens 7am tomorrow");
  const bh = { name: "B", paid: "never", closures: { bankHolidays: true } };
  assert.equal(parkingStatus(bh, TZ, at("2026-12-28", "11:00", 1)).closed, true);
  assert.equal(parkingStatus(bh, TZ, at("2026-12-29", "11:00", 2)).text, "Free");
  assert.equal(parkingSummary(multi), "Open Mon 7am–8pm, Fri–Sat 7am–8pm, closed Tuesdays, Wednesdays, Thursdays and Sundays · closed 25 Dec · Paid whenever it's open");
  const e = [];
  checkArrival({ parking: [{ name: "X", paid: "never", openExceptions: [], closures: { dates: ["2026-02-30"] } }] }, (p) => e.push(p));
  assert.deepEqual(e.sort(), ["visitInfo.parking[0].closures", "visitInfo.parking[0].openExceptions"]);
});
