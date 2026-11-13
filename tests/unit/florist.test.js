import { test } from "node:test";
import assert from "node:assert/strict";
import { sameDay, outward, inZone, postcodeAnswer, cutoffLabel, leftLabel, deliveryOn, orderDay, shortDate } from "../../src/kits/florist/lib/delivery.js";
import { orderFromCsv, accountFromCsv, cleanRef, photoUrl } from "../../src/kits/florist/lib/track.js";
import { buttonColour, weekFromRow, rowsToObjects, weekTokens, isHex, stemsFromRows, coverPoint } from "../../src/kits/florist/lib/week.js";
import { rememberIcs, nextYearly } from "../../src/kits/florist/lib/remember.js";
import { orderMessage, cardText, nearestBouquet, weddingDate, placesLeft } from "../../src/kits/florist/lib/orders.js";
import { contrast } from "../../src/core/lib/brand.js";

const D = { zones: ["SW1", "SW3", "SW10"], cutoffs: { mon: "13:00", tue: "13:00", wed: "13:00", thu: "13:00", fri: "13:00", sat: "11:00", sun: null }, closed: ["2026-12-25"] };
const at = (date, weekday, hh, mm = 0) => ({ date, weekday, minutes: hh * 60 + mm });

test("same day: open before the florist's own cut-off, with the time left", () => {
  assert.deepEqual(sameDay(D, at("2026-10-19", 1, 10, 30)), { open: true, cutoff: "1pm", left: 150 });
  assert.equal(leftLabel(150), "2 h 30 min");
  assert.equal(leftLabel(45), "45 min");
  assert.equal(cutoffLabel("11:30"), "11.30am");
});

test("same day: after the cut-off it names the next delivery day, never 'today'", () => {
  const s = sameDay(D, at("2026-10-19", 1, 13, 0));
  assert.equal(s.open, false);
  assert.deepEqual(s.next, { date: "2026-10-20", label: "tomorrow", cutoff: "1pm" });
  // Saturday after 11am: Sunday has no deliveries, so Monday.
  assert.deepEqual(sameDay(D, at("2026-10-24", 6, 12)).next, { date: "2026-10-26", label: "Monday", cutoff: "1pm" });
});

test("same day: closed dates and the bank holidays the florist closes on are skipped", () => {
  assert.equal(sameDay(D, at("2026-12-25", 5, 9)).open, false);
  assert.equal(sameDay(D, at("2026-12-24", 4, 14)).next.date, "2026-12-26");
  assert.equal(sameDay(D, at("2026-12-28", 1, 9), ["2026-12-28"]).open, false);
});

