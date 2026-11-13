// Construction kit and the Handover look, as a client uses them: the home page (visualiser, how a build runs, the
// finished projects), the 3D extension loading only on tap and working on a 390px phone (a sideways drag turns it,
// the depth slider, the house and roof, before and after), the price only from the builder's own rates, "your
// house, this week" by site code (the demo's example, a client's sheet, a sheet with too much in it), the brief
// asking only for the postcode district, the projects map loading only when asked, and the build in 3D by stage.
import { test, expect, site, start, watchErrors } from "./helpers.js";

test.use({ reducedMotion: "reduce" });

const demo = site("demos/construction");
const client = site("_fixtures/test-construction-client");
const model = (/** @type {import("@playwright/test").Page} */ page, sel = "[data-vz-canvas]") =>
  page.evaluate((s) => { const m = /** @type {any} */ (document.querySelector(s)).sfModel; return { turn: m.turn, ...m.state }; }, sel);

test("the home page: the extension photo first, how a build runs, the finished projects, the yard", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  const asked = [];
  page.on("request", (r) => { if (/house-3d-/.test(r.url())) asked.push(r.url()); });
  await page.goto(srv.base + "/");
  await page.waitForLoadState("networkidle");
  const ids = await page.$$eval("main > section", (all) => all.map((x) => x.id || x.className));
  expect(ids).toEqual(["hero hv-hero", "how-a-build-runs", "projects", "visit"]);
  await expect(page.locator(".hv-h1")).toHaveText("Build it here first.");
  await expect(page.locator(".bd-steps li b")).toHaveText(["Survey", "Structure", "Envelope", "Finish"]);
  await expect(page.locator(".bd-ground")).toContainText("ground level");
  expect(asked, "nothing 3D loads with the page").toEqual([]);
  await expect(page.locator("[data-vz-try]")).toContainText(/about \d+ KB/);
  await expect(page.locator("[data-vz-controls]")).toBeHidden();
  expect(errors).toEqual([]);
  await srv.close();
});

test("on a 390px phone: tap loads the 3D house; a sideways drag, the depth, the house, the roof and before/after all work", async ({ browser }) => {
  const srv = await start(demo);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const errors = watchErrors(page);
  await page.goto(srv.base + "/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.locator("[data-vz-try]").tap();
  const canvas = page.locator("[data-vz-canvas]");
  await expect(canvas).toBeVisible({ timeout: 20000 });
  await expect(page.locator("[data-vz-controls]")).toBeVisible();
  await expect.poll(() => page.evaluate(() => !!(/** @type {any} */ (document.querySelector("[data-vz-canvas]"))).sfModel)).toBe(true);
  const box = /** @type {{ x: number, y: number, width: number, height: number }} */ (await canvas.boundingBox());
  expect(box.width).toBeGreaterThan(300);
  expect(box.height / box.width).toBeCloseTo(1.25, 1); // the photo's 4:5 on a phone

  // A sideways drag with a finger turns the house.
  await canvas.scrollIntoViewIfNeeded();
  const b = /** @type {{ x: number, y: number, width: number, height: number }} */ (await canvas.boundingBox());
  const before = (await model(page)).turn;
  const cdp = await ctx.newCDPSession(page);
  const y = b.y + b.height / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: b.x + b.width - 40, y }] });
  for (let i = 1; i <= 10; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: b.x + b.width - 40 - i * 22, y }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(async () => (await model(page)).turn).not.toBeCloseTo(before, 1);

  // The depth slider redraws the model and the read-out.
  await page.locator("[data-vz-depth]").first().fill("6");
  await expect(page.locator("[data-vz-size]").first()).toHaveText("6.0 m deep · 5.4 m wide");
  await expect(page.locator("[data-vz-room]").first()).toHaveText("about 29 m² of new room");
  expect((await model(page)).depth).toBe(6);
  await page.locator('[data-vz-set="house"][data-v="semi"]').tap();
  await page.locator('[data-vz-set="roof"][data-v="glass"]').tap();
  await expect(page.locator("[data-vz-size]").first()).toHaveText("6.0 m deep · 6.6 m wide");
  await page.locator('[data-vz-set="show"][data-v="before"]').tap();
  expect(await model(page)).toMatchObject({ house: "semi", roof: "glass", show: "before", depth: 6 });
  await expect(page.locator('[data-vz-set="show"][data-v="before"]')).toHaveAttribute("aria-pressed", "true");

  // The phone bar never covers the read-out.
  const read = page.locator(".bd-vz-read");
  await read.scrollIntoViewIfNeeded();
  const r = /** @type {{ y: number, height: number }} */ (await read.boundingBox());
  const bar = /** @type {{ y: number }} */ (await page.locator(".mbar").boundingBox());
  expect(r.y + r.height).toBeLessThanOrEqual(bar.y + 1);
  expect(errors).toEqual([]);
  await ctx.close();
  await srv.close();
});

