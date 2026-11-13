// Electrician kit and the Blue hour look, as a homeowner uses them: a short home page; the keypad changing the house's
// light; why each light is there; the house in 3D's panel pricing the lit rooms from the client's figures; the fault
// guide (never a repair instruction); the EV check, the room designer and the estimate at the client's prices; the
// dimmer; certificates by code with the reminder; and the pages without JavaScript.
import { test, expect, site, start, watchErrors } from "./helpers.js";

const demo = site("demos/electrician");
const client = site("_fixtures/test-electrician-client");
const waText = async (loc) => new URL(await loc.getAttribute("href")).searchParams.get("text") ?? "";

test("the home page is a few sections, led by the house; the rest live on their pages", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const ids = await page.$$eval("main > section", (all) => all.map((x) => x.id || x.className));
  expect(ids).toEqual(["hero bh-hero", "lights", "house", "rooms", "shot bh-band", "services", "fault"]);
  await expect(page.locator(".el-call a[href^='tel:']")).toHaveText("+44 7700 900137");
  await page.goto(srv.base + "/your-project");
  await expect(page.locator("#steps, #before-you-call, #estimate")).toHaveCount(3);
  await srv.close();
});

test("the keypad changes the house's photograph and the line, fetching the other scenes only after the page has loaded", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  const early = [];
  page.on("request", (r) => { if (/(cinema|away)-(wide|tall)\.webp/.test(r.url())) early.push(r.url()); });
  await page.goto(srv.base + "/", { waitUntil: "domcontentloaded" });
  expect(early, "only the first scene loads with the page").toEqual([]);
  await page.click("[data-key='cinema']");
  await expect(page.locator("[data-scene-pic='cinema']")).toHaveClass(/on/);
  await expect(page.locator("[data-scene-pic='evening']")).not.toHaveClass(/on/);
  await expect(page.locator("[data-scene-line]")).toContainText("Cinema.");
  await expect(page.locator("[data-key='cinema']")).toHaveAttribute("aria-pressed", "true");
  expect(errors).toEqual([]);
  await srv.close();
});

test("every light has a reason: a number on the photograph shows that light", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await page.click(".el-pin[data-light='1']");
  await expect(page.locator("[data-fit-name]")).toHaveText("Light washing the vaulted ceiling");
  await expect(page.locator("[data-fit-control]")).toHaveText("Its own circuit, so it can fade alone");
  await srv.close();
});

test("the house in 3D: nothing loads before the tap; then the keypad and the rooms price only the lit fittings", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  const early = [];
  page.on("request", (r) => { if (/villa-scene/.test(r.url())) early.push(r.url()); });
  // the software renderer in CI draws slowly; with reduced motion the model only draws when something changes
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(srv.base + "/");
  await expect(page.locator("#house .el-villa-poster img")).toHaveAttribute("src", /villa-wide\.webp/);
  expect(early, "no 3D code before the tap").toEqual([]);
  await page.click("[data-h3-open]");
  await expect(page.locator("[data-h3-bar]")).toBeVisible({ timeout: 30000 });
  await page.click("[data-h3-scene='off']");
  if (await page.locator("[data-h3-panel]").isHidden()) await page.click("[data-h3-quote]");
  await expect(page.locator("[data-h3-total]")).toHaveText("£0");
  await page.click("[data-h3-room='kitchen']");
  await expect(page.locator("[data-h3-total]")).toHaveText("£2,190"); // 6 × £145 + 2 × £340 + £220 + £420
  await expect(page.locator("[data-h3-mini]")).toHaveText("£2,190");
  const text = await waText(page.locator("[data-h3-send]"));
  expect(text).toContain("Rooms: Kitchen");
  expect(text).toContain("£2,190");
  await page.locator("[data-h3-warm]").fill("3000");
  await expect(page.locator("[data-h3-warm-out]")).toHaveText("3000 K");
  expect(errors).toEqual([]);
  await srv.close();
});

test("the fault guide says what to tell the electrician and never how to fix it", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await page.click("[data-case='smell']");
  await expect(page.locator("[data-tell='smell']")).toBeVisible();
  await expect(page.locator("[data-tell='trip']")).toBeHidden();
  await expect(page.locator(".el-safe")).toContainText("Please don't open or repair anything yourself");
  expect(await waText(page.locator("[data-fault-send]"))).toContain("Burning smell or buzzing");
  await srv.close();
});

test("the EV check: a standard install at the client's price; a street space is never a yes; the 3D slider moves the answer", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/ev-charging");
  await expect(page.locator("[data-ev-verdict]")).toHaveText("A standard install: £1,195.");
  await page.check("input[name=ev-park][value=street]");
  await expect(page.locator("[data-ev-verdict]")).toHaveText("Not as a standard home install.");
  await page.check("input[name=ev-park][value=drive]");
  await page.locator("[data-ev3-x]").fill("5");
  await expect(page.locator("[data-ev3-run]")).toHaveText("about 8.2 m");
  await page.locator("[data-ev3-x]").fill("-6.2");
  await expect(page.locator("[data-ev-m]")).toHaveText("5 m");
  await expect(page.locator(".el-ev3-credit")).toContainText("CC BY 4.0");
  await srv.close();
});

test("the room designer and the estimate use the client's own figures", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/lighting");
  await expect(page.locator("[data-design-total]")).toHaveText("£2,620"); // 8 downlights, 4 wall lights, a keypad
  await page.click(".el-layer:has(input[value=wall])");
  await expect(page.locator("[data-design-total]")).toHaveText("£1,160");
  await page.goto(srv.base + "/your-project");
  await expect(page.locator("[data-est-range]")).toHaveText("£6,500 – £8,700"); // a terrace, 3 bedrooms, a rewire
  await srv.close();
});

test("the dimmer moves between the client's photographs", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/lighting");
  await page.locator("[data-dim-fader]").fill("0");
  await expect(page.locator("[data-dim-now]")).toHaveText("Low");
  expect(await page.locator("[data-dim-frame='1']").evaluate((el) => getComputedStyle(el).opacity)).toBe("0");
  await srv.close();
});

test("certificates by code: the demo code shows the report and the next inspection, with a calendar reminder", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/your-home");
  await expect(page.locator("[data-certs-items] li")).toHaveCount(4);
  await expect(page.locator("[data-certs-due]")).not.toBeEmpty();
  const download = page.waitForEvent("download");
  await page.click("[data-certs-ics]");
  expect((await download).suggestedFilename()).toBe("electrical-inspection.ics");
  await page.fill("#certs-code", "NOPE99");
  await page.click("[data-certs-form] button");
  await expect(page.locator("[data-certs-why]")).toContainText("can't find that code");
  await srv.close();
});

test("without JavaScript every light's reason, every fault case and the services still read", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  const srv = await start(client);
  await page.goto(srv.base + "/");
  await expect(page.locator(".el-fit-nojs").first()).toBeVisible();
  await expect(page.locator("[data-tell]")).toHaveCount(4);
  await expect(page.locator("[data-tell='off']")).toBeVisible();
  await expect(page.locator(".el-cct[open]")).toHaveCount(1);
  await srv.close();
  await ctx.close();
});
