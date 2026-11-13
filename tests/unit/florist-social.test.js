import { test } from "node:test";
import assert from "node:assert/strict";
import { bouquetStatus, igHandle, igDm, postLink, makeThisMessage, dropWindow, dropState, countdownParts, upcomingLives, liveIcs } from "../../src/kits/florist/lib/social.js";

test("bouquet status: the Sheet wins when it says something we understand", () => {
  assert.deepEqual(bouquetStatus({}, "sold"), { state: "sold", label: "Sold out" });
  assert.deepEqual(bouquetStatus({}, "few:2"), { state: "few", left: 2, label: "2 left" });
  assert.deepEqual(bouquetStatus({}, "3"), { state: "few", left: 3, label: "3 left" });
  assert.deepEqual(bouquetStatus({}, "0"), { state: "sold", label: "Sold out" });
  assert.equal(bouquetStatus({}, "hidden").state, "hidden");
  assert.deepEqual(bouquetStatus({ status: "sold" }, "available"), { state: "available", label: "" });
});

test("bouquet status: an unreadable Sheet value keeps the site's own", () => {
  assert.deepEqual(bouquetStatus({ status: "few", left: 4 }, "loads"), { state: "few", left: 4, label: "4 left" });
  assert.deepEqual(bouquetStatus({ status: "sold" }, undefined), { state: "sold", label: "Sold out" });
  assert.deepEqual(bouquetStatus({}, undefined), { state: "available", label: "" });
});

test("instagram handles and DM links", () => {
  assert.equal(igHandle("@laleh.studio"), "laleh.studio");
  assert.equal(igHandle("not a handle!"), null);
  assert.equal(igDm("laleh.studio"), "https://ig.me/m/laleh.studio");
  assert.equal(igDm(""), null);
});

test("post links: only TikTok, Instagram and Pinterest, cleaned of tracking", () => {
  assert.deepEqual(postLink("https://www.tiktok.com/@flowerfeed/video/7431?is_from_webapp=1"), { href: "https://www.tiktok.com/@flowerfeed/video/7431", from: "TikTok" });
  assert.equal(postLink("https://vm.tiktok.com/ZGabc/").from, "TikTok");
  assert.equal(postLink("https://www.instagram.com/p/C1x2/").from, "Instagram");
  assert.equal(postLink("https://uk.pinterest.com/pin/123/").from, "Pinterest");
  assert.equal(postLink("https://pin.it/4abc").from, "Pinterest");
  assert.equal(postLink("https://tiktok.com.evil.example/x"), null);
  assert.equal(postLink("javascript:alert(1)"), null);
  assert.equal(postLink("not a link"), null);
});

test("make this one: link, budget and day in one message", () => {
  assert.equal(makeThisMessage({ lead: "Hi Laleh, can you do this one?", link: "https://www.tiktok.com/@a/video/1", budget: "£45", when: "Sat 7 Nov" }),
    "Hi Laleh, can you do this one? https://www.tiktok.com/@a/video/1 Budget £45, for Sat 7 Nov.");
  assert.equal(makeThisMessage({ lead: "Hi, can you do this one?", link: "https://pin.it/x" }), "Hi, can you do this one? https://pin.it/x For a day to agree.");
});

test("drop window: the next Friday 7pm in London, or the one open now", () => {
  const W = { day: "fri", time: "19:00", hours: 48 };
  // Wed 4 Nov 2026, 02:00 GMT → Fri 6 Nov 19:00 GMT
  const wed = Date.UTC(2026, 10, 4, 2, 0);
  assert.equal(new Date(dropWindow(W, wed, "Europe/London").opens).toISOString(), "2026-11-06T19:00:00.000Z");
  // Sat 7 Nov 10:00 → still Friday's window (open until Sun 19:00)
  const sat = Date.UTC(2026, 10, 7, 10, 0);
  assert.equal(new Date(dropWindow(W, sat, "Europe/London").opens).toISOString(), "2026-11-06T19:00:00.000Z");
  // Sun 8 Nov 20:00 → next Friday
  const sun = Date.UTC(2026, 10, 8, 20, 0);
  assert.equal(new Date(dropWindow(W, sun, "Europe/London").opens).toISOString(), "2026-11-13T19:00:00.000Z");
  // British Summer Time: Fri 5 Jun 2026 19:00 BST is 18:00 UTC
  assert.equal(new Date(dropWindow(W, Date.UTC(2026, 5, 3, 12), "Europe/London").opens).toISOString(), "2026-06-05T18:00:00.000Z");
  assert.throws(() => dropWindow({ day: "friday", time: "19:00", hours: 1 }, wed, "Europe/London"));
});

