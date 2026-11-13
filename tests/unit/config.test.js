import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateSite as validate } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const catalog = loadCatalog(new URL("../..", import.meta.url).pathname);
const validateSite = (site, opts = {}) => validate(site, { catalog, ...opts });

const load = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const demo = () => load("../../sites/demos/barber/site.json");
const client = () => load("../fixtures/sites/test-barber-client/site.json");
const starter = () => load("../fixtures/sites/test-barber-starter/site.json");
const has = (errors, text) => errors.some((e) => e.includes(text));

test("the barber demo and both fixtures are valid", () => {
  assert.deepEqual(validateSite(demo()), []);
  assert.deepEqual(validateSite(client()), []);
  assert.deepEqual(validateSite(starter()), []);
});

test("missing required fields are reported with their path", () => {
  const s = client();
  delete s.contact.phone;
  s.business.name = "";
  const errors = validateSite(s);
  assert.ok(has(errors, "contact.phone"));
  assert.ok(has(errors, "business.name"));
});

test("a client site cannot ship the fictional demo phone number", () => {
  const s = client();
  s.contact.whatsapp = "447700900123";
  assert.ok(has(validateSite(s), "fictional"));
});

test("a client site must show an email address", () => {
  const s = client();
  delete s.contact.email;
  assert.ok(has(validateSite(s), "contact.email"));
});

test("a client site cannot use sample reviews or simulated chair data", () => {
  const s = client();
  s.reviews.source = "sample";
  s.chairBoard.source = "simulated";
  const errors = validateSite(s);
  assert.ok(has(errors, "reviews.source"));
  assert.ok(has(errors, "chairBoard.source"));
});

test("a feature above the site's plan is rejected", () => {
  const s = starter();
  s.features.push("chair-board");
  s.staff = [{ name: "A" }];
  s.chairBoard = { source: "sheet", csvUrl: "https://docs.google.com/spreadsheets/d/e/X/pub?output=csv" };
  assert.ok(has(validateSite(s), "needs the signature plan"));
});

test("a feature's required config must be present", () => {
  const s = client();
  delete s.services;
  assert.ok(has(validateSite(s), 'required by feature "build-your-cut"'));
});

test("demo sites can never be indexable", () => {
  const s = demo();
  s.indexable = true;
  assert.ok(has(validateSite(s), "never be indexable"));
});

test("bad opening hours are caught", () => {
  const s = client();
  s.hours.weekly.mon = [["9am", "6pm"]];
  s.hours.weekly.tue = [["10:00", "10:00"]];
  s.hours.timezone = "Mars/Olympus";
  const errors = validateSite(s);
  assert.ok(has(errors, "hours.weekly.mon[0]"));
  assert.ok(has(errors, "same"));
  assert.ok(has(errors, "hours.timezone"));
});

test("placeholder text left in the config is caught", () => {
  const s = client();
  s.hero.intro = "REPLACE_ME";
  assert.ok(has(validateSite(s), "placeholder"));
});

test("chair board sheet link must be a published Google Sheet CSV", () => {
  const s = client();
  s.chairBoard.csvUrl = "https://evil.example.com/data.csv";
  assert.ok(has(validateSite(s), "chairBoard.csvUrl"));
});

test("missing image files are caught when a file checker is given", () => {
  const errors = validateSite(client(), { fileExists: () => false });
  assert.ok(has(errors, "gallery.photos[0].src"));
  assert.ok(has(errors, "staff[0].photo"));
});

test("unknown feature, kit, look and plan are rejected", () => {
  const s = client();
  s.features.push("teleporter");
  s.plan = "platinum";
  const errors = validateSite(s);
  assert.ok(has(errors, "teleporter"));
  assert.ok(has(errors, "plan"));
  const t = client();
  t.look = "neon";
  assert.ok(has(validateSite(t), "unknown look"));
});

test("non-object input is rejected cleanly", () => {
  assert.deepEqual(validateSite(null), ["site: must be a JSON object"]);
});

