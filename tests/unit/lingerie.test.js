// @ts-check
import { test } from "node:test";
import assert from "node:assert/strict";
import { pieceName, swatches, piecesWhere, setAsideText, hintText, trayLines } from "../../src/kits/lingerie/lib/pieces.js";
import { sizeGrid, fittingText, herText, isPassportCode, normaliseCode, passportFor, passportText } from "../../src/kits/lingerie/lib/fit.js";
import { isMonthDay, inYear, nextOccurrence, conciergeIcs, conciergeList } from "../../src/kits/lingerie/lib/gifts.js";
import { parseEvenings, openEvenings, isFresh, eveningText, partyText } from "../../src/kits/lingerie/lib/evenings.js";
import { activeTakeover, takeoverPhase, takeoverLine, wallLabel } from "../../src/kits/lingerie/lib/takeover.js";
import { dropInstant, dropState } from "../../src/kits/lingerie/lib/drop.js";
import { diaryDates, diaryIcs, diaryStatus } from "../../src/core/lib/diary.js";

const collections = [
  { id: "calloway", name: "Calloway", colours: [{ id: "noir", name: "Noir", hex: "#141012" }, { id: "smoke", name: "Smoke", hex: "#6F6A6B" }] },
  { id: "ottoline", name: "Ottoline", colours: [{ id: "lagoon", name: "Lagoon", hex: "#4FB6B2" }] },
];
const pieces = [
  { id: "c-body", collection: "calloway", style: "Body", colour: "noir", colours: ["noir", "smoke"], price: 320, category: "bodies", newSeason: true },
  { id: "c-bra", collection: "calloway", style: "Balconette", colour: "smoke", price: 240, category: "bras" },
  { id: "o-bra", collection: "ottoline", style: "Balconette", colour: "lagoon", price: 240, category: "bras", newSeason: true },
];

test("a piece is named collection · style · colour, in another colour when asked", () => {
  assert.equal(pieceName(collections, pieces[0]), "Calloway · Body · Noir");
  assert.equal(pieceName(collections, pieces[0], "smoke"), "Calloway · Body · Smoke");
});

test("swatches put the piece's own colour first and skip unknown ones", () => {
  assert.deepEqual(swatches(collections, pieces[0]).map((c) => c.id), ["noir", "smoke"]);
  assert.deepEqual(swatches(collections, { ...pieces[0], colours: ["smoke", "pearl"] }).map((c) => c.id), ["noir", "smoke"]);
});

test("pieces filter by collection, category, new season, or an id list in that order", () => {
  assert.deepEqual(piecesWhere(pieces, { category: "bras" }).map((p) => p.id), ["c-bra", "o-bra"]);
  assert.deepEqual(piecesWhere(pieces, { newSeason: true, collection: "calloway" }).map((p) => p.id), ["c-body"]);
  assert.deepEqual(piecesWhere(pieces, { ids: ["o-bra", "nope", "c-body"] }).map((p) => p.id), ["o-bra", "c-body"]);
});

test("messages carry the piece, the shop's price and only what the customer gave", () => {
  const set = setAsideText({ business: "Marese", piece: "Calloway · Body · Noir", price: 320 });
  assert.match(set, /Calloway · Body · Noir, £320\./);
  assert.match(set, /not sure of my size/);
  assert.match(setAsideText({ business: "Marese", piece: "x", price: 99.5, size: " 32 D " }), /£99\.50[\s\S]*My size: 32 D\./);
  const hint = hintText({ business: "Marese", piece: "Ottoline · Balconette · Lagoon", price: 240, url: "https://x.example/p" });
  assert.match(hint, /from Marese, £240\.\nhttps:\/\/x\.example\/p$/);
  assert.doesNotMatch(hint, /size/i);
  assert.deepEqual(trayLines(["a", "b", "c", "d"]), ["1. a", "2. b", "3. c"]);
});

