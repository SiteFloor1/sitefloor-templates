import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { claimProblem, isGdcNumber, ROLES } from "../../src/kits/smile/lib/gdc.js";
import { chooserText, visitSpan, spanWords, duration, visitDates, minutesOf, clock, arrivalTimes, addMonthsYmd, dayEventsIcs, reminderEvents } from "../../src/kits/smile/lib/smile.js";
import { HOME_PARTS, homeOrderProblem } from "../../src/kits/smile/home.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/smile/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-smile-client/site.json", "utf8"));
const look = JSON.parse(readFileSync("src/looks/booth/look.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("the look's home order lists every section once", () => {
  assert.equal(homeOrderProblem(look.homeOrder), null);
  assert.match(homeOrderProblem(look.homeOrder.slice(1)) ?? "", /leaves out/);
  assert.equal(Object.keys(HOME_PARTS).length, look.homeOrder.length);
});

test("copy can't promise shades, permanence, guarantees, no pain or lasers, or claim a specialist", () => {
  assert.match(claimProblem("Up to 8 shades whiter") ?? "", /shades/);
  assert.match(claimProblem("Two to three shades") ?? "", /shades/);
  assert.match(claimProblem("A permanent result") ?? "", /permanent/);
  assert.match(claimProblem("Guaranteed whiter teeth") ?? "", /guarantee/);
  assert.match(claimProblem("Completely painless") ?? "", /pain/);
  assert.match(claimProblem("Laser whitening") ?? "", /laser/);
  assert.match(claimProblem("Our whitening specialist") ?? "", /specialist/);
  assert.equal(claimProblem("Our whitening specialist", { specialist: true }), null);
  assert.equal(claimProblem("We won't promise a shade. Some people feel sensitive for a day or two."), null);
  for (const t of ["Our specialists", "She specialises in veneers", "Specialising in whitening", "specialized care"]) assert.match(claimProblem(t) ?? "", /specialist/, t);
  for (const t of ["LED whitening", "Light-activated whitening", "Light accelerated gel", "Blue light whitening"]) assert.match(claimProblem(t) ?? "", /laser or light/, t);
  assert.equal(claimProblem("I led the team"), null);
  assert.match(claimProblem("a shade or two lighter") ?? "", /shades/);
  assert.match(claimProblem("one shade whiter") ?? "", /shades/);
  assert.match(claimProblem("Lifetime results") ?? "", /permanent/);
  assert.match(errorsFor((s) => { s.treatments.items[0].line = "Up to 8 shades whiter in an hour."; }), /treatments\.items\[0\]\.line: promises a number of shades/);
  assert.match(errorsFor((s) => { s.clinicians.items[0].interest = "cosmetic specialist"; }), /clinicians\.items\[0\]\.interest/);
});

test("every string the studio writes is checked, wherever it sits", () => {
  assert.match(errorsFor((s) => { s.business.description = "Guaranteed whiter teeth."; }), /business\.description: guarantees/);
  assert.match(errorsFor((s) => { s.patientInfo.intro = "Painless whitening."; }), /patientInfo\.intro: promises no pain/);
  assert.match(errorsFor((s) => { s.patientInfo.notes[0].text = "Laser whitening."; }), /patientInfo\.notes\[0\]\.text/);
  assert.match(errorsFor((s) => { s.visitInfo.intro = "Laser whitening by the station."; }), /visitInfo\.intro/);
  assert.match(errorsFor((s) => { s.messages.general = "Hi, I'd like permanent whitening."; }), /messages\.general: says the result is permanent/);
  assert.match(errorsFor((s) => { s.nav[0].label = "Lifetime whitening"; }), /nav\[0\]\.label/);
});

test("\"specialist\" only in the bio or interest of a clinician on a GDC specialist list", () => {
  const listed = (/** @type {any} */ s) => { s.clinicians.items[0].specialist = "Prosthodontics"; };
  assert.equal(errorsFor((s) => { listed(s); s.clinicians.items[0].bio = "A specialist in prosthodontics."; }), "");
  assert.match(errorsFor((s) => { listed(s); s.hero.intro = "Our specialist whitening team."; }), /hero\.intro: uses "specialist"/);
  assert.match(errorsFor((s) => { listed(s); s.clinicians.items[1].bio = "Leah specialises in hygiene."; }), /clinicians\.items\[1\]\.bio/);
});

test("every clinician is shown as the GDC asks; demos use 000000 and clients their real number", () => {
  assert.ok(isGdcNumber("123456"));
  assert.ok(!isGdcNumber("GDC 1234"));
  assert.match(errorsFor((s) => { delete s.clinicians.items[0].country; }), /clinicians\.items\[0\]\.country/);
  assert.match(errorsFor((s) => { s.clinicians.items[0].gdc = "123456"; }), /a demo uses "000000"/);
  assert.match(errorsFor((s) => { s.clinicians.items[0].gdc = "000000"; }, client), /placeholder/);
  assert.match(errorsFor((s) => { s.clinicians.items[0].role = "cosmetic-artist"; }), /one of dentist/);
});

