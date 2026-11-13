// Wear kit (clothing brands with a showroom or pop-ups) and the Basalt look, as a customer uses them: the drop line,
// the pieces and their stock from the brand's sheet, the size run, fit and the size finder, the lookbook, what to wear
// today from Open-Meteo, the run club's calendar file and the drop-day line. Times are UK.
import { test, expect, site, start, watchErrors } from "./helpers.js";

const demo = site("demos/menswear");
const client = site("_fixtures/test-wear-client");
const SHEET = /docs\.google\.com\/spreadsheets\/d\/e\/2PACX-drift\//;
const LINE = /docs\.google\.com\/spreadsheets\/d\/e\/2PACX-driftline\//;
const METEO = /api\.open-meteo\.com/;
const stockCsv = (at, rows) => ["piece,size,left,updated_at", ...rows.map((r) => `${r},${at}`)].join("\n");
const forecast = (o) => ({
  current: { time: "2026-10-19T10:30", temperature_2m: o.t, apparent_temperature: o.t - 2, wind_speed_10m: o.wind, precipitation: o.rain ?? 0 },
  hourly: { time: Array.from({ length: 12 }, (_, i) => `2026-10-19T${String(11 + i).padStart(2, "0")}:00`), precipitation_probability: o.pp ?? Array(12).fill(5) },
});

test("demo home: the drop in one line, the pieces with their stock, a demo shop that says so", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.route(METEO, (r) => r.abort());
  await page.goto(srv.base + "/");
  // Monday 19 Oct, 10:30: the demo's drop is the next Saturday at 10:00.
  await expect(page.locator("[data-feature='drop-line']")).toContainText("Drop 04 · Saturday 10:00 · 5 days");
  const shell03 = page.locator("#piece-shell-03");
  await expect(shell03).toHaveAttribute("data-state", "out");
  await expect(shell03.locator(".wr-stock")).toHaveText("Sold out");
  await expect(page.locator("#piece-shell-02 .wr-stock")).toHaveText("12 left M and L only");
  await expect(page.locator("#piece-shell-04 .wr-stock")).toHaveText("Saturday 10:00 S to XL");
  // A demo's Google Forms are fictional: the link opens a note instead.
  await shell03.locator(".wr-restock summary").click();
  await expect(shell03.locator(".wr-restock p")).toContainText("On this demo the form is fictional.");
  expect(errors).toEqual([]);
  await srv.close();
});

test("client stock comes from the sheet; an old sheet goes quiet instead of showing stale numbers", async ({ page }) => {
  const srv = await start(client);
  await page.route(METEO, (r) => r.abort());
  await page.route(LINE, (r) => r.abort());
  let at = "2026-10-19 10:00";
  await page.route(SHEET, (r) => r.fulfill({ contentType: "text/csv", body: stockCsv(at, ["shell-02,S,0", "shell-02,M,3", "shell-02,L,2", "shell-02,XL,0", "shell-01,S,20", "shell-01,M,20", "shell-01,L,20", "shell-01,XL,20"]) }));
  await page.goto(srv.base + "/");
  await expect(page.locator("#piece-shell-02 .wr-stock")).toHaveText("5 left M and L only");
  await expect(page.locator("#piece-shell-01 .wr-stock")).toHaveText("In stock · S to XL");
  await expect(page.locator("#size-run")).toBeVisible();
  // The same sheet, last touched yesterday morning: no stock words, no size run.
  at = "2026-10-18 08:00";
  await page.reload();
  await expect(page.locator("#piece-shell-02")).toHaveAttribute("data-state", "unknown");
  await expect(page.locator("#piece-shell-02 .wr-stock")).toHaveText("");
  await expect(page.locator("#size-run")).toBeHidden();
  // A real shop link on a client: the piece's own page on the brand's shop.
  await page.goto(srv.base + "/shells");
  await expect(page.locator("#shell-04 a.wr-buy")).toHaveAttribute("href", "https://shop.drift-test.co.uk/products/shell-04");
  await srv.close();
});

test("the drop line counts down on the brand's clock: tomorrow, then minutes, then open", async ({ page }) => {
  const srv = await start(client);
  await page.route(/./, (r) => (r.request().url().startsWith(srv.base) ? r.continue() : r.abort()));
  await page.clock.setFixedTime(new Date("2026-10-23T22:30:00Z")); // Friday 23:30 BST
  await page.goto(srv.base + "/");
  await expect(page.locator("[data-drop-left]")).toHaveText(" · tomorrow");
  await page.clock.setFixedTime(new Date("2026-10-24T08:35:00Z")); // Saturday 09:35 BST
  await page.reload();
  await expect(page.locator("[data-drop-left]")).toHaveText(" · in 25 min");
  await page.clock.setFixedTime(new Date("2026-10-24T09:01:00Z"));
  await page.reload();
  await expect(page.locator("[data-drop-when]")).toHaveText("open now");
  await expect(page.locator("[data-drop-clock]")).toBeHidden();
  await srv.close();
});