test("without WebGL the photograph stays and says so", async ({ page }) => {
  const srv = await start(demo);
  await page.addInitScript(() => { HTMLCanvasElement.prototype.getContext = () => null; });
  await page.goto(srv.base + "/");
  await page.locator("[data-vz-try]").click();
  await expect(page.locator("[data-vz-status]")).toContainText("3D isn't available");
  await expect(page.locator(".bd-vz-photo")).toBeVisible();
  await expect(page.locator("[data-vz-canvas]")).toBeHidden();
  await srv.close();
});

test("a demo shows no price; a client's own rates give a range on the visualiser page, and the design goes on WhatsApp", async ({ page }) => {
  let srv = await start(demo);
  await page.goto(srv.base + "/extension");
  await expect(page.locator(".bd-vz-price")).toHaveText(/Demo: no rates set\./);
  await expect(page.locator(".bd-vz-price")).not.toContainText("£");
  await srv.close();
  srv = await start(client);
  await page.goto(srv.base + "/extension");
  await page.locator("[data-vz-try]").click();
  await expect(page.locator("[data-vz-controls]")).toBeVisible({ timeout: 20000 });
  // Semi, 4 m: (6.6 - 0.6) × 4 = 24 m² at £3,200–£3,900 per m², rounded out to the nearest £1,000.
  await expect(page.locator("[data-vz-price]")).toHaveText("£76,000 to £94,000, plus VAT, from our own rates for an extension like this. A range, not a quote.");
  await page.locator("[data-vz-depth]").fill("5");
  await expect(page.locator("[data-vz-price]")).toContainText("£96,000 to £117,000");
  const href = decodeURIComponent((await page.locator("[data-vz-send]").getAttribute("href")) ?? "");
  expect(href).toContain("A semi-detached house, an extension about 5.0 m deep and 6.6 m wide (about 30 m² inside), with a flat roof with a roof light.");
  await srv.close();
});

test("your house, this week: the demo's example code, an unknown code, and the home page's strip", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/your-build#PG4K7M2Q");
  await expect(page.locator("#sp-out")).toBeVisible();
  await expect(page.locator("[data-sp-done]")).toHaveText("The roof structure is up.");
  await expect(page.locator("[data-sp-stage-name]")).toHaveText("Envelope · stage 3 of 4");
  await expect(page.locator("[data-sp-next]")).toContainText("Roofer on site Monday");
  await expect(page.locator("[data-sp-photo]")).toBeVisible();
  await expect(page.locator(".bd-sp-bar li.done")).toHaveCount(3);
  await page.fill("#sp-code", "ZZZZ9999");
  await page.click("#sp-form button");
  await expect(page.locator("#sp-off")).toContainText("can't find that code");
  await expect(page.locator("#sp-out")).toBeHidden();
  await page.goto(srv.base + "/");
  await page.fill("#site-code", "pg4k 7m2q");
  await page.click(".hv-intro .bd-key button");
  await expect(page.locator("[data-sp-done]")).toHaveText("The roof structure is up.");
  await srv.close();
});

