import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";
import { extensionSize, readout, priceRange, priceWords, designMessage, clampDepth, startState, depthRange } from "../../src/kits/construction/lib/extension.js";
import { cleanCode, drivePhoto, progressFromCsv, agoWords } from "../../src/kits/construction/lib/progress.js";
import { toTile, mapView } from "../../src/kits/construction/lib/map.js";
import { outwardCode, briefMessage, totalWeeks, weeksWords } from "../../src/kits/construction/lib/brief.js";
import { HOME_PARTS, homeOrderProblem, onPagesProblem } from "../../src/kits/construction/home.js";
import { MODEL_3D_KB, csp } from "../../src/kits/construction/kit.js";
import { validateSite } from "../../src/core/lib/config.js";
import { FEATURES, forKit } from "../../src/features/registry.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/construction/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-construction-client/site.json", "utf8"));
const look = JSON.parse(readFileSync("src/looks/handover/look.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("a builder's site offers no gallery, work page, photo band, shared team page or gift vouchers", () => {
  for (const id of ["gallery", "work", "photo-band", "team", "vouchers"]) assert.ok(!forKit(/** @type {any} */ (FEATURES.find((f) => f.id === id)), "construction"), id);
});

test("the extension's size and floor area are arithmetic on the visitor's choices", () => {
  assert.deepEqual(extensionSize("terrace", 4), { depth: 4, width: 5.4, area: 19 });
  assert.deepEqual(extensionSize("semi", 6), { depth: 6, width: 6.6, area: 36 });
  assert.deepEqual(extensionSize("detached", 3), { depth: 3, width: 6.4, area: 17 });
  assert.deepEqual(readout(extensionSize("terrace", 4)), { size: "4.0 m deep · 5.4 m wide", room: "about 19 m² of new room" });
  const range = depthRange({ min: 3, max: 6, step: 0.5, start: 4 });
  assert.equal(clampDepth(4.3, range), 4.5);
  assert.equal(clampDepth(9, range), 6);
  assert.equal(clampDepth(Number.NaN, range), 4);
  assert.deepEqual(startState({ house: "bungalow", roof: "thatch" }), { house: "terrace", roof: "lantern", depth: 4, show: "after" });
});

test("a price only from the builder's own rates, rounded out, with VAT stated", () => {
  const rates = { perM2: { lantern: [3200, 3900] }, vat: /** @type {"excluded"} */ ("excluded"), checked: "2026-10" };
  assert.equal(priceRange(undefined, "lantern", 24), null);
  assert.equal(priceRange(rates, "glass", 24), null, "no rate for that roof, no price");
  assert.deepEqual(priceRange(rates, "lantern", 24), { from: 76000, to: 94000 });
  assert.equal(priceWords({ from: 76000, to: 94000 }, "excluded"), "£76,000 to £94,000, plus VAT");
  assert.equal(priceWords({ from: 76000, to: 94000 }, "included"), "£76,000 to £94,000, including VAT");
  assert.match(designMessage("Hello.", { house: "semi", depth: 5, roof: "glass" }), /A semi-detached house, an extension about 5\.0 m deep and 6\.6 m wide \(about 30 m² inside\), with an all-glass roof\./);
});

test("a demo can't carry rates; a client's rates must be complete and dated", () => {
  assert.match(errorsFor((s) => { s.visualiser.rates = { perM2: { lantern: [3000, 3500] }, vat: "excluded", checked: "2026-10" }; }), /a demo shows no prices/);
  assert.match(errorsFor((s) => { delete s.visualiser.rates.checked; }, client), /visualiser.rates.checked/);
  assert.match(errorsFor((s) => { s.visualiser.rates.perM2.lantern = [4000, 3000]; }, client), /\[low, high\]/);
  assert.match(errorsFor((s) => { s.visualiser.rates.perM2.thatch = [3000, 3500]; }, client), /perM2.thatch: a roof/);
});

test("accreditations: noughts on a demo and no register link; a client's real number", () => {
  assert.match(errorsFor((s) => { s.credentials.items[0].number = "123456"; }), /demo sites are fictional/);
  assert.match(errorsFor((s) => { s.credentials.items[0].checkUrl = "https://example.org"; }), /links to no register/);
  assert.match(errorsFor((s) => { s.credentials.items[0].number = "000000"; }, client), /is the demo number/);
  assert.match(errorsFor((s) => { s.credentials.insurance[0].amount = "lots"; }), /as your certificate shows it/);
});