test("drop state: a countdown, a fresh count, or no number at all", () => {
  const base = { opens: 1000_000, closes: 9000_000, made: 20, staleMinutes: 10 };
  assert.deepEqual(dropState({ ...base, nowMs: 400_000 }), { phase: "soon", ms: 600_000 });
  assert.deepEqual(dropState({ ...base, nowMs: 2000_000, left: 12, updated: 1900_000 }), { phase: "open", left: 12, of: 20 });
  assert.deepEqual(dropState({ ...base, nowMs: 2000_000, left: 0, updated: 1900_000 }), { phase: "sold" });
  // stale, missing or impossible counts never show a number
  assert.deepEqual(dropState({ ...base, nowMs: 2000_000 + 11 * 60000, left: 12, updated: 2000_000 }), { phase: "unknown" });
  assert.deepEqual(dropState({ ...base, nowMs: 2000_000, left: null, updated: 1900_000 }), { phase: "unknown" });
  assert.deepEqual(dropState({ ...base, nowMs: 2000_000, left: 25, updated: 1900_000 }), { phase: "unknown" });
  assert.deepEqual(dropState({ ...base, nowMs: 2000_000, left: 3, updated: null }), { phase: "unknown" });
});

test("countdown parts", () => {
  assert.deepEqual(countdownParts(((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000), { d: 2, h: 3, m: 4, s: 5 });
  assert.deepEqual(countdownParts(-5), { d: 0, h: 0, m: 0, s: 0 });
});

test("LIVE sessions: past ones drop off, soonest first", () => {
  const S = [{ date: "2026-11-12", time: "19:00" }, { date: "2026-11-05", time: "19:00", minutes: 60 }, { date: "2026-11-04", time: "19:00" }];
  assert.deepEqual(upcomingLives(S, { date: "2026-11-05", minutes: 19 * 60 + 30 }).map((s) => s.date), ["2026-11-05", "2026-11-12"]);
  assert.deepEqual(upcomingLives(S, { date: "2026-11-05", minutes: 20 * 60 }).map((s) => s.date), ["2026-11-12"]);
});

test("LIVE calendar file", () => {
  const ics = liveIcs({ date: "2026-11-12", time: "19:00", where: "TikTok", what: "Christmas pre-orders, live", url: "https://example.com", business: "Studio", timeZone: "Europe/London", stamp: new Date(Date.UTC(2026, 10, 1)), uid: "x@example" });
  assert.match(ics, /DTSTART:20261112T190000Z/);
  assert.match(ics, /SUMMARY:Studio LIVE on TikTok/);
  assert.match(ics, /DESCRIPTION:Christmas pre-orders\\, live\. https:\/\/example\.com/);
  assert.match(ics, /TRIGGER:-PT15M/);
});

test("sheet times in shop time", async () => {
  const { sheetTime } = await import("../../src/kits/florist/lib/social.js");
  assert.equal(new Date(sheetTime("2026-11-06 19:20", "Europe/London")).toISOString(), "2026-11-06T19:20:00.000Z");
  assert.equal(new Date(sheetTime("06/06/2026 19:20:05", "Europe/London")).toISOString(), "2026-06-06T18:20:05.000Z");
  assert.equal(sheetTime("yesterday", "Europe/London"), null);
  assert.equal(sheetTime("2026-13-01 10:00", "Europe/London"), null);
});

test("settings: the drop's count is never written into a client site", async () => {
  const { checkFlorist } = await import("../../src/kits/florist/config.js");
  const photo = { src: "img/a.webp", width: 800, height: 1000, alt: "A bouquet" };
  const drop = { name: "The Friday drop", intro: "Twenty, every Friday.", when: { day: "fri", time: "19:00", hours: 48 }, made: 20, left: 12, items: [{ name: "Rose", price: 45, photo }] };
  const errs = (/** @type {any} */ site) => { const out = []; checkFlorist({ kit: "florist", features: [], ...site }, (p, m) => out.push(`${p}: ${m}`)); return out; };
  assert.deepEqual(errs({ mode: "demo", drop }), []);
  assert.ok(errs({ mode: "client", drop }).some((e) => e.startsWith("drop.left")));
  assert.ok(errs({ mode: "demo", drop: { ...drop, left: 25 } }).some((e) => e.startsWith("drop.left")));
  assert.ok(errs({ mode: "demo", drop: { ...drop, when: { day: "friday", time: "7pm", hours: 0 } } }).length >= 3);
});

test("settings: bouquets, ranges and statuses", async () => {
  const { checkFlorist } = await import("../../src/kits/florist/config.js");
  const photo = { src: "img/a.webp", width: 800, height: 1000, alt: "A bouquet" };
  const bouquets = { message: "Hi, I'd like", ranges: [{ id: "fresh", label: "Fresh", line: "Today" }], items: [{ id: "a", range: "fresh", name: "A", price: 40, photo, status: "few", left: 2 }] };
  const errs = (/** @type {any} */ b) => { const out = []; checkFlorist({ kit: "florist", mode: "demo", features: [], bouquets: b }, (p, m) => out.push(`${p}: ${m}`)); return out; };
  assert.deepEqual(errs(bouquets), []);
  assert.ok(errs({ ...bouquets, items: [{ ...bouquets.items[0], range: "forever" }] }).some((e) => e.includes(".range")));
  assert.ok(errs({ ...bouquets, items: [{ ...bouquets.items[0], status: "few", left: undefined }] }).some((e) => e.includes(".left")));
  assert.ok(errs({ ...bouquets, instagram: "@not ok" }).some((e) => e.startsWith("bouquets.instagram")));
  assert.ok(errs({ ...bouquets, pinned: { name: "P", photo, price: 30, priceFrom: 30 } }).some((e) => e.startsWith("bouquets.pinned")));
});

test("settings: same-day sits in this week's band or under today's bouquets", async () => {
  const { checkFlorist } = await import("../../src/kits/florist/config.js");
  const errs = (/** @type {string[]} */ features) => { const out = []; checkFlorist({ kit: "florist", mode: "demo", features }, (p, m) => out.push(`${p}: ${m}`)); return out; };
  assert.ok(errs(["same-day"]).some((e) => e.includes('"same-day" needs')));
  assert.deepEqual(errs(["same-day", "todays-bouquets"]).filter((e) => e.includes('"same-day" needs')), []);
});

test("bouquet counts: only believed while fresh, and only 1–99", async () => {
  const { countsFresh } = await import("../../src/kits/florist/lib/social.js");
  // stale: a count or "sold" from the Sheet is not shown; the site's own (none on a client) stands
  assert.deepEqual(bouquetStatus({}, "few:2", false), { state: "available", label: "" });
  assert.deepEqual(bouquetStatus({}, "sold", false), { state: "available", label: "" });
  // what claims nothing still applies when stale
  assert.equal(bouquetStatus({}, "hidden", false).state, "hidden");
  // out of range counts are not read
  assert.deepEqual(bouquetStatus({}, "999"), { state: "available", label: "" });
  assert.deepEqual(bouquetStatus({}, "few:100"), { state: "available", label: "" });
  assert.deepEqual(bouquetStatus({}, "99"), { state: "few", left: 99, label: "99 left" });
  const now = Date.UTC(2026, 10, 6, 15, 0); // Fri 6 Nov 15:00 GMT
  assert.equal(countsFresh("2026-11-06 14:00", 180, now, "Europe/London"), true);
  assert.equal(countsFresh("2026-11-06 11:59", 180, now, "Europe/London"), false);
  assert.equal(countsFresh("2026-11-06 16:00", 180, now, "Europe/London"), false); // in the future
  assert.equal(countsFresh(undefined, 180, now, "Europe/London"), false);
  assert.equal(countsFresh("soon", 180, now, "Europe/London"), false);
});

test("settings: a client can't write what's left of a bouquet; a demo can", async () => {
  const { checkFlorist } = await import("../../src/kits/florist/config.js");
  const photo = { src: "img/a.webp", width: 800, height: 1000, alt: "A bouquet" };
  const item = { id: "a", range: "fresh", name: "A", price: 40, photo };
  const b = (/** @type {any} */ x) => ({ message: "Hi, I'd like", ranges: [{ id: "fresh", label: "Fresh", line: "Today" }], items: [{ ...item, ...x }] });
  const errs = (/** @type {string} */ mode, /** @type {any} */ bouquets) => { const out = []; checkFlorist({ kit: "florist", mode, features: [], bouquets }, (p, m) => out.push(`${p}: ${m}`)); return out; };
  assert.deepEqual(errs("demo", b({ status: "few", left: 2 })), []);
  assert.ok(errs("client", b({ status: "few", left: 2 })).some((e) => e.includes("from the florist's Sheet")));
  assert.ok(errs("client", b({ status: "sold" })).some((e) => e.includes("from the florist's Sheet")));
  assert.deepEqual(errs("client", b({})), []);
  assert.ok(errs("demo", b({ id: "updated" })).some((e) => e.includes('"updated"')));
  assert.ok(errs("client", { ...b({}), staleMinutes: 5 }).some((e) => e.startsWith("bouquets.staleMinutes")));
});

test("looks: each florist look offers only the features it lays out", async () => {
  const { check, features } = await import("../../src/kits/florist/kit.js");
  const { lookOffers } = await import("../../src/kits/florist/looks.js");
  const errs = (/** @type {string} */ look, /** @type {string[]} */ f) => { const out = []; check({ kit: "florist", mode: "demo", look, features: f }, (p, m) => out.push(`${p}: ${m}`)); return out.filter((e) => e.includes("isn't laid out")); };
  assert.equal(errs("mantel", ["todays-bouquets", "live-dates", "make-this", "the-drop"]).length, 4);
  assert.equal(errs("tissue", ["this-week", "two-ways", "weddings-planner"]).length, 3);
  assert.deepEqual(errs("tissue", ["todays-bouquets", "make-this", "live-dates", "the-drop", "same-day"]), []);
  assert.deepEqual(errs("mantel", ["this-week", "same-day", "weddings-planner"]), []);
  assert.equal(lookOffers("not-a-look", "same-day"), false);
  // every kit feature is laid out by at least one look
  for (const f of features) if (typeof f !== "string") assert.ok(lookOffers("mantel", f.id) || lookOffers("tissue", f.id), f.id);
});