test("a quiet clock ticks down to the drop, hidden from screen readers, and stops at the drop", async ({ page }) => {
  const srv = await start(client);
  await page.route(/./, (r) => (r.request().url().startsWith(srv.base) ? r.continue() : r.abort()));
  await page.clock.install({ time: new Date("2026-10-22T07:53:50Z") });
  await page.goto(srv.base + "/");
  await page.clock.pauseAt(new Date("2026-10-22T07:53:51Z")); // Thursday 08:53:51 BST
  const clock = page.locator("[data-drop-clock]");
  await expect(clock).toHaveText("2d 01h 06m 09s");
  await expect(clock).toHaveAttribute("aria-hidden", "true");
  await page.clock.runFor(5000);
  await expect(clock).toHaveText("2d 01h 06m 04s");
  await page.clock.pauseAt(new Date("2026-10-24T08:59:58Z")); // Saturday 09:59:58 BST
  await page.clock.runFor(3000);
  await expect(clock).toBeHidden();
  await srv.close();
});

test("fit: a size shows its measurements; the finder uses only the brand's table", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/fit");
  const fit = page.locator("#fit-shell-04");
  await expect(fit.locator("td[data-size='M']").first()).toHaveText("58");
  await fit.getByRole("button", { name: "L", exact: true }).click();
  await expect(fit.locator("td[data-size='L']").first()).toBeVisible();
  await expect(fit.locator("td[data-size='M']").first()).toBeHidden();
  await expect(fit.locator(".wr-fit-note:visible")).toHaveText("Loose over a midlayer. The cuffs sit past the wrist.");
  await fit.getByLabel("Your chest, round").fill("100");
  await expect(fit.locator("[data-chest-out]")).toHaveText("Try M");
  await expect(fit.getByRole("button", { name: "M", exact: true })).toHaveAttribute("aria-pressed", "true");
  await fit.getByLabel("Your chest, round").fill("130");
  await expect(fit.locator("[data-chest-out]")).toHaveText("Larger than XL: ask us");
  await fit.getByLabel("Your chest, round").fill("20");
  await expect(fit.locator("[data-chest-out]")).toHaveText("Check that measurement");
  expect(errors).toEqual([]);
  await srv.close();
});

test("the size finder: height, weight, a kind of brand and fit, read against the brand's chart", async ({ page }) => {
  test.slow(); // two pages and a dozen inputs: on a loaded CI runner it can pass 30 s
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/fit");
  const sf = page.locator("#size-finder");
  await sf.getByLabel("Height in cm").fill("177");
  await sf.getByLabel("Weight in kg").fill("72");
  await expect(sf.locator("[data-sf-size]")).toHaveText("Try M");
  await expect(sf.locator("[data-sf-why]")).toContainText("Height 177 cm: M on our chart");
  // Feet and stone work too: 6 ft 1, 13 st 3 is L.
  await sf.getByRole("button", { name: "ft and in" }).click();
  await sf.getByLabel("Height, feet").fill("6");
  await sf.getByLabel("Height, inches").fill("1");
  await sf.getByRole("button", { name: "stone and lb" }).click();
  await sf.getByLabel("Weight, stone").fill("13");
  await sf.getByLabel("Weight, pounds").fill("3");
  await expect(sf.locator("[data-sf-size]")).toHaveText("Try L");
  // The answer turns each piece below to that size.
  await expect(page.locator("#fit-shell-04").getByRole("button", { name: "L", exact: true })).toHaveAttribute("aria-pressed", "true");
  // The size they wear in brands that run small moves it down one.
  await sf.getByLabel("Kind of brand").selectOption({ label: "Brands that run small (slim running cuts)" });
  await sf.getByLabel("Your size there").selectOption("L");
  await expect(sf.locator("[data-sf-why]")).toContainText("You wear L there, which is M here");
  await expect(sf.locator("summary")).toHaveText("The chart it reads from");
  // Shell pages point here when there's no tape to hand.
  await page.goto(srv.base + "/shell-04");
  await expect(page.getByRole("link", { name: /Find your size from height and weight/ })).toHaveAttribute("href", /fit(\.html)?#size-finder/);
  expect(errors).toEqual([]);
  await srv.close();
});

test("the lookbook turns spread by spread; a mark shows the piece worn, its price and what's left", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/lookbook");
  const rail = page.locator("[data-spreads]");
  await expect(rail.locator(".wr-spread").first()).toContainText("In weather");
  await page.getByRole("button", { name: "Next spread" }).click();
  await expect.poll(() => rail.evaluate((el) => el.scrollLeft)).toBeGreaterThan(200);
  const mark = page.locator("#look-2 [data-mark]");
  await mark.click();
  const slip = page.locator("#look-2 .wr-slip");
  await expect(slip).toBeVisible();
  await expect(slip).toContainText("Shell 04");
  await expect(slip).toContainText("£180");
  await expect(slip.locator(".wr-stock")).toContainText("Saturday 10:00");
  await page.keyboard.press("Escape");
  await expect(slip).toBeHidden();
  // The contact sheet jumps into the book.
  await page.locator("[data-jump='9']").click();
  await expect.poll(() => page.locator("#look-9").evaluate((el) => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 1; })).toBe(true);
  expect(errors).toEqual([]);
  await srv.close();
});