test("projects: a district, never an address; a before photo only with consent", () => {
  assert.match(errorsFor((s) => { s.projects.items[0].district.code = "N5 1QX"; }), /first half of the postcode only/);
  assert.match(errorsFor((s) => { s.projects.items[0].before = s.projects.items[0].photos[0]; delete s.projects.items[0].during; delete s.projects.items[0].consent; }), /consent: a before photo/);
  assert.equal(errorsFor((s) => { s.projects.items[0].before = s.projects.items[0].photos[0]; s.projects.items[0].consent = true; }), "");
  assert.match(errorsFor((s) => { s.projects.items[0].id = "journal"; }), /one of the kit's pages/);
});

test("journal facts about planning come only from gov.uk, with the date checked", () => {
  assert.match(errorsFor((s) => { s.journal.items[0].sources[0].url = "https://www.planningportal.co.uk/x"; }), /only from gov.uk/);
  assert.match(errorsFor((s) => { delete s.journal.items[0].sources[0].checked; }), /the date you checked the page/);
  assert.equal(errorsFor((s) => { s.journal.items[0].sources[0].url = "https://www.islington.gov.uk/planning"; }), "");
});

test("the 3D stages go forward and each says what the model shows", () => {
  assert.match(errorsFor((s) => { s.stages.items[1].model = "survey"; }), /must go forward/);
  assert.match(errorsFor((s) => { s.stages.items[0].model = "dig"; }), /what the 3D model shows/);
  assert.match(errorsFor((s) => { s.stages.items[0].weeks = [4, 2]; }), /\[fewest, most\] weeks/);
});

test("site codes, Drive photos and the sheet: fail closed, refuse a sheet with more in it", () => {
  assert.equal(cleanCode("pg4k 7m2q"), "PG4K7M2Q");
  assert.equal(cleanCode("short"), "");
  assert.equal(drivePhoto("https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012345/view?usp=sharing"), "https://drive.google.com/thumbnail?id=1AbCdEfGhIjKlMnOpQrStUvWxYz012345&sz=w1600");
  assert.equal(drivePhoto("https://example.com/photo.jpg"), "");
  const stages = ["survey", "structure", "envelope", "finish"];
  const now = Date.parse("2026-10-19T09:30:00Z");
  const ok = progressFromCsv("code,stage,updated_at,done,next\nPG4K7M2Q,envelope,2026-10-18 16:00,The roof is on.,Glazing Monday.\n", "PG4K7M2Q", stages, now, 10, "Europe/London");
  assert.deepEqual(ok, { ok: true, stage: 2, updatedAt: Date.parse("2026-10-18T15:00:00Z"), done: "The roof is on.", next: "Glazing Monday.", photo: "" });
  assert.deepEqual(progressFromCsv("code,stage,updated_at,client\nPG4K7M2Q,envelope,2026-10-18 16:00,Mrs Smith\n", "PG4K7M2Q", stages, now, 10, "Europe/London"), { ok: false, reason: "unreadable" });
  assert.deepEqual(progressFromCsv("code,stage,updated_at\nPG4K7M2Q,envelope,2026-10-18 16:00,Mrs Smith\n", "PG4K7M2Q", stages, now, 10, "Europe/London"), { ok: false, reason: "unreadable" }, "an unheaded column counts too");
  assert.deepEqual(progressFromCsv("code,stage,updated_at\nPG4K7M2Q,envelope,2026-09-01 16:00\n", "PG4K7M2Q", stages, now, 10, "Europe/London"), { ok: false, reason: "stale" });
  assert.deepEqual(progressFromCsv("code,stage,updated_at\nPG4K7M2Q,painting,2026-10-18 16:00\n", "PG4K7M2Q", stages, now, 10, "Europe/London"), { ok: false, reason: "unreadable" });
  assert.deepEqual(progressFromCsv("code,stage,updated_at\nPG4K7M2Q,envelope,2026-10-18 16:00\n", "ZZZZ9999", stages, now, 10, "Europe/London"), { ok: false, reason: "unknown" });
  const long = progressFromCsv(`code,stage,updated_at,done\nPG4K7M2Q,envelope,2026-10-18 16:00,${"x".repeat(400)}\n`, "PG4K7M2Q", stages, now, 10, "Europe/London");
  assert.equal(/** @type {any} */ (long).done.length, 240);
  assert.equal(agoWords(30 * 60_000), "within the hour");
  assert.equal(agoWords(26 * 3_600_000), "yesterday");
});

test("the brief asks only for the postcode district", () => {
  assert.equal(outwardCode("n5 1qx"), "N5");
  assert.equal(outwardCode("SW11"), "SW11");
  assert.equal(outwardCode("EC1A 1BB"), "EC1A");
  assert.equal(outwardCode("my house"), "");
  assert.equal(briefMessage("Hello.", { what: "Basements", where: "N5", when: "Next year", words: "  " }), "Hello.\n\nWhat: Basements\nWhere: N5\nWhen: Next year");
  assert.deepEqual(totalWeeks([{ weeks: [2, 4] }, { weeks: [6, 10] }]), [8, 14]);
  assert.equal(totalWeeks([{ weeks: [2, 4] }, {}]), null, "no total unless every stage has a length");
  assert.equal(weeksWords([1, 1]), "1 week");
  assert.equal(weeksWords([2, 3]), "2 to 3 weeks");
});

test("the projects map frames every district and loads tiles only from OpenStreetMap", () => {
  const t = toTile(0, 0, 1);
  assert.deepEqual(t, { x: 1, y: 1 });
  const v = /** @type {any} */ (mapView(demo.projects.items.map((/** @type {any} */ p) => p.district)));
  assert.ok(v.z >= 10 && v.z <= 15);
  assert.equal(v.tiles.length, 12);
  for (const m of v.markers) assert.ok(m.left > 0 && m.left < 100 && m.top > 0 && m.top < 100, JSON.stringify(m));
  assert.ok(v.tiles.every((/** @type {any} */ x) => x.src.startsWith("https://tile.openstreetmap.org/")));
  assert.equal(mapView([]), null);
  assert.deepEqual(csp(demo).img, ["https://tile.openstreetmap.org"]);
  assert.deepEqual(csp(client).img, ["https://drive.google.com", "https://*.googleusercontent.com", "https://tile.openstreetmap.org"]);
  assert.equal(csp(client).sheets, true);
});

test("the look's home order and pages are valid", () => {
  assert.equal(homeOrderProblem(look.homeOrder), null);
  assert.equal(onPagesProblem(look.onPages), null);
  assert.deepEqual(Object.keys(HOME_PARTS).sort(), [...look.homeOrder].sort());
});

test("the size on the 3D button matches the built chunk", { skip: !existsSync("dist/demos/construction/assets/chunks") }, () => {
  const dir = "dist/demos/construction/assets/chunks";
  const gz = readdirSync(dir).reduce((n, f) => n + gzipSync(readFileSync(path.join(dir, f)), { level: 9 }).length, 0) / 1024;
  assert.ok(Math.abs(gz - MODEL_3D_KB) / MODEL_3D_KB < 0.15, `the button says about ${MODEL_3D_KB} KB; the chunk is ${Math.round(gz)} KB`);
});

test("the planning guide places a rear extension against the GOV.UK limits, by house type", async () => {
  const { rearZone, TOPICS, SOURCES, CHECKED, LOFT_CHECKED, NOT_A_DECISION } = await import("../../src/kits/construction/lib/planning.js");
  assert.equal(rearZone("terrace", 3).zone, "pd");
  assert.equal(rearZone("semi", 3.5).zone, "prior");
  assert.equal(rearZone("semi", 6).zone, "prior");
  assert.equal(rearZone("terrace", 6.5).zone, "permission");
  assert.equal(rearZone("detached", 4).zone, "pd");
  assert.equal(rearZone("detached", 7.5).zone, "prior");
  assert.deepEqual(rearZone("detached", 8.5).limits, { pd: 4, prior: 8 });
  assert.equal(NOT_A_DECISION, "A guide, not a decision. Check with your council or apply for a lawful development certificate.");
  for (const s of Object.values(SOURCES)) { assert.match(s.url, /^https:\/\/www\.gov\.uk\//); assert.ok([CHECKED, LOFT_CHECKED].includes(s.checked)); }
  for (const t of Object.values(TOPICS)) for (const k of t.sources) assert.ok(Object.hasOwn(SOURCES, k), k);
});

test("the light study's sun is where the sun is", async () => {
  const { sunPosition, momentFor, lightWords, compass, whenWords } = await import("../../src/kits/construction/lib/sun.js");
  // London, midsummer solar noon: about 62° up, due south.
  const june = sunPosition(Date.parse("2026-06-21T12:02:00Z"), 51.5, -0.12);
  assert.ok(Math.abs(june.elevation - 62) < 0.6, JSON.stringify(june));
  assert.ok(Math.abs(june.azimuth - 180) < 2, JSON.stringify(june));
  // Midwinter noon: about 15° up.
  const dec = sunPosition(Date.parse("2026-12-21T12:00:00Z"), 51.5, -0.12);
  assert.ok(Math.abs(dec.elevation - 15) < 0.7, JSON.stringify(dec));
  // The 21st at a UK clock time: 3 pm in June is 14:00 UTC (BST); 3 pm in December is 15:00 UTC.
  assert.equal(new Date(momentFor(2026, 6, 900, "Europe/London")).toISOString(), "2026-06-21T14:00:00.000Z");
  assert.equal(new Date(momentFor(2026, 12, 900, "Europe/London")).toISOString(), "2026-12-21T15:00:00.000Z");
  assert.equal(lightWords({ elevation: -3, azimuth: 300 }, 180, true).words, "The sun is down.");
  assert.match(lightWords({ elevation: 30, azimuth: 200 }, 180, false).words, /shines on the new glass/);
  assert.match(lightWords({ elevation: 40, azimuth: 90 }, 270, true).words, /roof light takes the sun/);
  assert.match(lightWords({ elevation: 40, azimuth: 90 }, 270, false).words, /daylight from the sky/);
  assert.equal(compass(225), "south-west");
  assert.equal(whenWords(6, 900), "21 June, 3:00 pm");
  assert.equal(whenWords(12, 30), "21 December, 12:30 am");
});

test("the programme is arithmetic on the builder's own stage lengths", async () => {
  const { programme, programmeIcs, monthSpan } = await import("../../src/kits/construction/lib/programme.js");
  const stages = [{ id: "a", name: "Survey", weeks: /** @type {[number, number]} */ ([2, 4]) }, { id: "b", name: "Structure", weeks: /** @type {[number, number]} */ ([6, 10]) }];
  const p = /** @type {any[]} */ (programme(stages, "2027-03-01"));
  assert.deepEqual(p[0], { id: "a", name: "Survey", from: ["2027-03-01", "2027-03-01"], to: ["2027-03-15", "2027-03-29"] });
  assert.deepEqual(p[1].to, ["2027-04-26", "2027-06-07"]);
  assert.equal(programme([{ id: "a", name: "x", weeks: /** @type {any} */ (undefined) }], "2027-03-01"), null);
  assert.equal(monthSpan("2027-04-26", "2027-06-07"), "Apr–Jun 2027");
  assert.equal(monthSpan("2026-12-20", "2027-02-01"), "Dec 2026–Feb 2027");
  const ics = programmeIcs(p, "Pellow & Garth", new Date("2026-11-04T10:00:00Z"));
  assert.match(ics, /SUMMARY:Structure starts \(estimate\)/);
  assert.match(ics, /DTSTART;VALUE=DATE:20270315/);
});

test("the new pages: no pound figures typed into costs, planning topics only from the facts file, consent for during photos", () => {
  assert.match(errorsFor((s) => { s.costs.drivers[0].line = "Usually £3,000 a square metre"; }), /no pound figures here/);
  assert.match(errorsFor((s) => { s.buildTypes.items[0].planning = ["rear", "made-up"]; }), /planning topics from GOV.UK/);
  assert.match(errorsFor((s) => { s.lightStudy.facing = "up"; }), /the way the garden faces/);
  assert.match(errorsFor((s) => { s.lightStudy.places[0].code = "N5 1QX"; }), /first half of the postcode only/);
  assert.match(errorsFor((s) => { s.sampleBox.max = 40; }), /1 to 12/);
  assert.match(errorsFor((s) => { const x = s.projects.items.find((/** @type {any} */ p) => p.during); x.consent = false; }), /during the work: set true only/);
  assert.match(errorsFor((s) => { s.stages.items[1].living.lines = []; }), /what home is like/);
});

test("the sample box sends only what was ticked, and the district", async () => {
  const { sampleMessage } = await import("../../src/kits/construction/features/sample-box/sample-box.js");
  assert.equal(sampleMessage("Hello.", ["Oak boards", "Limestone"], "N5"), "Hello.\n\n· Oak boards\n· Limestone\n\nPostcode district: N5");
  assert.equal(sampleMessage("Hello.", ["Oak boards"], ""), "Hello.\n\n· Oak boards");
});

test("the loft guide: volumes from the model's roof against GOV.UK's Class B allowance, dated", async () => {
  const { dormerSection, gableVolume, loftsFor, loftVolume, dormerRange, loftStart, meterAt, ROOF_MODEL } = await import("../../src/kits/construction/lib/loft.js");
  const { LOFT, loftZone, SOURCES, LOFT_CHECKED, LOFT_RULES } = await import("../../src/kits/construction/lib/planning.js");
  assert.deepEqual([LOFT.terrace, LOFT.other, LOFT.eaves, LOFT.sill], [40, 50, 0.2, 1.7]);
  assert.match(SOURCES.pdLoft.url, /^https:\/\/www\.gov\.uk\//);
  assert.equal(SOURCES.pdLoft.checked, LOFT_CHECKED);
  // A hip-to-gable: a gable end less the equal-pitch hipped end it replaces, L·D·r/6.
  assert.ok(Math.abs(gableVolume() - (ROOF_MODEL.depth / 2) * ROOF_MODEL.depth * ROOF_MODEL.rise / 6) < 1e-9);
  // The dormer's section sits under the roof's own triangle (half the depth × the rise ÷ 2).
  assert.ok(dormerSection() > 3.5 && dormerSection() < (ROOF_MODEL.depth / 2) * ROOF_MODEL.rise / 2);
  assert.deepEqual(loftsFor("terrace"), ["dormer"], "a mid-terrace has no hip");
  assert.deepEqual(loftsFor("semi"), ["dormer", "hip", "both"]);
  assert.deepEqual(loftsFor("detached"), ["hip", "both"], "no room for a dormer between two hips on the model");
  assert.equal(dormerRange("semi", "hip"), null);
  assert.ok(/** @type {any} */ (dormerRange("semi", "both")).max > /** @type {any} */ (dormerRange("semi", "dormer")).max, "a gable gives the dormer room");
  assert.equal(loftVolume("terrace", "dormer", 99).width, /** @type {any} */ (dormerRange("terrace", "dormer")).max, "clamped to the roof");
  assert.equal(loftStart("semi").loft, "both");
  assert.equal(loftZone("terrace", 40).zone, "pd");
  assert.equal(loftZone("terrace", 40.1).zone, "permission");
  assert.equal(loftZone("semi", 49).zone, "pd");
  assert.match(loftZone("detached", 57).words, /^About 57 m³ added: over the 50 m³ allowance .* needs planning permission\.$/);
  assert.equal(meterAt(40, 40), 62.5);
  assert.ok(LOFT_RULES.some((r) => /hip-to-gable/.test(r)) && LOFT_RULES.some((r) => /Earlier roof extensions count/.test(r)));
  const { loftMessage } = await import("../../src/kits/construction/features/loft-page/loft-page.js");
  assert.equal(loftMessage("Hello", { house: "semi", loft: "both", width: 4.5, before: 6 }, 40.2), "Hello\n· A semi-detached house\n· A hip-to-gable and a rear dormer, the dormer 4.5 m wide\n· 6 m³ already added to the roof\n· About 40 m³ in all, on your model");
});

test("neighbours: the district only, the builder's sheet with nothing more in it, and old news says to call", async () => {
  const { siteWeekFromCsv, neighbourMessage } = await import("../../src/kits/construction/lib/neighbours.js");
  const now = Date.parse("2026-11-05T12:00:00Z");
  const csv = "site,updated_at,this_week,noisy,deliveries\nn5-rear,2026-11-04 08:30,Bricklayers on the new walls.,Tuesday morning,Steel on Thursday\n";
  const r = siteWeekFromCsv(csv, "n5-rear", now, 10, "Europe/London");
  assert.equal(r.ok, true);
  assert.deepEqual({ ...r, updatedAt: 0 }, { ok: true, updatedAt: 0, week: "Bricklayers on the new walls.", noisy: "Tuesday morning", deliveries: "Steel on Thursday" });
  assert.deepEqual(siteWeekFromCsv(csv, "nw3-loft", now, 10, "Europe/London"), { ok: false, reason: "unknown" });
  assert.deepEqual(siteWeekFromCsv(csv.replace("deliveries\n", "deliveries,notes\n"), "n5-rear", now, 10, "Europe/London"), r, "an empty extra column is harmless");
  assert.deepEqual(siteWeekFromCsv(csv.replace("Steel on Thursday", "Steel on Thursday,12 Highbury Hill"), "n5-rear", now, 10, "Europe/London"), { ok: false, reason: "unreadable" }, "anything in another column refuses the sheet");
  assert.deepEqual(siteWeekFromCsv(csv, "n5-rear", now + 11 * 86_400_000, 10, "Europe/London"), { ok: false, reason: "stale" });
  assert.equal(neighbourMessage("Hello, I live near your site in {district}.", "N5"), "Hello, I live near your site in N5.");
  assert.match(errorsFor((s) => { s.neighbours.sites[0].id = "highbury-hill-road"; }), /the district and one short word/);
  assert.match(errorsFor((s) => { s.neighbours.sites[0].district.code = "N5 1QX"; }), /first half of the postcode only/);
  assert.match(errorsFor((s) => { s.neighbours.source = "sheet"; }), /a demo uses "simulated"/);
  assert.match(errorsFor((s) => { s.neighbours.sites[0].to = "2026-01"; }), /from and to/);
  assert.equal(csp({ features: ["neighbours-page"], neighbours: { source: "sheet" } }).sheets, true);
});

test("the survey checklist: general guidance, every fact with its official source and date", async () => {
  const { HOUSE_AGES, SURVEY_SOURCES, checklist, surveyMessage, NOT_A_SURVEY } = await import("../../src/kits/construction/lib/survey.js");
  for (const [age, a] of Object.entries(HOUSE_AGES)) {
    const list = checklist(age);
    assert.ok(list.length >= 6 && list.length <= 10, age);
    for (const c of list) if (c.source) assert.ok(SURVEY_SOURCES[c.source]?.url.startsWith("https://www."), `${age}: ${c.name}`);
    assert.ok(a.said && a.years);
  }
  assert.ok(checklist("victorian").some((c) => c.source === "lead") && !checklist("modern").some((c) => c.source === "lead"), "lead only before 1970");
  assert.ok(Object.values(SURVEY_SOURCES).every((s) => /^\d{4}-\d{2}-\d{2}$/.test(s.checked)));
  assert.match(NOT_A_SURVEY, /^General guidance, not a survey\./);
  assert.equal(surveyMessage("Hello", "interwar", "N8"), "Hello\n· A 1920s or 1930s house\n· Postcode district: N8");
  assert.match(errorsFor((s) => { s.surveyPage.start = "georgian"; }), /surveyPage\.start/);
});

test("a project's own words can't carry an address (C-01), and a side extension is no more than 4 m (C-02)", async () => {
  for (const [field, value] of [["place", "Highbury, N5 1AA"], ["place", "14 Mildmay Grove, Islington"], ["scope", "A rear extension at 3 Aberdeen Park"], ["story", ["We started at 14 Mildmay Grove N1 4RH in May."]]]) {
    assert.match(errorsFor((s) => { s.projects.items[0][field] = value; }), /never a house number, street address or full postcode/, `${field}: ${value}`);
  }
  assert.doesNotMatch(errorsFor((s) => { s.projects.items[0].story = ["Twelve weeks on site, 3 Highbury families as neighbours, N5."]; s.projects.items[0].place = "Highbury, N5"; }), /street address/);
  const { TOPICS } = await import("../../src/kits/construction/lib/planning.js");
  assert.ok(TOPICS.side.points.some((p) => p.includes("no more than 4 m high")));
});
