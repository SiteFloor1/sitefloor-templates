// Detailing kit and the Mackerel look, as a client uses them: a short home page, the car in the bay lit up to its
// stage, packages by size and the builder's WhatsApp quote, the next start from the diary, care reminders into the
// calendar, the 3D car loading only on tap, a phone bar that never covers the page, and a client site whose sheets
// can't be read (no dates or stages shown, WhatsApp still works) with the inspection light on its own matched pair.
import { readFileSync } from "node:fs";
import { test, expect, site, start, watchErrors } from "./helpers.js";

const demo = site("demos/detailing");
const client = site("_fixtures/test-detailing-client");
const waText = async (loc) => new URL(await loc.getAttribute("href")).searchParams.get("text") ?? "";

test("the home page is short: the headlight, coating and film, your car, the other pages, and visit", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(srv.base + "/");
  const ids = await page.$$eval("main > section", (all) => all.map((x) => x.id || x.className));
  expect(ids).toEqual(["hero mk-hero", "coating", "your-car", "mk-more", "visit"]);
  const screens = await page.evaluate(() => document.documentElement.scrollHeight / innerHeight);
  expect(screens).toBeLessThan(7.5);
  await expect(page.locator(".mk-h1")).toHaveText("Seen under the light.");
  expect(errors).toEqual([]);
  await srv.close();
});

test("your car: the demo's example lights the rail up to its stage; an unknown code says so and lights nothing", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const sec = page.locator("#your-car");
  await expect(sec.locator('[data-st="protection"]')).toHaveClass(/is-now/);
  await expect(sec.locator('[data-st="protection"] [data-st-name]')).toHaveText("Film");
  await expect(sec.locator('[data-st="wash"]')).toHaveClass(/is-done/);
  await expect(sec.locator('[data-st="handover"]')).toHaveClass(/is-next/);
  await expect(sec.locator("[data-cp-note]")).toContainText("Bumper tomorrow");
  await expect(sec.locator("[data-cp-when]")).toContainText("Example for the demo");
  await expect(sec.locator("[data-cp-photo]")).toHaveAttribute("src", /in-the-bay\.webp$/);
  await sec.locator("[data-cp-code]").fill("abc-123");
  await sec.locator("button[type=submit]").click();
  await expect(sec.locator("[data-cp-note]")).toContainText("isn't on our list");
  await expect(sec.locator(".dt-st.is-now")).toHaveCount(0);
  await srv.close();
});

test("packages by size: the switch swaps every price, and the builder's message carries the choices", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/packages");
  const armour = page.locator(".dt-pk-i", { hasText: "Armour" }).locator("[data-size-price]");
  await expect(armour).toHaveText("£2,150");
  await page.locator("#packages .dt-size", { hasText: "SUV" }).first().click();
  await expect(armour).toHaveText("£2,790");
  const b = page.locator("#builder");
  await expect(b.locator('.dt-size:has(input[value="large"]) input')).toBeChecked();
  await b.locator(".dt-opt", { hasText: "Correct" }).click();
  await b.locator(".dt-opt", { hasText: "Headlight film" }).click();
  await b.locator(".dt-opt", { hasText: "Wheels off" }).click();
  await expect(b.locator("[data-bd-total]")).toHaveText("£1,500");
  await expect(b.locator("[data-bd-days]")).toHaveText("About 4 days with us.");
  await b.locator(".dt-size", { hasText: "Large SUV or van" }).click();
  await expect(b.locator("[data-bd-quote]")).toHaveText("Headlight film: we'll quote for your car.");
  expect(await waText(b.locator("[data-bd-go]"))).toContain("Website price: from £1,440 plus Headlight film (to quote)");
  await srv.close();
});

