// Florist kit and the Mantel look, as a customer uses them: this week's flowers first, the honest same-day line
// (counting down before the florist's own cut-off, naming the next day after it), the postcode check, the order
// message with the size, card and postcode, the week's colour framing the page, the florist's Sheet changing the
// week safely, the sympathy page, the bouquet builder, workshops, and the care card.
import { test, expect, site, start, watchErrors } from "./helpers.js";

const demo = site("demos/florist");
const client = site("_fixtures/test-florist-client");
const waText = async (loc) => new URL(await loc.getAttribute("href")).searchParams.get("text") ?? "";

test("the home page opens on the flowers, then this week's band; secondary sections live on their pages", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/");
  const first = await page.$eval("main > *", (el) => el.className);
  expect(first).toContain("mt-hero");
  const ids = await page.$$eval("main > section", (all) => all.map((x) => x.id));
  expect(ids).toEqual(["week", "pre-order", "two-ways", "wrap", "occasions", "season", "rooms", ""]);
  await expect(page.locator("main > section").last()).toHaveClass(/sec-more/); // the doors to the other pages
  await expect(page.locator("#week h1")).toHaveText("Coral rose, blush carnation and calla");
  // The selected size is outlined in the week's colour, not filled black.
  const chosen = page.locator(".fl-size:has(input:checked)");
  expect(await chosen.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe("rgb(28, 27, 25)");
  // The week's colour frames the page: the one button and the seal's ring.
  const deep = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--week-deep").trim());
  expect(await page.locator("[data-week-send]").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(await page.evaluate((c) => { const d = document.createElement("i"); d.style.color = c; document.body.append(d); const v = getComputedStyle(d).color; d.remove(); return v; }, deep));
  expect(errors).toEqual([]);
  await srv.close();
});

test.describe("same-day delivery, honestly", () => {
  test("before the cut-off it counts down to the florist's own time", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/"); // Monday 10:30
    await expect(page.locator("#week [data-sd-text]")).toHaveText("Order in the next 2 h 30 min for delivery today");
    await srv.close();
  });

  test("after the cut-off it never says today; on Saturday afternoon it names Monday", async ({ page }) => {
    const srv = await start(demo);
    await page.clock.setFixedTime(new Date("2026-10-19T12:05:00Z")); // Monday 13:05 BST
    await page.goto(srv.base + "/");
    await expect(page.locator("#week [data-sd-text]")).toHaveText("Today's deliveries have gone. Order now for tomorrow.");
    await page.clock.setFixedTime(new Date("2026-10-24T11:30:00Z")); // Saturday 12:30 BST
    await page.goto(srv.base + "/");
    await expect(page.locator("#week [data-sd-text]")).toHaveText("Today's deliveries have gone. Order now for Monday.");
    await srv.close();
  });

  test("the postcode check uses the florist's districts only", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await page.click("#week summary:has-text('Do you deliver')");
    await page.fill("#pc-week", "sw3 2aa");
    await page.click("#week .fl-pc button");
    await expect(page.locator("#week [data-sd-answer]")).toHaveText("Yes, SW3 today if you order by 1pm. Delivery £12.");
    await page.fill("#pc-week", "N1 9AA");
    await page.click("#week .fl-pc button");
    await expect(page.locator("#week [data-sd-answer]")).toContainText("We don't deliver by hand to N1");
    await srv.close();
  });

  test("on a phone the bar shows today's state and never covers the last of the page", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.clock.setFixedTime(new Date("2026-10-19T09:30:00Z"));
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await expect(page.locator("[data-sd-bar]")).toHaveText("Today by 1pm · 2 h 30 min left");
    // The site scrolls smoothly; jump straight to the end and wait until the page is really there.
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
    await page.waitForFunction(() => Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 1);
    const covered = await page.evaluate(() => document.querySelector(".mt-foot-by").getBoundingClientRect().bottom > document.querySelector(".mt-bar").getBoundingClientRect().top + 1);
    expect(covered).toBe(false);
    await srv.close();
    await ctx.close();
  });
});

test("the order carries the size, the card as written and the postcode", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await page.locator(".fl-size", { hasText: "Large" }).click();
  await page.click("#week summary:has-text('Add a card')");
  await page.fill("#card-text", "Happy birthday, Mum.\nLunch on Sunday?");
  await expect(page.locator("[data-card-preview]")).toHaveText("Happy birthday, Mum.\nLunch on Sunday?");
  await page.click("#week summary:has-text('Do you deliver')");
  await page.fill("#pc-week", "sw6 1aa");
  const text = await waText(page.locator("[data-week-send]"));
  expect(text).toContain("Coral rose, blush carnation and calla, Large (£95)");
  expect(text).toContain("To: SW6 1AA");
  expect(text).toContain("Card:\nHappy birthday, Mum.\nLunch on Sunday?");
  await srv.close();
});