test("a client's sheet: the week shows with its Drive photo; a sheet with anything else in it is refused", async ({ page }) => {
  const srv = await start(client);
  const now = "2026-10-19 09:00";
  let csv = `code,stage,updated_at,done,next,photo\nAB12CD34EF,structure,${now},The steel is in.,Blockwork from Tuesday.,https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012345/view\n`;
  await page.route("https://docs.google.com/**", (r) => r.fulfill({ status: 200, contentType: "text/csv", body: csv }));
  await page.route("https://drive.google.com/**", (r) => r.fulfill({ status: 200, contentType: "image/svg+xml", body: "<svg xmlns='http://www.w3.org/2000/svg' width='4' height='3'/>" }));
  await page.goto(srv.base + "/your-build#AB12CD34EF");
  await expect(page.locator("[data-sp-done]")).toHaveText("The steel is in.");
  await expect(page.locator("[data-sp-stage-name]")).toHaveText("Structure · stage 2 of 4");
  await expect(page.locator("[data-sp-photo]")).toHaveAttribute("src", "https://drive.google.com/thumbnail?id=1AbCdEfGhIjKlMnOpQrStUvWxYz012345&sz=w1600");
  const csp = (await page.request.get(srv.base + "/your-build")).headers()["content-security-policy"] ?? "";
  expect(csp).toContain("https://drive.google.com");
  expect(csp).toContain("https://docs.google.com");
  csv = `code,stage,updated_at,client\nAB12CD34EF,structure,${now},Mrs Smith\n`;
  await page.reload();
  await expect(page.locator("#sp-off")).toContainText("isn't loading right now");
  await expect(page.locator("#sp-out")).toBeHidden();
  await srv.close();
});

test("start a project asks only for the postcode district and sends one WhatsApp message", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/start");
  /** @type {string[]} */ const opened = [];
  await page.exposeFunction("sfOpened", (u) => opened.push(u));
  await page.evaluate(() => { window.open = (u) => { /** @type {any} */ (window).sfOpened(String(u)); return null; }; });
  await page.locator('.bd-chips label:has(input[value="Basements"])').click();
  await page.fill('input[name="where"]', "N5 1QX house");
  await page.click(".bd-brief-form button[type=submit]");
  await expect(page.locator("[data-brief-err]")).toBeHidden();
  await expect.poll(() => opened.length).toBe(1);
  const text = decodeURIComponent(opened[0]);
  expect(text).toContain("What: Basements");
  expect(text).toContain("Where: N5");
  expect(text).not.toContain("1QX");
  await page.fill('input[name="where"]', "my house");
  await page.click(".bd-brief-form button[type=submit]");
  await expect(page.locator("[data-brief-err]")).toContainText("postcode district");
  await srv.close();
});