test("what to wear today: the live forecast picks the brand's answer; no forecast, no section on a client", async ({ page }) => {
  const srv = await start(client);
  await page.route(SHEET, (r) => r.abort());
  await page.route(LINE, (r) => r.abort());
  await page.route(METEO, (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify(forecast({ t: 14, wind: 31 })) }));
  await page.goto(srv.base + "/");
  const today = page.locator("#today");
  await expect(today).toBeVisible();
  await expect(today.locator("[data-today-weather]")).toHaveText("London is 14° and windy, 31 km/h.");
  await expect(today.locator("[data-today-wear]")).toHaveText("Wear the windbreaker, zipped.");
  await expect(today.locator("[data-kit-piece='wind-01']")).toBeVisible();
  await expect(today.locator("[data-kit-piece='shell-04']")).toBeHidden();
  // The brand's paid plan, and the credit the data licence asks for.
  await expect(today.getByRole("link", { name: "Open-Meteo.com" })).toHaveAttribute("href", "https://open-meteo.com/");
  await expect(today.getByRole("link", { name: "CC BY 4.0" })).toBeVisible();
  await page.unroute(METEO);
  await page.route(METEO, (r) => r.fulfill({ status: 500, body: "" }));
  await page.reload();
  await expect(today).toBeHidden();
  // The privacy page says which services a visitor's browser contacts.
  await page.goto(srv.base + "/privacy");
  await expect(page.locator("main")).toContainText("is loaded from a Google Sheet, so your browser contacts Google");
  await expect(page.locator("main")).toContainText("loaded from Open-Meteo, a weather service");
  await srv.close();
});

test("run club: the next run goes into the calendar in UTC", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/club");
  await expect(page.locator("#run-thu [data-next]")).toHaveText("Next: Thursday 22 October.");
  const download = page.waitForEvent("download");
  await page.locator("#run-thu [data-ics]").click();
  const file = await download;
  const ics = await (await file.createReadStream()).toArray().then((c) => Buffer.concat(c).toString());
  expect(ics).toContain("DTSTART:20261022T180000Z"); // 19:00 BST
  expect(ics).toContain("LOCATION:The showroom\\, Arch 14");
  await expect(page.locator("#run-thu .wr-route figcaption")).toContainText("4.2 km");
  await srv.close();
});

test("the drop-day line shows only on drop day with a fresh sheet, and places a ticket", async ({ page }) => {
  const srv = await start(client);
  await page.route(SHEET, (r) => r.abort());
  await page.route(METEO, (r) => r.abort());
  let csv = "serving,given,updated_at,note\n18,52,2026-10-24 09:55,Coffee on the door";
  await page.route(LINE, (r) => r.fulfill({ contentType: "text/csv", body: csv }));
  await page.goto(srv.base + "/");
  await expect(page.locator("#line")).toBeHidden(); // Monday: not drop day
  await page.clock.setFixedTime(new Date("2026-10-24T09:00:00Z")); // Saturday 10:00 BST
  await page.reload();
  const line = page.locator("#line");
  await expect(line).toBeVisible();
  await expect(line.locator("[data-line-serving]")).toHaveText("18");
  await line.getByLabel("Your ticket").fill("30");
  await expect(line.locator("[data-line-out]")).toHaveText("12 ahead of you, about 24 min.");
  csv = "serving,given,updated_at\n18,52,2026-10-24 08:00";
  await page.reload();
  await expect(line).toBeHidden(); // an hour-old number is never shown
  await srv.close();
});

test("without JavaScript every piece, its price and the size table are there", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await expect(page.locator(".wr-piece")).toHaveCount(5);
  await expect(page.locator("#piece-shell-04")).toContainText("£180");
  await page.goto(srv.base + "/fit");
  await expect(page.locator("#fit-shell-02 td[data-size='M']").first()).toHaveText("58");
  await ctx.close();
  await srv.close();
});