test("the florist's Sheet changes the week field by field; a bad price keeps the last good one", async ({ page }) => {
  const srv = await start(client);
  await page.route("https://docs.google.com/**", (r) => r.fulfill({ status: 200, contentType: "text/csv", body: "kind,key,value\nweek,name,Peony and stock\nweek,colour,#7B5EA7\nweek,colour_name,lilac\nweek,price_medium,£70\nweek,price_large,ninety\nseason,dahlias,plenty\n" }));
  await page.goto(srv.base + "/");
  await expect(page.locator("#week h1")).toHaveText("Peony and stock");
  await expect(page.locator('[data-size-price="medium"]')).toHaveText("£70");
  await expect(page.locator('[data-size-price="large"]')).toHaveText("£95");
  await expect(page.locator("[data-week-colour-name]")).toHaveText("lilac");
  expect(await page.evaluate(() => document.documentElement.style.getPropertyValue("--week"))).toBe("#7B5EA7");
  await expect(page.locator('[data-stem="dahlias"] [data-status]')).toHaveText("Plenty");
  await srv.close();
});

test("a broken Sheet changes nothing", async ({ page }) => {
  const srv = await start(client);
  await page.route("https://docs.google.com/**", (r) => r.fulfill({ status: 500, body: "" }));
  await page.goto(srv.base + "/");
  await expect(page.locator("#week h1")).toHaveText("Coral rose, blush carnation and calla");
  await expect(page.locator('[data-size-price="medium"]')).toHaveText("£65");
  await srv.close();
});

test("sympathy: the message names where they go and the words for the card; no countdown on the page", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/sympathy");
  await page.locator(".fl-sym-p", { hasText: "An arrangement" }).click();
  await page.fill("#sym-for", "Margaret");
  await page.locator(".fl-sym-where .fl-chip", { hasText: "The service" }).click();
  await page.locator("[data-sym-line]", { hasText: "Thinking of you all." }).click();
  const text = await waText(page.locator("[data-sym-send]"));
  expect(text).toContain("An arrangement");
  expect(text).toContain("In memory of Margaret");
  expect(text).toContain("To: The service");
  expect(text).toContain("Card:\nThinking of you all.");
  await expect(page.locator("[data-sd-text]")).toHaveCount(0);
  await srv.close();
});

test("the bouquet builder shows the florist's own photograph, and says plainly when the size shown differs", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/build");
  await page.locator(".fl-swatch-pick", { hasText: "White and green" }).click();
  await page.locator(".fl-bb-f .fl-size", { hasText: "Medium" }).click();
  await expect(page.locator("[data-bb-img]")).toHaveAttribute("src", /b-white\.webp$/);
  await expect(page.locator("[data-bb-note]")).toHaveText("Shown in large; yours will be medium, in the same flowers.");
  expect(await waText(page.locator("[data-bb-send]"))).toContain("White and green bouquet, Medium (£65)");
  await srv.close();
});

test("workshops: a full date shows Full with no button; a date that has passed drops off", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/workshops");
  const full = page.locator('[data-ws="wreath-dec"]');
  await expect(full.locator("[data-ws-left]")).toHaveText("Full");
  await expect(full.locator("[data-ws-pay]")).toHaveCount(0);
  await page.clock.setFixedTime(new Date("2026-11-30T10:00:00Z"));
  await page.reload();
  await expect(page.locator('[data-ws="wreath-nov"]')).toBeHidden();
  await srv.close();
});

test("the care card is kept out of search, has its QR code, and isn't in the sitemap", async ({ page }) => {
  const srv = await start(client);
  await page.goto(srv.base + "/flower-care");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator("svg.fl-qr")).toHaveCount(1);
  const map = await (await page.request.get(srv.base + "/sitemap.xml")).text();
  expect(map).not.toContain("flower-care");
  expect(map).toContain("every-week");
  await srv.close();
});