test("the next start comes from the diary, and asking for it names the package and the date", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/book");
  const row = page.locator('[data-av-for="correct"]');
  await expect(row.locator("[data-av-when]")).not.toHaveText("Ask for a date");
  const day = await row.locator("[data-av-when]").textContent();
  expect(day).toMatch(/^(Monday|Tuesday|Wednesday|Thursday|Friday) \d{1,2} (October|November)$/);
  expect(await waText(row.locator("[data-av-go]"))).toBe(`Hello Varnell, could you take my car for Correct from ${day}?`);
  await srv.close();
});

test("care reminders: the first wash goes into the calendar at 9am on its day", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/aftercare");
  await page.locator("[data-fw-date]").fill("2026-10-23");
  const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("[data-fw-form] button").click()]);
  const ics = readFileSync(await dl.path(), "utf8");
  expect(ics).toContain("DTSTART:20261030T090000Z"); // 30 October, after the clocks go back
  expect(ics).toContain("SUMMARY:First wash (Varnell)");
  await expect(page.locator("[data-fw-out]")).toContainText("4 reminders");
  await srv.close();
});

test("the 3D car loads only on tap: the Maybach SUV first, or the size picked, with its download size and credits", async ({ page }) => {
  const srv = await start(demo);
  const models = [];
  page.on("request", (r) => { if (r.url().endsWith(".glb")) models.push(r.url()); });
  await page.goto(srv.base + "/paint-correction");
  const sec = page.locator("#correction");
  await expect(sec.locator("[data-3d-go]")).toContainText(/\d\.\d MB/);
  await expect(sec.locator('[data-body-pick][value="suv"]')).toBeChecked();
  await sec.locator(".dt-bodies .dt-size", { hasText: "Saloon" }).click();
  await expect(sec.locator('[data-body-pick][value="saloon"]')).toBeChecked();
  await expect(sec.locator(".dt-3d-credit")).toContainText("CC BY 4.0");
  await expect(sec.locator(".dt-3d-tag")).toHaveText("Illustration");
  await page.waitForTimeout(500);
  expect(models).toEqual([]);
  if (await sec.locator("[data-3d-go]").isEnabled()) {
    await sec.locator("[data-3d-go]").click();
    await expect.poll(() => models.length).toBe(1);
    expect(models[0]).toMatch(/img\/cars\/car-saloon\.glb$/);
  } else {
    await expect(sec.locator("[data-3d-msg]")).toContainText("3D isn't available");
  }
  await srv.close();
});

test("the film builder: package and car set the price from the studio's sheet, and the choice goes on WhatsApp", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/paint-protection-film");
  const f = page.locator("#film");
  await expect(f.locator("[data-fp-total]")).toHaveText("£2,295");
  await expect(f.locator('[data-fp-for="whole"]')).toHaveText("£6,750");
  await f.locator(".dt-bodies .dt-size", { hasText: "Saloon" }).click();
  await f.locator(".dt-opt", { hasText: "Track pack" }).click();
  await expect(f.locator("[data-fp-total]")).toHaveText("£2,650");
  await expect(f.locator("[data-fp-days]")).toHaveText("About 3 days with us.");
  expect(await waText(f.locator("[data-fp-go]"))).toContain("Car: Saloon\nFilm: Track pack\nWebsite price: from £2,650, about 3 days");
  await srv.close();
});

test("is my car due: the studio's interval from the last visit, a 9am reminder and a WhatsApp to book", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/aftercare");
  const d = page.locator("#due");
  await d.locator(".dt-opt", { hasText: "Coating top-up" }).click();
  await d.locator("[data-dc-date]").fill("2026-01-10");
  await expect(d.locator("[data-dc-when]")).toHaveText(/^(Due in \d+ days?|Due today|Overdue by \d+ days?)$/);
  await expect(d.locator("[data-dc-on]")).toHaveText("Coating top-up: Sunday 10 January 2027.");
  expect(await waText(d.locator("[data-dc-go]"))).toContain("Coating top-up: last done 10/01/2026, due 10/01/2027.");
  const [dl] = await Promise.all([page.waitForEvent("download"), d.locator("[data-dc-cal]").click()]);
  expect(readFileSync(await dl.path(), "utf8")).toContain("DTSTART:20270110T090000Z");
  await srv.close();
});

