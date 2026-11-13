// Barber kit features, tested as a customer would use them.
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { test, expect, site, start, watchErrors, OPEN_TIME } from "./helpers.js";

const demo = site("demos/barber");
const client = site("_fixtures/test-barber-client");
const starter = site("_fixtures/test-barber-starter");
const SHEET = /docs\.google\.com\/spreadsheets/;
const MONDAY_OPEN = OPEN_TIME;

test.describe("build your cut (demo)", () => {
  let srv;
  test.beforeAll(async () => { srv = await start(demo); });
  test.afterAll(async () => { await srv.close(); });

  test("price, time and WhatsApp order follow the customer's choices", async ({ page }) => {
    const errors = watchErrors(page);
    await page.clock.setFixedTime(MONDAY_OPEN);
    await page.goto(srv.base + "/#cut");
    const form = page.locator("[data-cut-form]");
    // default: skin fade £22 and nothing extra ticked (no pre-ticked paid extras)
    await expect(page.locator("[data-cut-price]")).toHaveText("£22");
    await expect(page.locator('[data-cut-form] input[name="extras"]:checked')).toHaveCount(0);
    await form.getByLabel(/Hot towel shave/).check();
    await expect(page.locator("[data-cut-price]")).toHaveText("£40");
    await form.getByLabel("High", { exact: true }).check();
    const href = await page.locator("[data-cut-book]").getAttribute("href");
    const text = new URL(href).searchParams.get("text");
    expect(text).toContain("Skin fade (high fade)");
    expect(text).toContain("• Hot towel shave");
    expect(text).toContain("£40");
    await expect(page.locator("[data-cut-diagram] svg")).toHaveAttribute("aria-label", /Skin fade/);
    expect(errors).toEqual([]);
  });

  test("kids' cut hides and unticks beard extras; buzz cut disables length", async ({ page }) => {
    await page.goto(srv.base + "/#cut");
    const form = page.locator("[data-cut-form]");
    await form.getByLabel(/Beard shape-up/).check();
    await form.getByLabel(/Kids cut/).check();
    await expect(page.locator('[data-extra="beard"]')).toBeHidden();
    await expect(page.locator("[data-cut-price]")).toHaveText("£15");
    await form.getByLabel(/Buzz cut/).check();
    await expect(page.locator("#cut-length")).toBeDisabled();
    await expect(page.locator("[data-cut-fade]")).toBeHidden();
  });

  test("controls are reachable and usable with the keyboard", async ({ page }) => {
    await page.goto(srv.base + "/#cut");
    const first = page.locator('[data-cut-form] input[name="service"]').first();
    await first.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator('[data-cut-form] input[value="taper"]')).toBeChecked();
    await expect(page.locator("[data-cut-price]")).toHaveText("£20");
  });
});