test("the projects map loads OpenStreetMap only when asked; the build in 3D steps through the stages", async ({ page }) => {
  const srv = await start(demo);
  const tiles = [];
  await page.route("https://tile.openstreetmap.org/**", (r) => { tiles.push(r.request().url()); return r.fulfill({ status: 200, contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64") }); });
  await page.goto(srv.base + "/projects");
  await expect(page.locator(".bd-map-list li")).toHaveCount(3);
  await page.waitForLoadState("networkidle");
  expect(tiles).toEqual([]);
  await page.locator("[data-map-show]").click();
  await expect(page.locator(".bd-map-pin")).toHaveCount(3);
  await expect.poll(() => tiles.length).toBeGreaterThan(0);
  await page.goto(srv.base + "/how-we-build");
  await page.locator('[data-b3-step="1"]').click(); // choosing a stage loads the model at that stage
  await expect(page.locator("[data-b3-canvas]")).toBeVisible({ timeout: 20000 });
  await expect.poll(async () => (await model(page, "[data-b3-canvas]")).phase).toBe("structure");
  await page.locator('[data-b3-step="0"]').click();
  await expect.poll(async () => (await model(page, "[data-b3-canvas]")).phase).toBe("survey");
  await expect(page.locator('[data-b3-step="0"]')).toHaveAttribute("aria-pressed", "true");
  await srv.close();
});

test("the specification filters by kind", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/specification");
  await expect(page.locator(".bd-spec-list li:visible")).toHaveCount(8);
  await page.locator('[data-spec-cat="floors"]').click();
  await expect(page.locator(".bd-spec-list li:visible")).toHaveCount(2);
  await srv.close();
});

test("the planning guide follows the depth and the house, draws the limits, and says it is a guide", async ({ page }) => {
  // Three minutes: CI draws the 3D in software, and this test rebuilds the scene for a second house.
  test.setTimeout(180_000);
  const srv = await start(demo);
  await page.goto(srv.base + "/extension");
  await expect(page.locator(".bd-pg-not")).toHaveText("A guide, not a decision. Check with your council or apply for a lawful development certificate.");
  await expect(page.locator(".bd-pg-src a").first()).toHaveAttribute("href", /^https:\/\/www\.gov\.uk\//);
  await expect(page.locator(".bd-pg-src")).toContainText("checked 4 November 2026");
  await page.locator("[data-vz-try]").click();
  await expect(page.locator("[data-vz-controls]")).toBeVisible({ timeout: 20000 });
  await expect(page.locator("[data-pg-now]")).toContainText("Between 3 and 6 m");
  await page.locator("[data-vz-depth]").fill("3");
  await expect(page.locator("[data-pg-now]")).toContainText("Within 3 m");
  await expect(page.locator("[data-pg-scale]")).toHaveAttribute("data-zone", "pd");
  await page.locator("[data-vz-depth]").fill("6");
  await expect(page.locator("[data-pg-scale]")).toHaveAttribute("data-zone", "prior");
  // One change of house only: each rebuilds the scene, which is slow on CI's software WebGL.
  await page.locator('[data-vz-set="house"][data-v="detached"]').click();
  await page.locator("[data-vz-depth]").fill("5");
  await expect(page.locator("[data-pg-now]")).toContainText("Between 4 and 8 m");
  await srv.close();
});

test("the light study moves the sun for the month and the time, and says where it is", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/extension");
  await page.selectOption("[data-ls-month]", "12");
  await page.locator("[data-ls-time]").fill("720");
  await expect(page.locator("[data-ls-now]")).toContainText(/21 December, 12:00 pm in N5, garden facing S\. The sun is 1[45]° up, in the south\. It shines on the new glass\./);
  await page.locator('[data-ls-face="N"]').click();
  await expect(page.locator("[data-ls-now]")).toContainText("The glass is in shade");
  await page.locator("[data-ls-time]").fill("1260");
  await expect(page.locator("[data-ls-now]")).toContainText("The sun is down.");
  await page.locator("[data-vz-try]").click();
  await expect(page.locator(".bd-ls-dial")).toBeVisible({ timeout: 20000 });
  await page.selectOption("[data-ls-month]", "6");
  await page.locator("[data-ls-time]").fill("780");
  await expect(page.locator(".bd-ls-dial")).toHaveAttribute("data-up", "true");
  await srv.close();
});

test("living through a build: dates from a start, a calendar file; and the home page's finish months", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/living");
  await page.fill("[data-lv-start]", "2027-03-01");
  await page.locator("[data-lv-start]").dispatchEvent("change");
  await expect(page.locator('[data-lv-dates="0"]')).toHaveText("1 Mar 2027 to 28 Mar 2027");
  await expect(page.locator("[data-lv-ics]")).toHaveAttribute("href", /^blob:/);
  const [file] = await Promise.all([page.waitForEvent("download"), page.locator("[data-lv-ics]").click()]);
  const ics = (await import("node:fs")).readFileSync(/** @type {string} */ (await file.path()), "utf8");
  expect(ics).toContain("SUMMARY:Structure starts (estimate)");
  await page.goto(srv.base + "/");
  await page.selectOption("[data-when-start]", { index: 3 });
  await expect(page.locator("[data-when-out]")).toContainText(/we'd usually hand over in [A-Z][a-z]{2}/);
  await srv.close();
});

test("the sample box sends the ticked finishes and no more than the box holds", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/specification");
  /** @type {string[]} */ const opened = [];
  await page.exposeFunction("sfOpened", (u) => opened.push(u));
  await page.evaluate(() => { window.open = (u) => { /** @type {any} */ (window).sfOpened(String(u)); return null; }; });
  const boxes = page.locator('.bd-sb-form input[name="pick"]');
  for (let i = 0; i < 6; i++) await boxes.nth(i).check({ force: true });
  await expect(boxes.nth(6)).toBeDisabled();
  await page.fill('.bd-sb-form input[name="where"]', "nw3");
  await page.click(".bd-sb-form button[type=submit]");
  await expect.poll(() => opened.length).toBe(1);
  const text = decodeURIComponent(opened[0]);
  expect(text).toContain("· Oak boards");
  expect(text).toContain("Postcode district: NW3");
  await srv.close();
});

test("the loft in 3D on a phone: the allowance moves with the choices, then the model follows them", async ({ page }) => {
  test.slow();
  await page.setViewportSize({ width: 390, height: 844 });
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/loft");
  await expect(page.locator("[data-lf-now]")).toContainText("within the 40 m³ permitted-development allowance for a terraced house");
  await expect(page.locator('[data-lf-set="loft"][data-v="hip"]')).toBeDisabled();
  await page.locator('[data-lf-set="house"][data-v="detached"]').click();
  await expect(page.locator("[data-lf-now]")).toContainText("over the 50 m³ allowance");
  await expect(page.locator("[data-lf-meter]")).toHaveAttribute("data-zone", "permission");
  await page.locator('[data-lf-set="loft"][data-v="hip"]').click();
  await expect(page.locator("[data-lf-width-row]")).toBeHidden();
  await expect(page.locator("[data-lf-now]")).toContainText("About 29 m³ added: within the 50 m³");
  await page.fill("[data-lf-before]", "25");
  await expect(page.locator("[data-lf-now]")).toContainText("over the 50 m³ allowance");
  await expect(page.locator("[data-lf-now]")).toContainText("That counts the 25 m³ already added.");
  await expect(page.locator(".bd-pg-src")).toContainText("checked 5 November 2026");
  await expect(page.locator(".bd-lf-rules .bd-pg-not")).toHaveText("A guide, not a decision. Check with your council or apply for a lawful development certificate.");
  await page.locator("[data-lf-try]").click();
  await expect(page.locator("[data-lf-canvas]")).toBeVisible({ timeout: 20000 });
  await page.locator('[data-lf-set="house"][data-v="semi"]').click();
  const m = await model(page, "[data-lf-canvas]");
  expect(m.house).toBe("semi");
  expect(m.loft).toEqual({ loft: "both", width: 4.5 });
  const send = await page.locator("[data-lf-send]").getAttribute("data-wa-text");
  expect(send).toContain("· A hip-to-gable and a rear dormer, the dormer 4.5 m wide");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  expect(errors).toEqual([]);
  await srv.close();
});

test("neighbours: the district and this week on the demo; a client's sheet, and a sheet with too much in it", async ({ page }) => {
  let srv = await start(demo);
  await page.goto(srv.base + "/neighbours-n5-rear");
  await expect(page.locator(".bd-nb-code")).toHaveText("N5");
  await expect(page.locator("[data-nb-week]")).toHaveText("Bricklayers are building the new walls at the back.");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  expect(await page.locator("a[href*='wa.me']").first().getAttribute("data-wa-text")).toContain("near your site in N5");
  await srv.close();
  srv = await start(client);
  const now = "2026-10-19 09:00"; // the suite's fixed clock is later that day
  let csv = `site,updated_at,this_week,noisy,deliveries\nse22-rear,${now},Groundworks at the back.,Monday,\n`;
  await page.route("https://docs.google.com/**", (r) => r.fulfill({ status: 200, contentType: "text/csv", body: csv }));
  await page.goto(srv.base + "/neighbours-se22-rear");
  await expect(page.locator("[data-nb-week]")).toHaveText("Groundworks at the back.");
  await expect(page.locator("[data-nb-del-row]")).toBeHidden();
  csv = csv.replace("Monday,", "Monday,,Mrs Smith at no. 12");
  await page.reload();
  await expect(page.locator("[data-nb-off]")).toContainText("isn't loading right now");
  await srv.close();
});

test("the survey checklist: one age at a time, sources linked, and asked about on WhatsApp", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/survey");
  await expect(page.locator('[data-sv-list="victorian"]')).toBeVisible();
  await expect(page.locator('[data-sv-list="modern"]')).toBeHidden();
  await page.locator('[data-sv-age="interwar"]').click();
  await expect(page.locator('[data-sv-list="interwar"] li b').first()).toHaveText("Lead water pipes");
  await expect(page.locator('[data-sv-list="interwar"] a[href^="https://www.dwi.gov.uk/"]')).toHaveCount(1);
  await expect(page.locator(".bd-sv-end .bd-pg-not")).toContainText("General guidance, not a survey.");
  /** @type {string[]} */ const opened = [];
  await page.exposeFunction("sfOpened", (u) => opened.push(u));
  await page.evaluate(() => { window.open = (u) => { /** @type {any} */ (window).sfOpened(String(u)); return null; }; });
  await page.fill('[data-sv-form] input[name="where"]', "n8");
  await page.click("[data-sv-form] button[type=submit]");
  await expect.poll(() => opened.length).toBe(1);
  expect(decodeURIComponent(opened[0])).toContain("· A 1920s or 1930s house\n· Postcode district: N8");
  await srv.close();
});