test("the size grid marks what's on the shelf, what's ordered in, and what isn't made", () => {
  const g = sizeGrid({ bands: [30, 32, 34], cups: ["A", "B", "C", "D"], stock: { bands: [32, 34], cups: ["B", "C"] }, order: { bands: [30, 34], cups: ["A", "D"] } });
  assert.deepEqual(g[0].cells.map((c) => c.kind), ["order", "order", "order", "order"]);
  assert.deepEqual(g[1].cells.map((c) => c.kind), ["order", "stock", "stock", "order"]);
  const none = sizeGrid({ bands: [30], cups: ["A"], stock: { bands: [32, 34], cups: ["B", "C"] } });
  assert.equal(none[0].cells[0].kind, "");
});

test("the fitting request lists the tray and guests; video in online mode", () => {
  const t = fittingText({ business: "Marese", kind: "Bridal", day: "Saturday", time: "Morning", guests: 1, name: "Anna", tray: ["a", "b", "c", "d"] });
  assert.match(t, /private fitting \(Bridal\)\.\nSaturday, Morning\. I'll bring one guest\./);
  assert.match(t, /3\. c\nAnna$/);
  assert.doesNotMatch(t, /4\. d/);
  assert.match(fittingText({ business: "M", kind: "", day: "", time: "", guests: 0, name: "", tray: [], video: true }), /a video fitting\.\nWhenever suits you\.$/);
});

test("Tell us about her says what he doesn't know rather than guessing", () => {
  const t = herText({ business: "Marese", size: "", wears: "Black", budget: "£600 to £1,000", occasion: "", wrap: true, card: "Tonight.", name: "" });
  assert.match(t, /Her size: I don't know\./);
  assert.match(t, /Please wrap it\.\nFor the card: "Tonight\."$/);
});

test("passport codes are 8 unambiguous characters, and only that code's rows are read", () => {
  assert.ok(isPassportCode("K7M2QX9P"));
  for (const bad of ["K7M2QX9", "K7M2QX9O", "k7m2qx9p", "K7M2QX91"]) assert.ok(!isPassportCode(bad), bad);
  assert.equal(normaliseCode(" k7m2-qx9p "), "K7M2QX9P");
  const rows = [["code", "shape", "size", "updated_at"], ["K7M2QX9P", "Balconette", "32D", "2026-10-02"], ["OTHER123", "Plunge", "34B", "2026-10-03"], ["k7m2qx9p", "Brief", "S", "2026-10-09"], ["K7M2QX9P", "", "", ""]];
  assert.deepEqual(passportFor(rows, "K7M2QX9P"), { sizes: [{ shape: "Balconette", size: "32D" }, { shape: "Brief", size: "S" }], updated: "2026-10-09" });
  assert.equal(passportFor(rows, "ZZZZZZZZ"), null);
  assert.equal(passportFor([["name", "size"]], "K7M2QX9P"), null);
  assert.match(passportText({ business: "Marese", code: "K7M2QX9P", budget: "", name: "" }), /^Hello Marese, I'm buying for someone with one of your fit passports\.\nPassport: K7M2QX9P\./);
});

test("gift dates: real month-days, 29 February on the 28th in other years, next occurrence from today", () => {
  assert.ok(isMonthDay("02-29") && !isMonthDay("02-30") && !isMonthDay("13-01"));
  assert.equal(inYear("02-29", 2027), "2027-02-28");
  assert.equal(inYear("02-29", 2028), "2028-02-29");
  assert.equal(nextOccurrence("02-14", "2026-10-29"), "2027-02-14");
  assert.equal(nextOccurrence("10-29", "2026-10-29"), "2026-10-29");
  assert.deepEqual(conciergeList([{ label: "B", md: "03-01" }, { label: "A", md: "12-01" }], "2026-10-29").map((d) => d.label), ["A", "B"]);
});

test("the concierge calendar has a yearly event and yearly reminders before each date", () => {
  const ics = conciergeIcs({ business: "Marese", link: "https://m.example", stamp: "20261029T120000Z", leads: [21, 7], today: "2026-10-29", dates: [{ id: "valentines", label: "Valentine's Day", md: "02-14" }, { id: "birthday", label: "Her birthday", md: "02-29" }] });
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /DTSTART;VALUE=DATE:20270214\r\n/);
  assert.match(ics, /DTSTART;VALUE=DATE:20270124\r\nDTEND;VALUE=DATE:20270125\r\nRRULE:FREQ=YEARLY\r\nSUMMARY:Valentine's Day in 21 days/);
  assert.match(ics, /DTSTART;VALUE=DATE:20270228\r\nDTEND;VALUE=DATE:20270301\r\nRRULE:FREQ=YEARLY;BYMONTH=2;BYMONTHDAY=-1/);
  assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, 6);
  assert.match(ics, /DESCRIPTION:Time to choose something from Marese: https:\/\/m\.example\r\n/);
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
});

test("private evenings: only readable free rows, soonest first, today's only before they start; stale sheets fail closed", () => {
  const rows = [["date", "start", "status", "updated_at"], ["2026-10-30", "19:00", "free", "2026-10-29 09:00"], ["2026-10-29", "19:00", "free", "2026-10-29 10:30"], ["2026-10-31", "19:00", "held", ""], ["31/10/2026", "19:00", "free", ""], ["2026-11-02", "7pm", "free", ""], ["2026-10-29", "18:00", "free", ""]];
  const { evenings, updated } = parseEvenings(rows, "Europe/London");
  assert.equal(evenings.length, 4);
  assert.equal(new Date(updated).toISOString(), "2026-10-29T10:30:00.000Z");
  assert.deepEqual(openEvenings(evenings, { date: "2026-10-29", minutes: 18 * 60 + 30 }).map((e) => e.date + " " + e.start), ["2026-10-29 19:00", "2026-10-30 19:00"]);
  assert.ok(isFresh(updated, updated + 3600_000, 48));
  assert.ok(!isFresh(updated, updated + 49 * 3600_000, 48));
  assert.ok(!isFresh(NaN, Date.now(), 48));
  assert.ok(!isFresh(updated + 3600_000, updated, 48), "a time in the future is not trusted");
  assert.deepEqual(parseEvenings([["when", "status"]], "Europe/London").evenings, []);
  assert.match(eveningText({ business: "Marese", when: "Friday 30 October, 7pm", guests: 0, occasion: "", name: "" }), /on Friday 30 October, 7pm\.\nI'll come alone\.$/);
});

test("the drop counts down in the shop's time zone, then is live, then over", () => {
  const at = dropInstant("2026-11-20T19:00", "Europe/London");
  assert.equal(new Date(at).toISOString(), "2026-11-20T19:00:00.000Z");
  assert.equal(new Date(dropInstant("2026-06-20T19:00", "Europe/London")).toISOString(), "2026-06-20T18:00:00.000Z");
  const before = dropState({ at: "2026-11-20T19:00" }, "Europe/London", at - (2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000);
  assert.deepEqual(before, { phase: "before", left: { days: 2, hours: 3, minutes: 4, seconds: 5 } });
  assert.equal(dropState({ at: "2026-11-20T19:00" }, "Europe/London", at).phase, "live");
  assert.equal(dropState({ at: "2026-11-20T19:00", ends: "2026-11-22T23:59" }, "Europe/London", at + 3 * 86400_000).phase, "after");
  assert.ok(Number.isNaN(dropInstant("2026-11-20 19:00", "Europe/London")));
});

test("wedding dates (bridal diary logic): steps worked back from the day, past ones marked, a calendar file", () => {
  const steps = [{ id: "first", label: "First fitting", weeksBefore: 12 }, { id: "final", label: "Final fitting, with the dress", weeksBefore: 3 }];
  const dates = diaryDates("2027-06-12", steps, "2027-04-01");
  assert.deepEqual(dates.map((d) => [d.date, d.past]), [["2027-03-20", true], ["2027-05-22", false]]);
  assert.equal(diaryStatus("2027-06-12", "2027-04-01", 12).late, true);
  const ics = diaryIcs({ wedding: "2027-06-12", dates, salon: "Marese", place: "Mayfair", stamp: "20261029T120000Z", title: "wedding dates" });
  assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, 2);
  assert.match(ics, /PRODID:-\/\/Sitefloor\/\/Marese wedding dates\/\/EN/);
});

test("the validator's copies of the passport and month-day checks agree with the kit's", async () => {
  const v = await import("../../src/kits/lingerie/config.js");
  for (const c of ["K7M2QX9P", "K7M2QX9O", "k7m2qx9p", "ABCDEFGH", "ABCDEFG"]) assert.equal(v.isPassportCode(c), isPassportCode(c), c);
  for (const d of ["02-29", "02-30", "04-31", "12-31", "00-10", "1-01"]) assert.equal(v.isMonthDay(d), isMonthDay(d), d);
});

// --- validation (src/kits/lingerie/config.js) ---
import { readFileSync } from "node:fs";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const catalog = loadCatalog(process.cwd());
const read = (/** @type {string} */ p) => JSON.parse(readFileSync(p, "utf8"));
const demo = () => read("sites/demos/lingerie/site.json");
const client = () => read("tests/fixtures/sites/test-lingerie-client/site.json");
const errs = (/** @type {any} */ s) => validateSite(s, { catalog });

test("the Marese demo and the online-brand client fixture are valid", () => {
  assert.deepEqual(errs(demo()), []);
  assert.deepEqual(errs(client()), []);
});

test("sample evenings and passports, and the mode preview, are refused on client sites", () => {
  const c = client();
  c.features.push("private-evening", "fit-passport");
  c.plan = "signature";
  c.evenings = { ...demo().evenings, deposit: undefined };
  delete c.evenings.deposit;
  c.passport = demo().passport;
  c.shop.previewModes = true;
  const e = errs(c).join("\n");
  assert.match(e, /evenings\.source: sample data is only allowed on demo sites/);
  assert.match(e, /passport\.source: sample data is only allowed on demo sites/);
  assert.match(e, /shop\.previewModes: demo sites only/);
});

test("a sheet-fed passport needs a published CSV link and keeps no sample rows", () => {
  const d = demo();
  d.passport = { source: "sheet", csvUrl: "https://example.com/sizes.csv", note: "x", exampleCode: "K7M2QX9P" };
  const e = errs(d).join("\n");
  assert.match(e, /passport\.csvUrl: a published Google Sheet CSV link/);
  assert.match(e, /passport: sample and exampleCode are for demo sites/);
});

test("pieces must name a real collection and colour; references to pieces and Payment Links are checked", () => {
  const d = demo();
  d.pieces[0].colour = "scarlet";
  d.pieces[1].collection = "nope";
  d.underDress.options[0].pieces.push("ghost");
  d.pieces.find((/** @type {any} */ p) => p.preorder).preorder.payLink = "missing";
  d.guides.fitting.pieces = ["ghost-2"];
  const e = errs(d).join("\n");
  assert.match(e, /pieces\[0\]\.colour: "scarlet" isn't one of that collection's colours/);
  assert.match(e, /pieces\[1\]\.collection: "nope" isn't one of collections/);
  assert.match(e, /underDress\.options\[0\]\.pieces\[\d\]: "ghost" isn't one of pieces/);
  assert.match(e, /preorder\.payLink: "missing" isn't one of payLinks\.items/);
  assert.match(e, /guides\.fitting\.pieces\[0\]: "ghost-2" isn't one of pieces/);
});

test("unknown settings are refused, and a guide page needs its guide", () => {
  const d = demo();
  d.fitting.colour = "red";
  d.guides.bridal.subtitle = "x";
  delete d.guides.care;
  const e = errs(d).join("\n");
  assert.match(e, /fitting\.colour: unknown setting/);
  assert.match(e, /guides\.bridal\.subtitle: unknown setting/);
  assert.match(e, /guides\.care: required by feature "care-page"/);
});

test("the size guide's stock and order spans come from its own bands and cups", () => {
  const d = demo();
  d.sizeGuide.stock = { bands: [30, 50], cups: ["A", "G"] };
  assert.match(errs(d).join("\n"), /sizeGuide\.stock:/);
});

test("the drop is for online brands on client sites, and ends after it starts", () => {
  const c = client();
  c.shop = { mode: "boutique", area: "London", strip: { boutique: "x" } };
  c.drop.ends = "2026-11-19T10:00";
  const e = errs(c).join("\n");
  assert.match(e, /"drop" is for online brands/);
  assert.match(e, /drop\.ends: .*after drop\.at/);
});

test("a takeover counts down to its order-by time on the shop's clock, then to collection, then ends", () => {
  const t = { orderBy: "2027-02-11T16:00", collectBy: "2027-02-14T17:00" };
  const at = (iso) => takeoverPhase(t, "Europe/London", Date.parse(iso));
  assert.deepEqual(at("2027-02-01T10:00:00Z"), { phase: "order", daysLeft: 10, hoursLeft: 246 });
  assert.match(takeoverLine(t, at("2027-02-01T10:00:00Z"), "Mayfair"), /^10 days left to order for delivery: by Thursday 11 February, 4pm\. Collect in Mayfair until Sunday 14 February, 5pm\.$/);
  assert.match(takeoverLine(t, at("2027-02-11T15:30:00Z"), "Mayfair"), /^Under an hour left/);
  assert.equal(at("2027-02-12T10:00:00Z").phase, "collect");
  assert.match(takeoverLine(t, at("2027-02-12T10:00:00Z"), "Mayfair"), /^Delivery has closed\. Collect in Mayfair/);
  assert.equal(at("2027-02-14T17:00:00Z").phase, "over");
  // Summer time: Christmas Eve is GMT, a June order-by is BST.
  assert.equal(takeoverPhase({ orderBy: "2027-06-10T16:00" }, "Europe/London", Date.parse("2027-06-10T15:30:00Z")).phase, "over");
  assert.equal(wallLabel("2026-12-24T16:30"), "Thursday 24 December, 4:30pm");
});

test("the takeover covering today wins; none outside their dates", () => {
  const list = [{ from: "2026-11-27", to: "2026-12-24" }, { from: "2027-01-25", to: "2027-02-14" }];
  assert.equal(activeTakeover(list, "2026-12-01"), 0);
  assert.equal(activeTakeover(list, "2027-02-14"), 1);
  assert.equal(activeTakeover(list, "2027-01-01"), -1);
});

test("the bridal party message names the evening, the party, the wedding and who's coming", () => {
  const text = partyText({ business: "Marese", when: "Friday 6 November, 7:30pm", party: 4, wedding: "Saturday 12 June 2027", names: "Ana\nBea, Cleo\n\n", bride: "Dani" });
  assert.equal(text, "Hello Marese, I'd like the bridal party evening on Friday 6 November, 7:30pm.\nThere will be 4 of us, me included.\nThe wedding is on Saturday 12 June 2027.\nWith: Ana, Bea, Cleo.\nDani");
});

test("takeovers are Valentine's or Christmas, inside their dates, never overlapping, naming real pieces", () => {
  const d = demo();
  d.takeovers[0].id = "easter";
  d.takeovers[1].from = "2026-12-01"; // 75 days, and overlaps Christmas
  d.takeovers[1].orderBy = "2027-03-01T10:00";
  d.takeovers[1].edits[0].pieces.push("no-such-piece");
  const e = errs(d).join("\n");
  assert.match(e, /takeovers\[0\]\.id: valentines or christmas/);
  assert.match(e, /takeovers\[1\]: "from" and "to"/);
  assert.match(e, /takeovers\[1\]\.orderBy:/);
  assert.match(e, /takeovers\[1\]\.edits\[0\]\.pieces\[3\]: "no-such-piece"/);
  assert.match(e, /overlap/);
});

test("an online brand's takeover has no collection, and the bridal party needs a sensible party", () => {
  const c = client();
  c.takeovers = [{ id: "valentines", name: "Valentine's", from: "2027-01-25", to: "2027-02-14", title: "x", orderBy: "2027-02-11T16:00", collectBy: "2027-02-12T16:00",
    photo: { src: "img/a.webp", width: 800, height: 1000, alt: "a" }, edits: [{ label: "To give her", pieces: [c.pieces[0].id] }] }];
  c.bridalParty = { minutes: 120, partyMax: 20, note: "x", photo: { src: "img/a.webp", width: 800, height: 1000, alt: "a" } };
  const e = errs(c).join("\n");
  assert.match(e, /collectBy: online brands have no collection/);
  assert.match(e, /bridalParty\.partyMax/);
});