test.describe("chair board", () => {
  test("demo shows moving simulated data", async ({ page }) => {
    const srv = await start(demo);
    await page.clock.setFixedTime(MONDAY_OPEN);
    await page.goto(srv.base + "/#chairs");
    await expect(page.locator("[data-board]")).toBeVisible();
    await expect(page.locator("[data-chair-time]").first()).toHaveText(/^(Now|\d\d:\d\d)$/);
    await srv.close();
  });

  test("client: fresh sheet data is shown", async ({ page }) => {
    const srv = await start(client);
    await page.clock.setFixedTime(MONDAY_OPEN);
    await page.route(SHEET, (r) => r.fulfill({ status: 200, contentType: "text/csv",
      body: "barber,status,free_at,updated_at\nSam,busy,11:05,2026-10-19T09:25:00Z\nLee,free,,2026-10-19T09:28:00Z\n" }));
    await page.goto(srv.base + "/#chairs");
    await expect(page.locator('[data-chair="Sam"] [data-chair-time]')).toHaveText("11:05");
    await expect(page.locator('[data-chair="Lee"] [data-chair-time]')).toHaveText("Now");
    await expect(page.locator('[data-chair="Sam"] [data-chair-updated]')).toHaveText("Updated 5 min ago");
    await expect(page.locator('[data-chair="Lee"] [data-chair-updated]')).toHaveText("Updated 2 min ago");
    await expect(page.locator("[data-board-fallback]")).toBeHidden();
    // build-your-cut uses the same data for its earliest slot
    await expect(page.locator("[data-cut-summary]")).toContainText("Lee is free now");
    await srv.close();
  });

  test("client on Booksy: booking buttons go to Booksy, WhatsApp stays for questions", async ({ page }) => {
    const srv = await start(client);
    await page.route(SHEET, (r) => r.abort("failed"));
    await page.goto(srv.base + "/#cut");
    await expect(page.locator("[data-cut-book]")).toHaveAttribute("href", client.booking.url);
    await expect(page.locator("[data-cut-book]")).toHaveText("Book on Booksy");
    await expect(page.locator(".cut-note")).toContainText("show this to your barber");
    await expect(page.locator(".hero").getByRole("link", { name: "Book on Booksy" })).toHaveAttribute("href", client.booking.url);
    await srv.close();
  });

  test("client: a busy-until time that passes while the page is open stops being offered", async ({ page }) => {
    const srv = await start(client);
    // Real timers under a controlled clock: load at 10:49:30, then let 35 seconds pass.
    await page.clock.install({ time: new Date("2026-10-19T09:49:30Z") });
    await page.route(SHEET, (r) => r.fulfill({ status: 200, contentType: "text/csv",
      body: "barber,status,free_at,updated_at\nLee,busy,10:50,2026-10-19T09:40:00Z\nSam,free,,2026-10-19T09:45:00Z\n" }));
    await page.goto(srv.base + "/#chairs");
    await expect(page.locator('[data-chair="Lee"] [data-chair-time]')).toHaveText("10:50");
    // The next 30-second tick re-renders without reloading the sheet (reloads happen every 60 s),
    // so only the page-side guard can stop 10:50 being offered at 10:50.
    await page.clock.runFor(35_000);
    await expect(page.locator('[data-chair="Lee"] [data-chair-status]')).toHaveText("No live update");
    await expect(page.locator('[data-chair="Lee"] [data-chair-time]')).toHaveText("Ask");
    await srv.close();
  });

  test("client: an old row stays old next to a fresh one, and past or UK-format times are handled", async ({ page }) => {
    const srv = await start(client);
    await page.clock.setFixedTime(MONDAY_OPEN); // 10:30 BST
    await page.route(SHEET, (r) => r.fulfill({ status: 200, contentType: "text/csv",
      body: "barber,status,free_at,updated_at\nSam,free,,19/10/2026 08:05:00\nLee,busy,10:50,19/10/2026 10:20:00\n" }));
    await page.goto(srv.base + "/#chairs");
    await expect(page.locator('[data-chair="Lee"] [data-chair-time]')).toHaveText("10:50");
    await expect(page.locator('[data-chair="Sam"] [data-chair-status]')).toHaveText("No live update");
    await expect(page.locator('[data-chair="Sam"] [data-chair-take]')).toHaveText("Message Sam");
    await expect(page.locator("[data-cut-summary]")).toContainText("earliest 10:50 with Lee");
    // ten minutes after Lee's time, with the same sheet, the page must stop offering it
    await page.clock.setFixedTime(new Date("2026-10-19T10:00:00Z"));
    await page.reload();
    await expect(page.locator("[data-board-fallback]")).toBeVisible();
    await srv.close();
  });

  for (const [name, handler] of [
    ["stale", (r) => r.fulfill({ status: 200, body: "barber,status,free_at,updated_at\nSam,busy,11:05,2026-10-19T07:00:00Z\n" })],
    ["malformed", (r) => r.fulfill({ status: 200, body: "<html>Sign in</html>" })],
    ["unreachable", (r) => r.abort("failed")],
    ["server error", (r) => r.fulfill({ status: 500, body: "" })],
  ]) {
    test(`client: ${name} sheet hides the board and shows the fallback`, async ({ page }) => {
      const srv = await start(client);
      await page.clock.setFixedTime(MONDAY_OPEN);
      await page.route(SHEET, handler);
      await page.goto(srv.base + "/#chairs");
      await expect(page.locator("[data-board-fallback]")).toBeVisible();
      await expect(page.locator("[data-board]")).toBeHidden();
      await expect(page.locator("[data-cut-summary]")).toContainText("we'll confirm the time");
      await srv.close();
    });
  }
});

