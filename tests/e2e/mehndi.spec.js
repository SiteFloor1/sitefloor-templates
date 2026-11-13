// Mehndi kit and the Loupe look, as a client uses them: the palm and its hidden name, the date check from the artist's
// diary (simulated on the demo, the client's sheet failing closed), darkest on the day, the guest sum, the wedding week
// planner, personal details, the design library's filters, and the pages without JavaScript.
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { test, expect, site, start, watchErrors } from "./helpers.js";

const demo = site("demos/mehndi");
const client = site("_fixtures/test-mehndi-client");
const waText = async (loc) => new URL(await loc.getAttribute("href")).searchParams.get("text") ?? "";
const pickDate = async (page, prefix, d, m, y) => {
  await page.selectOption(`#${prefix}-y`, String(y));
  await page.selectOption(`#${prefix}-m`, String(m));
  await page.selectOption(`#${prefix}-d`, String(d));
};

test("the home page keeps to the palm, the bride, the date, the guests, natural henna, questions and the studio", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const ids = await page.$$eval("main > section", (all) => all.filter((x) => !x.hidden).map((x) => x.id || x.className));
  expect(ids).toEqual(["hero lp-hero", "packages", "date", "guests", "natural", "questions", "visit"]);
  await expect(page.locator("#reviews")).toHaveCount(0); // on the bridal page
  await expect(page.locator("main img").first()).toHaveAttribute("src", /palm\.webp$/);
  await srv.close();
});

test("Show me rings the name hidden in the palm, and hides it again", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/");
  const show = page.locator(".lp-hero [data-nf-show]");
  await show.click();
  await expect(page.locator(".lp-hero [data-nf-case]")).toHaveClass(/found/);
  await expect(page.locator(".lp-hero [data-nf-hint]")).toHaveText("There, across the middle of the palm.");
  await expect(show).toHaveAttribute("aria-pressed", "true");
  await show.click();
  await expect(page.locator(".lp-hero [data-nf-case]")).not.toHaveClass(/found/);
  await page.locator(".lp-hero [data-nf-case]").hover();
  await expect(page.locator(".lp-hero [data-nf-case]")).toHaveClass(/on/);
  expect(errors).toEqual([]);
  await srv.close();
});

test("the date check answers from the diary, never says booked, and names the evening for the mehndi", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/"); // Monday 19 October 2026
  const out = page.locator("[data-dc-out]");
  await pickDate(page, "dc", 10, 3, 2027);
  await expect(out).toHaveAttribute("data-state", "open");
  await expect(out).toContainText("Wednesday 10 March 2027");
  await expect(out).toContainText("Free so far");
  await pickDate(page, "dc", 31, 10, 2026); // a Saturday inside the next five weeks: taken on the demo
  await expect(out).toHaveAttribute("data-state", "taken");
  await expect(out).not.toContainText(/booked/i);
  expect(await waText(page.locator("[data-dc-ask]"))).toBe("Hello Hatheli, is Saturday 31 October 2026 free for bridal mehndi?");
  await expect(page.locator("[data-dd-out]")).toHaveText("Have your mehndi on Thursday 29 October 2026, in the evening.");
  await pickDate(page, "dc", 1, 10, 2026);
  await expect(out).toHaveAttribute("data-state", "past");
  expect(errors).toEqual([]);
  await srv.close();
});

test("your stain, day by day (client photos only) dates each photograph from her wedding and names the darkest day", async ({ page }) => {
  const srv = await start(client);
  await page.route("https://docs.google.com/**", (r) => r.abort());
  await page.goto(srv.base + "/");
  const when = page.locator("#stain [data-sd-date]");
  await expect(when.first()).toHaveText("The evening");
  await pickDate(page, "dc", 12, 6, 2027);
  await expect(when.first()).toHaveText("The evening · Thursday 10 June");
  await expect(when.last()).toHaveText("Day 2 · Saturday 12 June");
  await expect(page.locator("#stain [data-sd-line]")).toHaveText("Darkest on Saturday 12 June 2027, your wedding day.");
  await srv.close();
});

test("the guest sum works out the artists, the hours and a from price, and sends the wedding date with them", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const line = page.locator("[data-gq-line]");
  await expect(line).toHaveText("Two artists, about 2 hrs.");
  await page.click("[data-gq-up]");
  await page.click('[data-gq-size="full"]');
  await expect(page.locator("[data-gq-n]")).toHaveText("25");
  await expect(line).toHaveText("Three artists, about 2 hrs 50."); // 25 × 20 min over three artists, to the next ten minutes
  await expect(page.locator("[data-gq-from]")).toHaveText("Full hand each · from £700");
  await pickDate(page, "dc", 12, 6, 2027);
  expect(await waText(page.locator("[data-gq-send]"))).toBe("Hello Hatheli, guest mehndi on Saturday 12 June 2027: 25 guests, full hand each (about 20 min, from £700). Could you quote for us?");
  await srv.close();
});