test.describe("added after the first review", () => {
  test("pre-order windows show only while open, by the shop's clock", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/"); // 19 October: Christmas opens on 1 November
    await expect(page.locator("#pre-order")).toBeHidden();
    await page.clock.setFixedTime(new Date("2026-11-10T10:00:00Z"));
    await page.goto(srv.base + "/");
    await expect(page.locator("#pre-christmas")).toBeVisible();
    await expect(page.locator("#pre-christmas .fl-pre-by")).toHaveText("Order by Saturday 19 December for Wednesday 23 December.");
    await expect(page.locator("#pre-valentines")).toBeHidden();
    await srv.close();
  });

  test("choose the day and add a gift: only days the florist delivers go on the order", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await page.fill("#week-when", "2026-10-25");
    await expect(page.locator("[data-when-say]")).toHaveText("We don't deliver on Sun 25 Oct. Choose another day.");
    expect(await waText(page.locator("[data-week-send]"))).not.toContain("For:");
    await page.fill("#week-when", "2026-10-23");
    await page.click(".fl-adds summary");
    await page.check("input[name='week-gift'][value='candle']", { force: true });
    await page.locator("[data-week-send]").focus();
    const text = await waText(page.locator("[data-week-send]"));
    expect(text).toContain("Add: Fig and cedar candle (£34)");
    expect(text).toContain("For: Fri 23 Oct");
    await expect(page.locator(".fl-note")).toContainText("Nell, at the bench");
    // Today, to W8 at 12:30 on a Monday: W8's own cut-off is noon, so "today" never goes on the order.
    await page.clock.setFixedTime(new Date("2026-10-19T11:30:00Z"));
    await page.goto(srv.base + "/");
    await page.fill("#week-when", "2026-10-19");
    await expect(page.locator("[data-when-say]")).toHaveText("Today, if you order by 1pm.");
    await page.click("#week summary:has-text('Do you deliver')");
    await page.fill("#pc-week", "W8 6AA");
    await expect(page.locator("[data-when-say]")).toContainText("Today's deliveries have gone");
    await page.locator("[data-week-send]").focus();
    expect(await waText(page.locator("[data-week-send]"))).not.toContain("For:");
    await srv.close();
  });

  test("name the stems: tap a ring for its name, or name them all", async ({ page }) => {
    const srv = await start(demo);
    const errors = watchErrors(page);
    await page.goto(srv.base + "/");
    const rings = page.locator(".fl-nts-b");
    await expect(rings.first()).toBeVisible();
    await rings.first().click();
    await expect(page.locator(".fl-nts-t").first()).toHaveText("Coral garden rose · English-grown");
    await expect(page.locator(".fl-nts-t").nth(1)).toBeHidden();
    await page.click(".fl-nts-all");
    await expect(page.locator(".fl-nts-t").nth(1)).toBeVisible();
    expect(errors).toEqual([]);
    await srv.close();
  });

  test("follow your order and your flowers this week: private pages by reference", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/your-order#AMB4K7");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator("[data-track-step][aria-current='step'] b")).toHaveText("Being made");
    await page.fill("#track-ref", "ZZZZ9");
    await page.click("[data-track-form] button");
    await expect(page.locator("[data-track-why]")).toContainText("We can't find that reference");
    await page.goto(srv.base + "/your-flowers#GLB2Q8");
    await expect(page.locator("[data-acc-name]")).toHaveText("The Gilbert, Pimlico");
    await expect(page.locator("[data-acc-list] li")).toHaveCount(3);
    await srv.close();
  });

  test("Christmas Eve uses the florist's one-off cut-off, the same as the banner says", async ({ page }) => {
    const srv = await start(demo);
    await page.clock.setFixedTime(new Date("2026-12-24T11:30:00Z")); // Thursday 11:30; that day's cut-off is 11am
    await page.goto(srv.base + "/");
    await expect(page.locator("#week [data-sd-text]")).toContainText("Today's deliveries have gone.");
    await expect(page.locator(".season:not([hidden])")).toContainText("by 11am");
    await srv.close();
  });

  test("an area's page counts down to that area's own cut-off", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/delivery-w8"); // Monday 10:30; W8's weekday cut-off is noon
    await expect(page.locator("[data-sd-text]")).toHaveText("Order in the next 1 h 30 min for delivery today");
    await page.goto(srv.base + "/delivery");
    await expect(page.locator(".fl-area-a")).toHaveCount(8);
    await srv.close();
  });

  test("the calendar marks this month and carries a month to the wedding enquiry", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/calendar");
    await expect(page.locator("#m10 [data-cal-now]")).toBeVisible();
    await expect(page.locator("#m5 [data-cal-now]")).toBeHidden();
    await page.click("#m5 .fl-cal-go a");
    await expect(page).toHaveURL(/weddings(\.html)?\?month=5/);
    expect(await waText(page.locator("[data-wd-send]"))).toContain("Month: May");
    await srv.close();
  });

  test("occasion pages, stories and the business page link up", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await page.click("#occasions a:has-text('A birthday')");
    await expect(page.locator("h1")).toHaveText("Birthday");
    await page.goto(srv.base + "/for-valentines"); // 19 October: the Valentine's window isn't open
    await expect(page.locator(".fl-op-pre")).toBeHidden();
    await page.clock.setFixedTime(new Date("2027-01-20T10:00:00Z"));
    await page.goto(srv.base + "/for-valentines");
    await expect(page.locator(".fl-op-pre")).toContainText("order by Friday 12 February");
    await page.clock.setFixedTime(new Date("2027-02-13T10:00:00Z")); // after its order-by date
    await page.goto(srv.base + "/for-valentines");
    await expect(page.locator(".fl-op-pre")).toBeHidden();
    await page.clock.setFixedTime(new Date("2026-10-19T09:30:00Z"));
    await page.goto(srv.base + "/stories");
    await page.click(".fl-sts-a >> nth=0");
    await expect(page.locator(".fl-st-pal li")).toHaveCount(3);
    await page.goto(srv.base + "/for-business");
    await expect(page.locator(".fl-plan")).toHaveCount(4);
    await srv.close();
  });
});