test.describe("live opening hours", () => {
  test("open, closing time and today's row", async ({ page }) => {
    const srv = await start(client);
    await page.clock.setFixedTime(MONDAY_OPEN);
    await page.route(SHEET, (r) => r.abort("failed"));
    await page.goto(srv.base + "/");
    await expect(page.locator(".hero [data-status-text]")).toHaveText("Open now · closes 6pm");
    await expect(page.locator('tr[data-day="1"]')).toHaveClass(/today/);
    await srv.close();
  });

  test("closed on Sunday says when it opens next", async ({ page }) => {
    const srv = await start(client);
    await page.clock.setFixedTime(new Date("2026-10-25T12:00:00Z"));
    await page.route(SHEET, (r) => r.abort("failed"));
    await page.goto(srv.base + "/");
    await expect(page.locator(".hero [data-status-text]")).toHaveText("Closed · opens tomorrow at 9am");
    await expect(page.locator(".hero [data-live-status]")).toHaveClass(/is-closed/);
    await srv.close();
  });

  test("overnight hours: open after midnight on Sunday (Saturday 22:00–02:00)", async ({ page }) => {
    const srv = await start(starter);
    await page.clock.setFixedTime(new Date("2026-10-18T00:30:00Z")); // Sun 01:30 BST
    await page.goto(srv.base + "/");
    await expect(page.locator(".hero [data-status-text]")).toHaveText("Open now · closes 2am");
    await srv.close();
  });
});

test.describe("plans", () => {
  test("starter site only has the starter features and one page", async ({ page }) => {
    const srv = await start(starter);
    await page.goto(srv.base + "/");
    for (const id of ["chair-board", "build-your-cut", "gallery", "reviews", "page-links"]) {
      await expect(page.locator(`[data-feature="${id}"]`)).toHaveCount(0);
    }
    await expect(page.locator('[data-feature="price-list"]')).toHaveCount(1);
    expect((await page.goto(srv.base + "/team"))?.status()).toBe(404);
    await srv.close();
  });
});

test.describe("style guide", () => {
  test("face-shape tabs work with mouse and arrow keys", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/style-guide");
    await page.getByRole("tab", { name: "Round" }).click();
    await expect(page.locator("#panel-round")).toBeVisible();
    await expect(page.locator("#panel-oval")).toBeHidden();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Square" })).toBeFocused();
    await expect(page.locator("#panel-square")).toBeVisible();
    await expect(page.locator(".fcard svg")).toHaveCount(6);
    await srv.close();
  });
});