test("collection: the district and day answer from the sheet, and only the district is sent", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/book");
  const c = page.locator("#collection");
  await c.locator("[data-cl-pc]").fill("kt13 8xx");
  await c.locator("[data-cl-day]").selectOption("thu");
  await c.locator("button[type=submit]").click();
  await expect(c.locator("[data-cl-out]")).toHaveText("Yes: we collect from KT13 on Thursdays. No charge.");
  const text = await waText(c.locator("[data-cl-go]"));
  expect(text).toContain("Postcode district: KT13\nDay: Thursday");
  expect(text).not.toContain("8XX");
  // Without JavaScript the form would submit to the page address, so the postcode field has no name to send.
  expect(await c.locator("[data-cl-pc]").getAttribute("name")).toBeNull();
  await c.locator("[data-cl-pc]").fill("GU21");
  await c.locator("[data-cl-day]").selectOption("mon");
  await c.locator("button[type=submit]").click();
  await expect(c.locator("[data-cl-out]")).toHaveText("Not on Mondays. We collect from GU21 on Thursday. £35 each way.");
  await srv.close();
});

test("the service pages, the monthly plan and the gallery by car type", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/wheels-and-calipers");
  await expect(page.locator("h1")).toHaveText("Wheels and calipers");
  await expect(page.locator(".dt-sv-dl div").first()).toHaveText(/Hatch\s*from £220/);
  for (const path of ["/interior", "/new-car-protection", "/selling-your-car"]) {
    await page.goto(srv.base + path);
    await expect(page.locator(".dt-sv-steps li").first()).toBeVisible();
  }
  await page.goto(srv.base + "/maintenance");
  const join = page.locator("[data-mt-join]");
  await expect(join).toHaveAttribute("href", /^https:\/\/buy\.stripe\.com\/test_/);
  await page.locator(".dt-mt-p", { hasText: "Each season" }).click();
  await expect(join).toBeHidden();
  await page.goto(srv.base + "/work");
  await expect(page.locator("h1")).toHaveText("Gallery");
  for (const chip of ["SUVs", "Sports cars", "Classics", "Interiors"]) await expect(page.getByRole("button", { name: chip })).toBeVisible();
  await srv.close();
});

test("your colour: the studio's paint chart under the 3D stage, labelled approximate, the choice shared", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/paint-protection-film");
  const p = page.locator("#film [data-paints]");
  await expect(p).toBeVisible();
  await expect(p).toContainText("Approximate on screen");
  await expect(p.locator(".dt-paint")).toHaveCount(8);
  await p.getByLabel("Pearl white, pearl").check();
  await expect(p.locator("[data-paints-name]")).toHaveText("Pearl white, pearl");
  await srv.close();
});

test("lease return: the source and its date, the studio's prices, \"Ask us\" when unpriced, sent on WhatsApp", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/lease-return");
  const l = page.locator("#lease");
  await expect(l.locator(".dt-ls-src")).toContainText("BVRLA Fair Wear & Tear Standard for Cars (updated December 2022)");
  await expect(l.locator(".dt-ls-src")).toContainText("checked 5 November 2026");
  await expect(l.locator('[data-ls-for="scratches"]')).toHaveText("from £95");
  await expect(l.locator('[data-ls-for="dents"]')).toHaveText("Ask us");
  await expect(l.locator('[data-ls-for="tyres"]')).toHaveText("Not ours to fix");
  for (const name of ["Scratches", "Alloy wheel scuffs", "Dents", "Tyres"]) await l.locator(".dt-ls-i", { hasText: name }).first().click();
  await expect(l.locator("[data-ls-total]")).toHaveText("£180");
  await expect(l.locator("[data-ls-say]")).toHaveText("We'll quote: Dents. Not ours to fix: Tyres.");
  const text = await waText(l.locator("[data-ls-go]"));
  expect(text).toContain("Scratches: from £95\nAlloy wheel scuffs: from £85\nPlease quote: Dents\nWebsite total: from £180");
  await srv.close();
});