test("each review needs its own 1–5 rating and a real date, not a relative one", () => {
  const s = client();
  s.reviews.items[0].rating = 6;
  s.reviews.items[0].date = "1 week ago";
  s.reviews.items.push({ text: "Fine.", author: "B.", rating: 3.5, date: "2026-10", when: "2 days ago" });
  const errors = validateSite(s);
  assert.ok(has(errors, "reviews.items[0].rating"));
  assert.ok(has(errors, "reviews.items[0].date"));
  assert.ok(has(errors, "reviews.items[1].rating"));
  assert.ok(has(errors, "reviews.items[1].when"));
});

test("schema 1 keys that were removed are reported, not silently ignored", () => {
  const s = demo();
  s.location.mapLabels = ["Kirkgate"];
  s.styleGuide.author = "Danny";
  const errors = validateSite(s);
  assert.ok(has(errors, "location.mapLabels"));
  assert.ok(has(errors, "styleGuide.author"));
  const old = demo();
  old.schemaVersion = 1;
  assert.ok(has(validateSite(old), "schemaVersion"));
});

test("copy that would leave blank headings or empty messages is caught", () => {
  const s = client();
  delete s.hero;
  delete s.messages;
  s.nav = [];
  delete s.sections.prices;
  delete s.team;
  const errors = validateSite(s);
  for (const f of ["hero", "messages.general", "nav", "sections.prices.title", 'required by feature "team"']) assert.ok(has(errors, f), f);
});

test("menu prices and times must be numbers, ids unique", () => {
  const s = client();
  s.services[0].price = "20";
  delete s.services[1].minutes;
  s.extras.push({ ...s.extras[0] });
  const errors = validateSite(s);
  assert.ok(has(errors, "services[0].price"));
  assert.ok(has(errors, "services[1].minutes"));
  assert.ok(has(errors, "is used twice"));
});

test("unsafe links, unknown schema types and impossible dates are rejected", () => {
  const s = client();
  s.nav[0] = { label: "Hi", href: "javascript:alert(1)" };
  s.hero.secondaryCta = { label: "x", href: "http://insecure.example" };
  s.business.schemaType = "BarberShp";
  s.hours.exceptions = [{ date: "2026-02-30", ranges: [] }];
  const errors = validateSite(s);
  for (const f of ["nav[0].href", "hero.secondaryCta", "business.schemaType", "hours.exceptions[0].date"]) assert.ok(has(errors, f), f);
});

test("every site must show hours and address; style guide needs its block", () => {
  const s = demo();
  s.features = s.features.filter((f) => f !== "visit");
  delete s.styleGuide;
  const errors = validateSite(s);
  assert.ok(has(errors, '"visit" is required'));
  assert.ok(has(errors, 'required by feature "style-guide"'));
});

test("placeholder errors name the field", () => {
  const s = client();
  s.location.streetAddress = "REPLACE_ME";
  assert.ok(has(validateSite(s), "location.streetAddress: still has placeholder"));
});

test("a feature above the plan is allowed only as a listed add-on", () => {
  const s = starter();
  s.features.push("team");
  s.staff = [{ name: "A" }];
  s.team = { title: "Team" };
  assert.ok(has(validateSite(s), "needs the plus plan"));
  s.addons = ["team"];
  assert.deepEqual(validateSite(s), []);
  s.addons = ["team", "visit"];
  assert.ok(has(validateSite(s), '"visit" is already included'));
  s.addons = ["team", "chair-board"];
  assert.ok(has(validateSite(s), "isn't in \"features\""));
});

test("gallery: Behold feed links, Instagram profiles and filters are checked; demos can't link real accounts", () => {
  const s = client();
  s.gallery.feedUrl = "https://evil.example/feed";
  s.gallery.profile = "https://instagram.com.evil.example/x";
  s.gallery.filters.push({ tag: "#Skin Fade", label: "" });
  const errors = validateSite(s);
  for (const f of ["gallery.feedUrl", "gallery.profile", "gallery.filters[3].tag", "gallery.filters[3].label"]) assert.ok(has(errors, f), f);
  const d = demo();
  d.gallery.profile = "https://www.instagram.com/realshop";
  assert.ok(has(validateSite(d), "must not link to a real Instagram"));
  const w = demo();
  w.features = w.features.filter((f) => f !== "gallery");
  assert.ok(has(validateSite(w), '"work" needs "gallery"'));
});