test.describe("gallery from Instagram (Behold)", () => {
  const FEED = /feeds\.behold\.so/;
  const PICS = /behold\.pictures/;
  const tags = (i) => (i % 3 === 0 ? ["kidscut"] : ["skinfade", "leeds"]);
  const feed = {
    username: "northgate.test",
    posts: Array.from({ length: 30 }, (_, i) => ({
      id: String(i + 1), mediaType: i === 4 ? "VIDEO" : "IMAGE", permalink: `https://www.instagram.com/p/TEST${i + 1}/`,
      timestamp: "2026-10-18T10:00:00+0000", prunedCaption: `Cut number ${i + 1}. Booked online.`, hashtags: tags(i),
      sizes: { medium: { mediaUrl: `https://behold.pictures/t/${i + 1}-m.webp`, width: 700, height: 875 },
        large: { mediaUrl: `https://cdn.behold.pictures/t/${i + 1}-l.webp`, width: 1000, height: 1250 } },
    })),
  };
  const photo = readFileSync(path.join(client.outDir, "img", readdirSync(path.join(client.outDir, "img")).find((f) => f.endsWith(".webp"))));
  const live = async (page) => {
    await page.route(SHEET, (r) => r.abort("failed"));
    await page.route(FEED, (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(feed) }));
    await page.route(PICS, (r) => r.fulfill({ status: 200, contentType: "image/webp", body: photo }));
  };

  test("work page: Show more works on its own (no endless loading)", async ({ page }) => {
    const srv = await start(client);
    await page.addInitScript(() => { delete window.IntersectionObserver; });
    await live(page);
    await page.goto(srv.base + "/work");
    const grid = page.locator(".sec-work .gal .tile");
    await expect(grid).toHaveCount(12);
    await page.getByRole("button", { name: "Show more" }).click();
    await expect(grid).toHaveCount(24);
    await expect(page.locator("[data-gallery-count]")).toHaveText("Showing 24 of 30");
    await page.getByRole("button", { name: "Show more" }).click();
    await expect(grid).toHaveCount(30);
    await expect(page.getByRole("button", { name: "Show more" })).toBeHidden();
    await expect(page.getByRole("link", { name: "See more on Instagram" })).toBeVisible();
    await srv.close();
  });

  test("home strip shows the newest posts and links to the work page", async ({ page }) => {
    const srv = await start(client);
    await live(page);
    await page.goto(srv.base + "/");
    const tiles = page.locator("#work .gal .tile");
    await expect(tiles).toHaveCount(6);
    await expect(tiles.first().locator("img")).toHaveAttribute("alt", "Cut number 1.");
    await expect(tiles.first().locator("a")).toHaveAttribute("href", "/work");
    await expect(page.locator("#work .gal-handle")).toHaveText("@northgate.test on Instagram");
    await srv.close();
  });

  test("work page: filters only for tags in use, endless loading, enlarged view", async ({ page }) => {
    const srv = await start(client);
    await live(page);
    await page.goto(srv.base + "/work");
    const grid = page.locator(".sec-work .gal .tile");
    await expect(grid).toHaveCount(12);
    await expect(page.locator("[data-gallery-count]")).toHaveText("Showing 12 of 30");
    await expect(page.getByRole("button", { name: "Beards" })).toBeHidden(); // no #beard posts
    // Endless loading: scrolling near the end loads the next batches by itself.
    await expect(async () => {
      await page.locator("[data-gallery-sentinel]").scrollIntoViewIfNeeded();
      await expect(grid).toHaveCount(30, { timeout: 500 });
    }).toPass();
    await expect(page.getByRole("button", { name: "Show more" })).toBeHidden();
    await expect(page.getByRole("link", { name: "See more on Instagram" })).toBeVisible();
    await page.getByRole("button", { name: "Kids" }).click();
    await expect(page.getByRole("button", { name: "Kids" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("[data-gallery-count]")).toHaveText("Showing 10 of 10");
    await grid.nth(1).getByRole("button").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("[data-lb-cap]")).toContainText("Cut number 4. Booked online.");
    await expect(dialog.getByRole("link", { name: "View on Instagram" })).toHaveAttribute("href", "https://www.instagram.com/p/TEST4/");
    await expect(dialog.getByRole("link", { name: "Book on Booksy" })).toHaveAttribute("href", client.booking.url);
    await page.keyboard.press("ArrowRight");
    await expect(dialog.locator("[data-lb-cap]")).toContainText("Cut number 7.");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await srv.close();
  });

  test("if Instagram can't be reached, the stored photos stay and nothing breaks", async ({ page }) => {
    const srv = await start(client);
    const errors = watchErrors(page);
    await page.route(SHEET, (r) => r.abort("failed"));
    await page.route(FEED, (r) => r.abort("failed"));
    await page.goto(srv.base + "/work");
    await expect(page.locator(".sec-work .gal .tile").first().locator("img")).toHaveAttribute("src", /^\/img\//);
    await expect(page.locator("[data-gallery-empty]")).toBeHidden();
    await page.waitForTimeout(300);
    expect(errors).toEqual([]);
    await srv.close();
  });
});

test.describe("pages built from customer questions (demo)", () => {
  let srv;
  test.beforeAll(async () => { srv = await start(demo); });
  test.afterAll(async () => { await srv.close(); });

  test("home answers the common questions, including who's best for each hair type", async ({ page }) => {
    await page.goto(srv.base + "/");
    const qs = page.locator("#questions details");
    await expect(qs).toHaveCount(6);
    await expect(qs.first().locator("summary")).toHaveText("Who's best for my hair type?");
    await expect(qs.first()).toContainText("Afro and textured hair: Kofi, Ash and Rio.");
    await page.locator("#questions summary", { hasText: "Do you cut Afro and textured hair?" }).click();
    await expect(page.locator("#questions details", { hasText: "Do you cut Afro" })).toHaveAttribute("open", "");
    await expect(page.locator("#questions").getByRole("link", { name: /Plan your visit/ })).toHaveAttribute("href", "/visit");
  });

  test("Plan your visit: arrival board with live parking, journeys with directions, leave-by, access, questions", async ({ page }) => {
    await page.goto(srv.base + "/visit"); // Monday 10:30
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Before you\s*come in\./);
    const board = page.getByLabel("Arrival board");
    await expect(board.locator(".pv-row").first()).toContainText("Open now · closes 7pm");
    await expect(board.locator('[data-parking="0"]')).toHaveText("Paid until 6pm · £2.40 an hour · 2 min walk");
    await expect(board.locator(".pv-row", { hasText: "Buses 1, 4 or 16" })).toContainText("2 min walk from the stop");
    // journeys: tabs work with the keyboard; directions open Google Maps in the right mode
    const walk = page.getByRole("tab", { name: "Walk" });
    await expect(walk).toHaveAttribute("aria-selected", "true");
    await walk.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Bus" })).toHaveAttribute("aria-selected", "true");
    const busPanel = page.getByRole("tabpanel");
    await expect(busPanel).toHaveCount(1);
    await expect(busPanel).toContainText("get off at Kirkgate Market");
    const dir = new URL(await busPanel.getByRole("link", { name: "Directions in Google Maps" }).getAttribute("href"));
    expect(dir.searchParams.get("travelmode")).toBe("transit");
    expect(dir.searchParams.get("destination")).toBe("14 Kirkgate, Leeds LS1 6BY");
    // leave-by helper
    await page.locator("#pv-appt").fill("15:00");
    await expect(page.locator("[data-pv-leave-list] li")).toHaveText([
      "Walk Leave Leeds station by 2:45pm", "Bus Get off at Kirkgate Market by 2:53pm", "Car Leave Leeds city centre by 2:47pm", "Bike Leave Leeds station by 2:51pm",
    ]);
    await expect(page.locator(".pv-access li.no")).toContainText("Accessible toilet");
    await expect(page.locator(".pv-topic h3")).toHaveText(["Hair and cuts", "Getting here", "Your visit", "Kids", "Paying"]);
  });

  test("parking status changes with the time of day", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-19T18:30:00Z")); // Monday 7:30pm
    await page.goto(srv.base + "/visit");
    await expect(page.locator('[data-parking-card="0"]')).toHaveText("Free now · charges from 8am tomorrow");
    await expect(page.locator('[data-parking-card="0"]')).toHaveClass(/is-free/);
    await page.clock.setFixedTime(new Date("2026-10-24T18:30:00Z")); // Saturday 7:30pm, free all Sunday
    await page.reload();
    await expect(page.locator('[data-parking-card="0"]')).toHaveText("Free now · charges from 8am Monday");
    await page.clock.setFixedTime(new Date("2026-12-25T11:00:00Z")); // Christmas Day: charged like a Sunday
    await page.reload();
    await expect(page.locator('[data-parking-card="0"]')).toHaveText("Free now (bank holiday) · charges from 8am tomorrow");
    await page.clock.setFixedTime(new Date("2026-10-19T22:00:00Z")); // Monday 11pm: the multi-storey has closed
    await page.reload();
    await expect(page.locator('[data-parking-card="1"]')).toHaveText("Closed now · opens 7am tomorrow");
    await expect(page.locator('[data-parking-card="1"]')).toHaveClass(/is-closed/);
  });

  test("Plan your visit without JavaScript: every journey, and each car park's charging times", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(srv.base + "/visit");
    await expect(page.locator("[data-pv-panel]")).toHaveCount(4);
    await expect(page.locator("[data-pv-panel]").first()).toBeVisible();
    await expect(page.locator('[role="tabpanel"]')).toHaveCount(0); // no tab roles without working tabs
    await expect(page.locator(".pv-charges").first()).toHaveText("Charges Mon–Sat 8am–6pm · free on Sundays and bank holidays");
    await expect(page.locator(".pv-charges").nth(1)).toHaveText("Open every day 7am–8pm · closed 25 Dec · Paid whenever it's open");
    await expect(page.locator(".pv-checked")).toHaveText("Example journeys and parking for a fictional shop.");
    await ctx.close();
  });

  test("Prices page shows every line with times; home shows a shorter list that links to it", async ({ page }) => {
    await page.goto(srv.base + "/prices");
    const skin = page.locator(".pp-table tr", { hasText: "Skin fade" });
    await expect(skin.locator(".pp-time")).toHaveText("40 min");
    await expect(skin.locator(".pp-price")).toHaveText("£22");
    await expect(page.locator(".pp-table tr", { hasText: "Senior (65+)" })).toBeVisible();
    await page.goto(srv.base + "/");
    await expect(page.locator("#prices .mi", { hasText: "Senior (65+)" })).toHaveCount(0);
    await expect(page.locator("#prices").getByRole("link", { name: /Every price/ })).toHaveAttribute("href", "/prices");
  });

  test("Barbers page filters by speciality, and each barber says what they're best for", async ({ page }) => {
    await page.goto(srv.base + "/team");
    await expect(page.locator("#danny .b-best")).toHaveText("Best for: Curly and wavy hair · Straight and fine hair");
    await page.getByRole("button", { name: "Afro and textured hair" }).click();
    await expect(page.locator("article.barber:visible")).toHaveCount(3);
    await expect(page.locator("#danny")).toBeHidden();
    await expect(page.locator("[data-team-count]")).toHaveText("3 of 4 people");
    await page.getByRole("button", { name: "Everyone" }).click();
    await expect(page.locator("article.barber:visible")).toHaveCount(4);
  });
});