test("postcodes: outward codes and districts, SW1 never matches SW10", () => {
  assert.equal(outward("sw6 1aa"), "SW6");
  assert.equal(outward("SW1A1AA"), "SW1A");
  assert.equal(outward("W8"), "W8");
  assert.equal(outward("hello"), null);
  assert.ok(inZone("SW1A", ["SW1"]));
  assert.ok(!inZone("SW11", ["SW1"]));
  assert.ok(inZone("SW10", ["SW10"]));
  const open = sameDay(D, at("2026-10-19", 1, 10));
  assert.equal(postcodeAnswer("sw3 2aa", D, open).text, "Yes, SW3 today if you order by 1pm.");
  assert.match(postcodeAnswer("N1 9AA", D, open).text, /don't deliver by hand to N1/);
  assert.equal(postcodeAnswer("??", D, open).ok, false);
});

test("the week's colour: the button always passes AA with white text; the wash stays pale", () => {
  for (const c of ["#E0725C", "#F2D16B", "#B2898A", "#7FB3D5", "#FFFFFF"]) {
    const t = weekTokens(c, { ground: "#F7F6F3", ink: "#1C1B19" });
    assert.ok(contrast(t.weekDeep, "#FFFFFF") >= 4.5, `${c} → ${t.weekDeep}`);
    assert.ok(contrast(t.weekWash, "#1C1B19") >= 12, `wash ${t.weekWash} must keep ink readable`);
  }
  assert.ok(isHex("#e0725c") && !isHex("coral"));
  assert.equal(buttonColour("#1C1B19", "#1C1B19"), "#1C1B19");
});

test("a Sheet row changes only what it can prove: bad prices, colours and photos keep the built values", () => {
  const base = { name: "Coral rose", stems: "Roses", colour: "#E0725C", colourName: "coral", photo: "mantel", sizes: [{ id: "medium", label: "Medium", price: 65 }, { id: "large", label: "Large", price: 95 }] };
  const [row] = rowsToObjects([["Name", "Colour", "Price medium", "Price large", "Photo"], ["Peony and stock", "#C9A0DC", "£70", "ninety", "nope"]]);
  const w = weekFromRow(row, base, ["mantel", "peony"]);
  assert.equal(w.name, "Peony and stock");
  assert.equal(w.colour, "#C9A0DC");
  assert.equal(w.sizes[0].price, 70);
  assert.equal(w.sizes[1].price, 95);
  assert.equal(w.photo, "mantel");
  assert.equal(weekFromRow({ colour: "red" }, base, []).colour, "#E0725C");
});

test("remember the date: a yearly event with an order-by reminder, in shop time", () => {
  assert.equal(nextYearly("1990-03-14", "2026-10-30"), "2027-03-14");
  assert.equal(nextYearly("2000-02-29", "2027-01-01"), "2027-02-28");
  const ics = rememberIcs({ label: "Mum's birthday", date: "1960-03-14", orderDaysBefore: 1, business: "Ambry", url: "https://florist.demo.sitefloor.com", timeZone: "Europe/London", today: "2026-10-30", stamp: new Date("2026-10-30T10:00:00Z"), uid: "x@sitefloor" });
  assert.match(ics, /DTSTART:20270314T090000Z/);
  assert.match(ics, /RRULE:FREQ=YEARLY/);
  assert.match(ics, /TRIGGER:-PT1440M/);
  assert.match(ics, /SUMMARY:Mum's birthday/);
  assert.ok(ics.split("\r\n").every((l) => new TextEncoder().encode(l).length <= 75));
});

test("orders: the message carries the choice and the card; the card is held to its length", () => {
  const m = orderMessage({ lead: "Hello Ambry, I'd like to order.", item: "Coral rose", size: { label: "Large", price: 95 }, card: "Happy birthday, Mum", postcode: "SW3" });
  assert.match(m, /Coral rose, Large \(£95\)/);
  assert.match(m, /To: SW3/);
  assert.match(m, /Card:\nHappy birthday, Mum/);
  assert.deepEqual(cardText("abcdef", 4), { text: "abcd", left: -2, over: true });
  assert.equal(cardText("a\nb\nc", 50, 2).text, "a\nb");
});

test("bouquet builder, wedding dates and workshop places use only the florist's own facts", () => {
  const b = [{ palette: "coral", size: "m", id: 1 }, { palette: "coral", size: "l", id: 2 }, { palette: "white", size: "m", id: 3 }];
  assert.equal(nearestBouquet(b, "coral", "l").id, 2);
  assert.equal(nearestBouquet(b, "white", "l").id, 3);
  assert.equal(nearestBouquet(b, "blue", "m"), null);
  const w = { taken: ["2027-06-12"], minWeeks: 12 };
  assert.equal(weddingDate("2026-10-01", "2026-10-30", w).state, "past");
  assert.equal(weddingDate("2026-12-01", "2026-10-30", w).state, "soon");
  assert.equal(weddingDate("2027-06-12", "2026-10-30", w).state, "taken");
  assert.equal(weddingDate("2027-06-19", "2026-10-30", w).state, "ask");
  assert.equal(placesLeft(8, 3, "2"), 2);
  assert.equal(placesLeft(8, 3, "lots"), 3);
  assert.equal(placesLeft(8, 3, "40"), 8);
});

import { readFileSync } from "node:fs";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";
import { HOME_PARTS, homeOrderProblem } from "../../src/kits/florist/home.js";
import { features as kitFeatures } from "../../src/kits/florist/kit.js";
import { studioFromCsv } from "../../src/kits/florist/lib/studio.js";

const root = new URL("../..", import.meta.url).pathname;
const catalog = loadCatalog(root);
const demo = () => JSON.parse(readFileSync(`${root}sites/demos/florist/site.json`, "utf8"));
const fixture = () => JSON.parse(readFileSync(`${root}tests/fixtures/sites/test-florist-client/site.json`, "utf8"));
const errs = (s) => validateSite(s, { catalog }).join("\n");

test("the demo and the client fixture are valid; Mantel lists every home section once", () => {
  assert.equal(errs(demo()), "");
  assert.equal(errs(fixture()), "");
  const kitIds = kitFeatures.flatMap((f) => (typeof f === "string" ? [] : [f.id]));
  for (const look of ["mantel", "tissue"]) assert.equal(homeOrderProblem(catalog.looks[look].homeOrder, look, kitIds), null, look);
  assert.equal(catalog.looks.mantel.homeOrder.length, Object.keys(HOME_PARTS).filter((id) => !["todays-bouquets", "live-dates", "make-this"].includes(id)).length);
  assert.match(String(homeOrderProblem([...catalog.looks.mantel.homeOrder, "todays-bouquets"], "mantel", kitIds)), /doesn't lay out: todays-bouquets/);
  assert.match(String(homeOrderProblem(["this-week"])), /leaves out/);
});

test("florist settings refuse what could mislead: unknown keys, test links on a client, demo Sheets, bad districts", () => {
  const s = fixture();
  s.week.coloUr = "#000000";
  s.everyWeek.plans[0].payLink = "https://buy.stripe.com/test_abc";
  s.delivery.zones.push("Fulham");
  s.delivery.cutoffs.sun = "1pm";
  const e = errs(s);
  assert.match(e, /week\.coloUr: unknown setting/);
  assert.match(e, /everyWeek\.plans\[0\]\.payLink: is a Stripe test-mode link/);
  assert.match(e, /delivery\.zones\[3\]: a postcode district/);
  assert.match(e, /delivery\.cutoffs\.sun: a time like "13:00", or null/);
  const d = demo();
  d.studioSheet = { source: "sheet", csvUrl: "https://docs.google.com/spreadsheets/d/e/x/pub?output=csv" };
  assert.match(errs(d), /a demo keeps its values in the site/);
});

test("the wrap names what the photo shows, and the two ways use two different photographs", () => {
  const s = fixture();
  s.twoWays.door.photo = s.twoWays.room.photo;
  delete s.wrap.ribbon.colour;
  const e = errs(s);
  assert.match(e, /twoWays\.door\.photo: use a different photograph/);
  assert.match(e, /wrap\.ribbon\.colour/);
});

test("the bouquet builder needs a real photograph for every palette it offers", () => {
  const d = demo();
  d.builder.palettes.push({ id: "blue", label: "Blue", colour: "#3E58A0" });
  assert.match(errs(d), /no photograph for the "blue" palette/);
});

test("the studio sheet: three groups from kind,key,value rows", () => {
  const s = studioFromCsv('kind,key,value\nweek,name,"Peony, stock"\nSeason,Dahlias,plenty\nworkshop,wreath,3\nother,x,y\n');
  assert.deepEqual(s, { ok: true, week: { name: "Peony, stock" }, season: { dahlias: "plenty" }, workshop: { wreath: "3" }, note: {}, stem: {}, bouquet: {}, drop: {} });
});

test("delivery areas: an area's own cut-off and charge answer its postcodes", () => {
  const A = { ...D, fee: 12, areas: [{ district: "SW10", fee: 15, cutoffs: { mon: "12:00" } }] };
  const now = at("2026-10-19", 1, 12, 30);
  const s = sameDay(A, now);
  assert.equal(postcodeAnswer("SW3 2AA", A, s, now).text, "Yes, SW3 today if you order by 1pm. Delivery £12.");
  assert.equal(postcodeAnswer("SW10 9AA", A, s, now).text, "Yes, SW10: next delivery tomorrow, order by 1pm. Delivery £15.");
});

test("choose the day: only days the florist delivers, today only before the cut-off", () => {
  const now = at("2026-10-19", 1, 10);
  assert.deepEqual(deliveryOn("2026-10-23", D, now), { ok: true, text: "Delivered on Fri 23 Oct.", label: "Fri 23 Oct" });
  assert.equal(deliveryOn("2026-10-25", D, now).ok, false); // Sunday: no deliveries
  assert.equal(deliveryOn("2026-12-25", D, now).ok, false); // closed
  assert.equal(deliveryOn("2026-10-26", D, now, ["2026-10-26"]).ok, false); // a bank holiday the florist closes on
  assert.equal(deliveryOn("2026-10-18", D, now).text, "That date has passed.");
  assert.equal(deliveryOn("2026-10-19", D, now).label, "today");
  assert.equal(deliveryOn("2026-10-19", D, at("2026-10-19", 1, 14)).ok, false);
  assert.equal(deliveryOn("2027-06-01", D, now).ok, false); // further than 90 days: a conversation
  assert.match(orderMessage({ lead: "Hi", item: "Roses", extras: [{ name: "Candle", price: 34 }], when: "Fri 23 Oct" }), /Add: Candle \(£34\)\nFor: Fri 23 Oct/);
});

test("name the stems: Sheet rows and positions on a cropped photo", () => {
  assert.deepEqual(stemsFromRows({ 2: "50 50 | Calla", 1: "10 20 30 40 | Rose | English", 3: "120 5 | Too far", 4: "1 2 | " }),
    [{ x: 10, y: 20, px: 30, py: 40, name: "Rose", note: "English" }, { x: 50, y: 50, name: "Calla" }]);
  // A 2:1 photo in a 1:1 box is cropped at the sides: the centre stays put, the edges fall outside.
  const box = { w: 100, h: 100, nw: 200, nh: 100 };
  assert.deepEqual(coverPoint(50, 50, box), { left: 50, top: 50, inside: true });
  assert.equal(coverPoint(10, 50, box).inside, false);
});

test("follow your order and business flowers: by reference only, failing closed", () => {
  const now = Date.parse("2026-11-02T12:00:00Z");
  const csv = "ref,stage,updated_at,note,photo\nAMB4K7,van,2026-11-02 11:40,On its way,https://drive.google.com/file/d/abcdefghijk123/view\nDUP1,making,2026-11-02 11:00,,\ndup1,van,2026-11-02 11:00,,\n";
  const r = orderFromCsv(csv, "AMB4K7", ["making", "van", "delivered"], now, 24, "Europe/London");
  assert.equal(r.ok && r.stage, 1);
  assert.equal(r.ok && r.photo, "https://lh3.googleusercontent.com/d/abcdefghijk123");
  assert.deepEqual(orderFromCsv(csv, "NOPE1", ["making", "van"], now, 24, "Europe/London"), { ok: false, reason: "unknown" });
  assert.deepEqual(orderFromCsv(csv, "DUP1", ["making", "van"], now, 24, "Europe/London"), { ok: false, reason: "unknown" });
  assert.deepEqual(orderFromCsv(csv, "AMB4K7", ["making", "van"], now + 3 * 86400000, 24, "Europe/London"), { ok: false, reason: "stale" });
  assert.deepEqual(orderFromCsv("a,b\n1,2", "AMB4K7", ["making"], now, 24, "Europe/London"), { ok: false, reason: "unreadable" });
  assert.equal(cleanRef("amb-4k7"), "AMB4K7");
  assert.equal(photoUrl("https://evil.example/x.jpg"), "");
  const rows = "code,name,pieces,next_change,updated_at\nGLB2Q8,The Gilbert,Lobby: two urns; Bar: bud vases,Tuesday,2026-11-02 09:00\n";
  const acc = accountFromCsv(rows, "GLB2Q8", now, 8, "Europe/London");
  assert.ok(acc.ok);
  assert.deepEqual(acc.ok && acc.pieces, [{ place: "Lobby", what: "two urns" }, { place: "Bar", what: "bud vases" }]);
  // Not updated for more than eight days: the page says it may be out of date, never "this week".
  assert.deepEqual(accountFromCsv(rows, "GLB2Q8", now + 9 * 86400000, 8, "Europe/London"), { ok: false, reason: "stale" });
  assert.deepEqual(accountFromCsv("code,pieces\nGLB2Q8,Lobby: urns\n", "GLB2Q8", now, 8, "Europe/London"), { ok: false, reason: "unreadable" });
});

test("the new pages refuse what could mislead: simulated data on a client, areas not delivered to, pre-orders out of order", () => {
  const d = demo();
  d.deliveryAreas.areas[0].district = "N1";
  d.preorder.windows[0].orderBy = "2027-01-01";
  d.stemNames.photo = "nope";
  d.calendar.months.pop();
  d.stories.items[0].photos = d.stories.items[0].photos.slice(0, 2);
  const e = errs(d);
  assert.match(e, /deliveryAreas\.areas\[0\]\.district: one of the districts/);
  assert.match(e, /preorder\.windows\[0\]: opens before the order-by date/);
  assert.match(e, /stemNames\.photo/);
  assert.match(e, /calendar\.months: twelve months/);
  assert.match(e, /stories\.items\[0\]\.photos: three or four/);
  const s = fixture();
  s.orderTracker = { source: "simulated", kicker: "Your order", title: "Where your flowers are", stages: [{ id: "a", name: "A", about: "a" }, { id: "b", name: "B", about: "b" }] };
  assert.match(errs(s), /orderTracker\.source: simulated data is only allowed on demo sites/);
});

test("choose the day uses the typed postcode's area, and the same words in every browser", () => {
  const A = { ...D, areas: [{ district: "SW10", cutoffs: { mon: "12:00" } }] };
  const now = at("2026-10-19", 1, 12, 30);
  assert.equal(orderDay("2026-10-19", "SW3 2AA", A, now).ok, true); // 1pm cut-off
  assert.equal(orderDay("2026-10-19", "SW10 9AA", A, now).ok, false); // its own noon cut-off
  assert.equal(orderDay("2026-10-19", "", A, at("2026-10-19", 1, 13, 2)).ok, false); // checked again at send: after 1pm
  assert.equal(shortDate("2026-10-25"), "Sun 25 Oct");
  assert.equal(shortDate("2027-02-13"), "Sat 13 Feb");
});

test("one-off cut-offs, out-of-zone days, pre-order days and demo names (audit G-02 to G-05)", () => {
  const X = { ...D, dates: { "2026-12-24": "11:00", "2026-12-31": null } };
  assert.equal(sameDay(X, at("2026-12-24", 4, 11, 30)).open, false); // Christmas Eve: 11am, not the Thursday's 1pm
  assert.deepEqual(sameDay(X, at("2026-12-24", 4, 10)), { open: true, cutoff: "11am", left: 60 });
  assert.equal(deliveryOn("2026-12-31", X, at("2026-12-28", 1, 9)).ok, false);
  assert.match(orderDay("2026-10-19", "N1 1AA", D, at("2026-10-19", 1, 10)).text, /don't deliver by hand to N1/);
  const d = demo();
  d.preorder.windows[1].day = "2027-02-14"; // a Sunday
  d.preorder.windows[0].day = "2026-12-25"; // closed
  const e = errs(d);
  assert.match(e, /preorder\.windows\[1\]\.day: the florist doesn't deliver on 2027-02-14/);
  assert.match(e, /preorder\.windows\[0\]\.day: the florist doesn't deliver on 2026-12-25/);
  const f = fixture();
  f.card.from = "Ambry · Pimlico";
  f.week.message = "Hello Ambry, this week's flowers:";
  assert.match(errs(f), /card\.from: contains "Ambry", the name of a Sitefloor demo/);
  assert.match(errs(f), /week\.message: contains "Ambry"/);
  assert.equal(errs(fixture()), "");
});