test("whitening only by someone allowed to whiten", () => {
  assert.equal(ROLES.dentist.whitens, "yes");
  assert.match(errorsFor((s) => { delete s.clinicians.items[1].prescribedBy; }), /Leah Morgan can't carry out whitening/);
  assert.match(errorsFor((s) => { s.clinicians.items[1].role = "nurse"; }), /can't carry out whitening/);
  assert.match(errorsFor((s) => { s.clinicians.items[1].prescribedBy = "leah"; }), /prescribedBy: the id of the dentist/);
});

test("gallery photos need recorded consent, unretouched; model photos only on a demo, never with a before", () => {
  const consented = { id: "p1", photo: demo.smiles.items[0].photo, treatment: "bonding", by: "marlie", consent: { date: "2026-10-02", ref: "C-114", retouched: false } };
  assert.equal(errorsFor((s) => { s.smiles.items.push(consented); }), "");
  assert.match(errorsFor((s) => { s.smiles.items.push({ ...consented, consent: undefined }); }), /recorded consent/);
  assert.match(errorsFor((s) => { s.smiles.items.push({ ...consented, consent: { date: "2026-10-02", ref: "C-1" } }); }), /retouched/);
  assert.match(errorsFor((s) => { s.smiles.items[0].before = s.smiles.items[1].photo; }), /two different people/);
  assert.match(errorsFor((s) => { s.plan = "signature"; s.smiles = structuredClone(demo.smiles); s.features.push("smile-gallery"); }, client), /only its own patients/);
});

test("a complaints procedure and NHS or private status are required, on every site", () => {
  assert.match(errorsFor((s) => { s.features = s.features.filter((/** @type {string} */ f) => f !== "smile-patient-info"); }, client), /"smile-patient-info" is required on every dental site/);
  assert.match(errorsFor((s) => { delete s.patientInfo.complaints; }), /patientInfo\.complaints/);
  assert.match(errorsFor((s) => { s.patientInfo.status = "both"; }), /"private", "nhs" or "mixed"/);
});

test("the booth strip needs exactly four photographs", () => {
  assert.match(errorsFor((s) => { s.hero.strip.frames.pop(); }), /exactly four/);
  assert.match(errorsFor((s) => { s.hero.strip.frames[0].focus = "top"; }), /where the smile sits/);
  assert.match(errorsFor((s) => { s.hero.strip.models = "yes"; }), /hero\.strip\.models/);
});

test("the chooser writes the option's message, with a date when asked", () => {
  assert.equal(chooserText("Hi, just prices."), "Hi, just prices.");
  assert.equal(chooserText("Married on {date}.", "2027-06-05"), "Married on 5 June 2027.");
});

test("visits add up in the studio's own timings and words", () => {
  const v = [{ label: "Consultation", minutes: 45 }, { label: "Trays", minutes: 30, after: 2 }, { label: "Check-in", minutes: 15, after: 3 }];
  assert.deepEqual(visitSpan(v), { count: 3, weeks: 5 });
  assert.equal(spanWords(v), "Three visits over five weeks");
  assert.equal(spanWords([{ label: "Hygiene", minutes: 45 }]), "One visit");
  assert.equal(duration(45), "45 min");
  assert.equal(duration(120), "2 hours");
  assert.equal(duration(90), "1 hour 30 min");
  assert.deepEqual(visitDates(v, "2027-03-22").map((x) => x.date), ["2027-03-22", "2027-04-05", "2027-04-26"]); // across the clocks changing
});

test("arriving re-times the route to the appointment", () => {
  assert.equal(minutesOf("08:15"), 495);
  assert.ok(Number.isNaN(minutesOf("8:15")));
  assert.equal(clock(495), "8.15");
  assert.equal(clock(-2), "23.58");
  assert.deepEqual(arrivalTimes("18:00", [{ at: -2 }, { at: 0 }, { at: 45 }]).map((s) => s.time), ["17.58", "18.00", "18.45"]);
});

test("reminders land on real days and the calendar file is all-day events", () => {
  assert.equal(addMonthsYmd("2027-01-31", 1), "2027-02-28");
  assert.equal(addMonthsYmd("2027-08-31", 6), "2028-02-29");
  const events = reminderEvents("2027-01-10", [{ id: "top-up", label: "Top-up, gel", months: 12 }]);
  assert.deepEqual(events, [{ id: "top-up", date: "2028-01-10", title: "Top-up, gel", note: undefined }]);
  const ics = dayEventsIcs({ events, studio: "Marlie", place: "4 Calvert Yard, London", stamp: "20270110T090000Z" });
  assert.match(ics, /DTSTART;VALUE=DATE:20280110\r\n/);
  assert.match(ics, /DTEND;VALUE=DATE:20280111\r\n/);
  assert.match(ics, /SUMMARY:Top-up\\, gel/);
  assert.match(ics, /^BEGIN:VCALENDAR\r\n[\s\S]*END:VCALENDAR\r\n$/);
});