test("a one-page site's Prices and Visit links fall back to the home page sections", async ({ page }) => {
  const s = site("_fixtures/test-barber-starter");
  const json = JSON.parse(readFileSync("tests/fixtures/sites/test-barber-starter/site.json", "utf8"));
  test.skip(!json.nav.some((n) => n.fallback), "fixture has no fallback nav items");
  const srv = await start(s);
  await page.goto(srv.base + "/");
  await expect(page.locator(".nav .links").getByRole("link", { name: "Prices" })).toHaveAttribute("href", "#prices");
  await srv.close();
});

test.describe("the client's own look (brand settings)", () => {
  test("client site uses its accent, headline type and logo", async ({ page }) => {
    const srv = await start(client);
    await page.goto(srv.base + "/");
    await expect(page.locator("html")).toHaveAttribute("data-type", "garamond");
    const accent = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--accent").trim());
    expect(accent.toLowerCase()).toBe("#8fbf9f");
    const font = await page.locator("h1").evaluate((el) => getComputedStyle(el).fontFamily);
    expect(font).toContain("Cormorant Garamond");
    await expect(page.locator("header .logo img")).toHaveAttribute("alt", client.name);
    await srv.close();
  });

  test("demo: Try your colours changes the accent and type live", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await page.getByRole("button", { name: "Try your colours" }).click();
    await page.getByRole("button", { name: "Sage" }).click();
    await page.getByRole("button", { name: "Modern sans" }).click();
    expect((await page.evaluate(() => document.documentElement.style.getPropertyValue("--accent"))).toLowerCase()).toBe("#8fbf9f");
    await expect(page.locator("html")).toHaveAttribute("data-type", "modern");
    await expect(page.getByRole("button", { name: "Sage" })).toHaveAttribute("aria-pressed", "true");
    await srv.close();
  });
});

test.describe("general pages", () => {
  test("demo About page: blocks render, nav links to it, Starter view shows it's a Plus page", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/about");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/About\s*the shop\./);
    await expect(page.getByRole("heading", { name: "How it started" })).toBeVisible();
    await expect(page.locator(".cpg-list li")).toHaveCount(4);
    await expect(page.locator(".cpg-photo img")).toHaveAttribute("alt", /barber chairs/);
    await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "About" })).toHaveAttribute("aria-current", "page");
    await page.getByRole("button", { name: "Starter" }).first().click();
    await expect(page.locator("[data-tier-gate]")).toBeVisible();
    await srv.close();
  });

  test("client general page books through the shop's own booking", async ({ page }) => {
    const srv = await start(client);
    await page.goto(srv.base + "/gift-vouchers");
    await expect(page.locator(".cpg-book .btn")).toHaveAttribute("href", client.booking.url);
    await srv.close();
  });
});