test("the wedding week planner puts every step on its day, with a calendar file and a message for the family", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/planner");
  await expect(page.locator('li[data-step="mehndi"] [data-wp-date]')).toHaveText("Two days before");
  await pickDate(page, "wp", 12, 6, 2027);
  await expect(page.locator('li[data-step="mehndi"] [data-wp-date]')).toHaveText("Thursday 10 June 2027");
  await expect(page.locator('li[data-step="trial"] [data-wp-date]')).toHaveText("Saturday 1 May 2027");
  await expect(page.locator("[data-wp-ics]")).toBeVisible();
  expect(await waText(page.locator("[data-wp-ask]"))).toBe("Hello Hatheli, our wedding is Saturday 12 June 2027. Could we hold Thursday 10 June 2027 for my mehndi?");
  const family = await waText(page.locator("[data-wp-family]"));
  expect(family).toContain("Thursday 10 June 2027: Your mehndi");
  expect(family).toContain("Saturday 12 June 2027: the wedding");
  expect(errors).toEqual([]);
  await srv.close();
});

test("personal details gather what to hide, the words and where into one message", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/personal");
  await page.check('input[name="pd-k"][value="Our names"]');
  await page.fill("#pd-details", "Aman and Simran");
  await page.check('input[name="pd-w"][value="The fingers"]');
  expect(await waText(page.locator("[data-pd-send]"))).toBe("Hello Hatheli, I'd like something personal hidden in my bridal mehndi. What: Our names. Details: Aman and Simran. Where: The fingers. I'll send reference photos here.");
  await page.click(".mh-pd-example [data-nf-show]");
  await expect(page.locator(".mh-pd-example [data-nf-case]")).toHaveClass(/found/);
  await srv.close();
});

test("the design library filters by style and by bridal or guests", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/designs");
  const all = page.locator("[data-dl-item]");
  const shown = page.locator("[data-dl-item]:visible");
  await expect(shown).toHaveCount(await all.count());
  await page.click('[data-dl-style="arabic"]');
  await expect(shown).toHaveCount(2);
  await page.click('[data-dl-for="bridal"]');
  await expect(shown).toHaveCount(0);
  await page.click('[data-dl-style=""]');
  await expect(shown).toHaveCount(5);
  expect(await waText(page.locator('[data-dl-item][data-style="arabic"] a').first())).toBe("Hello Hatheli, I'd like to ask about the Arabic trail design.");
  await srv.close();
});

test("a client reads its own sheet, fails closed without it, and ships no demo code", async ({ page }) => {
  const srv = await start(client);
  await page.route("https://docs.google.com/**", (r) => r.fulfill({ status: 200, contentType: "text/csv", body: "date,status,updated_at\n2027-06-12,taken,2026-10-18 09:00\n2027-06-19,few,\n" }));
  await page.goto(srv.base + "/");
  await pickDate(page, "dc", 12, 6, 2027);
  await expect(page.locator("[data-dc-out]")).toHaveAttribute("data-state", "taken");
  await pickDate(page, "dc", 19, 6, 2027);
  await expect(page.locator("[data-dc-out]")).toHaveAttribute("data-state", "few");
  await page.unroute("https://docs.google.com/**");
  await page.route("https://docs.google.com/**", (r) => r.abort());
  await page.reload();
  await pickDate(page, "dc", 12, 6, 2027);
  await expect(page.locator("[data-dc-out]")).toHaveAttribute("data-state", "unknown");
  await expect(page.locator("[data-dc-out]")).toContainText("We can't see the diary just now");
  await expect(page.locator("#guests")).toHaveCount(0); // the guest sum isn't on this site
  const assets = path.join(client.outDir, "assets");
  const js = readdirSync(assets).filter((f) => f.endsWith(".js")).map((f) => readFileSync(path.join(assets, f), "utf8")).join("\n");
  expect(js).not.toMatch(/simulated|DEMO ONLY/);
  expect(readFileSync(path.join(client.outDir, "_headers"), "utf8")).toMatch(/connect-src [^;]*https:\/\/docs\.google\.com/);
  await srv.close();
});

test("without JavaScript the palm, every design and the planner's steps still show", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await expect(page.locator(".lp-hero [data-nf-img]")).toBeVisible();
  await expect(page.locator(".lp-hero [data-nf-show]")).toBeHidden();
  await expect(page.locator("[data-gq-line]")).toHaveText("Two artists, about 2 hrs.");
  await page.goto(srv.base + "/designs");
  await expect(page.locator("[data-dl-filters]")).toBeHidden();
  await expect(page.locator("[data-dl-item]:visible")).toHaveCount(JSON.parse(readFileSync("sites/demos/mehndi/site.json", "utf8")).designs.items.length);
  await page.goto(srv.base + "/planner");
  await expect(page.locator('li[data-step="trial"] [data-wp-date]')).toHaveText("Six weeks before");
  await srv.close();
  await ctx.close();
});