test("on a phone the bar never covers the page", async ({ page }) => {
  const srv = await start(demo);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(srv.base + "/");
  const bar = await page.locator(".mk-bar").boundingBox();
  const pad = await page.evaluate(() => parseFloat(getComputedStyle(document.body).paddingBottom));
  expect(bar).not.toBeNull();
  expect(pad).toBeGreaterThanOrEqual(Math.floor(bar?.height ?? 0));
  // Scroll to the very end (instantly, again once lazy images have settled the height), then measure.
  const toEnd = () => page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await toEnd();
  await page.waitForLoadState("networkidle");
  await toEnd();
  await expect.poll(() => page.evaluate(() => Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight - 1)).toBe(true);
  const credit = await page.locator(".mk-foot-by").boundingBox();
  expect((credit?.y ?? 0) + (credit?.height ?? 0)).toBeLessThanOrEqual(bar?.y ?? 0);
  await srv.close();
});

test("a client whose sheets can't be read shows no dates and no stages, and WhatsApp still works", async ({ page }) => {
  const srv = await start(client);
  await page.route("https://docs.google.com/**", (r) => r.abort());
  await page.goto(srv.base + "/book");
  await expect(page.locator("[data-av-note]")).toContainText("Ask us for the next free date");
  await expect(page.locator('[data-av-for="correct"] [data-av-when]')).toHaveText("Ask for a date");
  expect(await page.locator('[data-av-for="correct"] [data-av-go]').getAttribute("href")).toMatch(/^https:\/\/wa\.me\/447911123459/);
  await page.goto(srv.base + "/book");
  await page.locator("[data-cl-pc]").fill("KT13");
  await page.locator("#collection button[type=submit]").click();
  await expect(page.locator("[data-cl-out]")).toHaveText("We can't check KT13 just now. Ask us and we'll tell you.");
  await page.goto(srv.base + "/paint-protection-film");
  await expect(page.locator("[data-fp-total]")).toHaveText("Ask us");
  await expect(page.locator("[data-fp-from]")).toBeHidden();
  await expect(page.locator("[data-paints]")).toBeHidden();
  await page.goto(srv.base + "/lease-return");
  await page.locator(".dt-ls-i:has([value=scratches])").click();
  await expect(page.locator('[data-ls-for="scratches"]')).toHaveText("Ask us");
  await expect(page.locator("[data-ls-say]")).toHaveText("We'll quote: Scratches.");
  await expect(page.locator("[data-ls-total]")).toHaveText("Ask us");
  await expect(page.locator("[data-ls-from]")).toBeHidden();
  await page.goto(srv.base + "/your-car#BAY-0001");
  await expect(page.locator("[data-cp-note]")).toContainText("can't show this right now");
  await expect(page.locator(".dt-st.is-now")).toHaveCount(0);
  await srv.close();
});

test("the inspection light: the client's own pair, moved by keys or drag, the after photo only inside the beam", async ({ page }) => {
  const srv = await start(client);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(srv.base + "/");
  const il = page.locator(".dt-il");
  await expect(il.locator(".dt-il-b")).toHaveAttribute("src", /panel-before\.webp$/);
  await expect(il.locator(".dt-il-a")).toHaveAttribute("src", /panel-after\.webp$/);
  const handle = il.locator("[data-il-handle]");
  await expect(handle).toHaveAttribute("aria-valuenow", "58");
  await handle.focus();
  await page.keyboard.press("End");
  await expect(handle).toHaveAttribute("aria-valuenow", "100");
  const box = await il.boundingBox();
  if (box) await page.mouse.click(box.x + box.width * 0.25, box.y + box.height / 2);
  await expect(handle).toHaveAttribute("aria-valuenow", "25");
  await srv.close();
});