test("a misspelt top-level setting is refused on every kit", async () => {
  const { readFileSync, readdirSync } = await import("node:fs");
  const { loadCatalog } = await import("../../scripts/lib/catalog.js");
  const catalog = loadCatalog(process.cwd());
  for (const name of readdirSync("sites/demos")) {
    const site = JSON.parse(readFileSync(`sites/demos/${name}/site.json`, "utf8"));
    const errors = validateSite({ ...site, regulaton: {} }, { catalog });
    assert.ok(errors.some((e) => e.startsWith("regulaton: unknown top-level setting")), `${name}: ${errors.join("; ")}`);
  }
});

test("every real site passes the top-level check", async () => {
  const { readFileSync, readdirSync, existsSync } = await import("node:fs");
  const { loadCatalog } = await import("../../scripts/lib/catalog.js");
  const catalog = loadCatalog(process.cwd());
  const dirs = ["sites/demos", "sites/clients", "tests/fixtures/sites"].filter((d) => existsSync(d));
  let n = 0;
  for (const dir of dirs) for (const name of readdirSync(dir)) {
    const file = `${dir}/${name}/site.json`;
    if (!existsSync(file)) continue;
    const errors = validateSite(JSON.parse(readFileSync(file, "utf8")), { catalog }).filter((e) => e.includes("unknown top-level setting"));
    assert.deepEqual(errors, [], file);
    n++;
  }
  assert.ok(n > 0);
});

test("another trade's settings are refused: allowed keys come from the site's own kit", async () => {
  const { readFileSync } = await import("node:fs");
  const { loadCatalog } = await import("../../scripts/lib/catalog.js");
  const { topKeys } = await import("../../src/core/lib/config.js");
  const catalog = loadCatalog(process.cwd());
  const barber = JSON.parse(readFileSync("sites/demos/barber/site.json", "utf8"));
  // matterCode belongs to a law feature, menuPdf to the restaurant kit's settings, shop to the lingerie kit's.
  for (const key of ["matterCode", "menuPdf", "shop"]) {
    assert.ok(validateSite({ ...barber, [key]: {} }, { catalog }).some((e) => e.startsWith(`${key}: unknown top-level setting for the barber kit`)), key);
  }
  assert.ok(topKeys("law").has("matterCode") && topKeys("restaurant").has("menuPdf") && topKeys("lingerie").has("shop"));
});

test("every kit's client template passes the top-level check", async () => {
  const { readFileSync, readdirSync, existsSync } = await import("node:fs");
  const { topKeys } = await import("../../src/core/lib/config.js");
  for (const kit of readdirSync("src/kits")) {
    const file = `src/kits/${kit}/client-template.json`;
    if (!existsSync(file)) continue;
    const allowed = topKeys(kit);
    assert.deepEqual(Object.keys(JSON.parse(readFileSync(file, "utf8"))).filter((k) => !allowed.has(k)), [], file);
  }
});

test("a malformed services, extras or jobs setting gives a clear error, never a crash", async () => {
  const { readFileSync } = await import("node:fs");
  const { loadCatalog } = await import("../../scripts/lib/catalog.js");
  const catalog = loadCatalog(process.cwd());
  for (const name of ["car-studio", "barber"]) {
    const site = JSON.parse(readFileSync(`sites/demos/${name}/site.json`, "utf8"));
    for (const key of ["services", "extras", "jobs"]) {
      for (const bad of [{}, "x", 3, [null]]) {
        const errors = validateSite({ ...site, [key]: bad }, { catalog });
        assert.ok(errors.some((e) => e.startsWith(`${key}`)), `${name} ${key}=${JSON.stringify(bad)}: ${errors.join("; ")}`);
      }
    }
  }
});
