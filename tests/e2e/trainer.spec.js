// Trainer kit and the Linen look, as a new client uses them: the diary within the first phone screens with Reserve
// always in reach, an open hour writing the message, the first month planned from that hour, and a client's
// diary closing (no hours shown, messaging still works) when the trainer's sheet can't be read.
import { test, expect, site, start, watchErrors } from "./helpers.js";

const demo = site("demos/trainer");
const client = site("_fixtures/test-trainer-client");
const waText = async (loc) => new URL(await loc.getAttribute("href")).searchParams.get("text") ?? "";

test("on a phone the diary is on the first screens and Reserve stays in the phone bar", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(srv.base + "/");
  const diary = await page.locator("#diary").boundingBox();
  expect(diary?.y ?? 9999).toBeLessThan(844 * 2);
  const go = page.locator(".mbar .ln-bar-go");
  await page.mouse.wheel(0, 3000);
  await expect(go).toBeInViewport();
  expect(await waText(go)).toContain("private training");
  expect(errors).toEqual([]);
  await srv.close();
});

test("tapping an open hour asks for that hour, and the first month starts from it", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await expect(page.locator("#diary")).toHaveAttribute("data-state", "ok");
  const hours = page.locator("#diary button.td-o");
  const n = await hours.count();
  await expect(page.locator("[data-td-count]")).toHaveText(`${n} open`);
  test.skip(n === 0, "every demo hour this week has passed");
  await hours.first().click();
  await expect(hours.first()).toHaveAttribute("aria-pressed", "true");
  const go = page.locator("[data-td-go]");
  await expect(go).toHaveText("Ask for this hour");
  expect(await waText(go)).toMatch(/\d{2}:\d{2}/);
  await expect(page.locator("[data-tm-then]")).toBeVisible();
  await expect(page.locator("[data-tm-dates] li").first()).toBeVisible();
  await expect(page.locator("[data-tm-ics]")).toBeVisible();
  await srv.close();
});

test("a client diary whose sheet can't be read shows no hours, and messaging still works", async ({ page }) => {
  const srv = await start(client);
  const errors = watchErrors(page);
  await page.route("https://docs.google.com/**", (r) => r.abort());
  await page.goto(srv.base + "/");
  await expect(page.locator("#diary")).toHaveAttribute("data-state", "closed");
  await expect(page.locator("#diary button.td-o")).toHaveCount(0);
  await expect(page.locator("[data-td-count]")).toHaveText("");
  await expect(page.locator("[data-tm-then]")).toBeHidden();
  expect(await waText(page.locator("[data-td-go]"))).toBe("Hello, I'd like to ask about private training.");
  expect(errors).toEqual([]);
  await srv.close();
});

test("the goal finder picks the programme, lays out a week and says so in the message", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/programmes");
  const tg = page.locator("#goal");
  await tg.getByRole("button", { name: "A bad back, or after an injury" }).click();
  await tg.getByRole("button", { name: "3", exact: true }).click();
  await tg.locator('[data-tg="injury"]').getByRole("button", { name: "Yes" }).click();
  await expect(tg.locator("[data-tg-prog]")).toHaveText("Back to training");
  await expect(tg.locator("[data-tg-prog]")).toHaveAttribute("href", /programme-back/);
  await expect(tg.locator("[data-tg-week] li")).toHaveCount(3);
  await expect(tg.locator("[data-tg-inj]")).toBeVisible();
  expect(await waText(tg.locator("[data-tg-go]"))).toContain("3 days a week; I have an injury");
  await srv.close();
});

test("coverage answers from the trainer's districts, and offers online further out", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/online");
  const box = page.locator("#coverage");
  await box.getByLabel("Your postcode").fill("sw10 9aa");
  await box.getByRole("button", { name: "Check" }).click();
  await expect(box.locator("[data-tcv-out]")).toContainText("SW10: yes.");
  await expect(box.locator('[data-tcv-area="home"]')).toHaveClass(/yes/);
  await expect(box.locator('[data-tcv-area="park"]')).toHaveClass(/no/);
  await box.getByLabel("Your postcode").fill("SW19");
  await box.getByRole("button", { name: "Check" }).click();
  await expect(box.locator("[data-tcv-out]")).toContainText("online");
  await srv.close();
});

test("twelve weeks: dated sessions, a bank holiday struck out, the cost from the trainer's prices", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/prices");
  const t = page.locator("#twelve-weeks");
  await t.getByRole("button", { name: "Twice a week" }).click();
  await t.getByLabel("First session").fill("2026-12-21");
  await t.getByLabel("First session").dispatchEvent("change");
  await expect(t.locator('[data-ttl-week="1"] li')).toHaveText(["Mon 21 Dec", "Thu 24 Dec"]);
  await expect(t.locator('[data-ttl-week="2"] li.off')).toContainText("Mon 28 Dec"); // Boxing Day's substitute
  await expect(t.locator("[data-ttl-sum]")).toContainText("23 sessions");
  await expect(t.locator("[data-ttl-sum]")).toContainText("£2,530"); // 23 × £110
  const [download] = await Promise.all([page.waitForEvent("download"), t.getByRole("button", { name: /Save every session/ }).click()]);
  expect(download.suggestedFilename()).toBe("twelve-weeks.ics");
  expect(await waText(t.locator("[data-ttl-go]"))).toContain("23 sessions");
  expect(errors).toEqual([]);
  await srv.close();
});

test("prices show the duo price per person; client stories carry consent and demo ones say they're samples", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/prices");
  const row = page.locator(".tpp-t tbody tr").nth(2);
  await expect(row.locator("[data-one]").nth(1)).toHaveText("£110");
  await page.getByRole("button", { name: "Training with someone" }).click();
  await expect(row.locator("[data-two]").nth(1)).toContainText("£75");
  await page.goto(srv.base + "/results");
  await expect(page.locator(".tst-note")).toContainText("Sample stories");
  await srv.close();
  const c = await start(client);
  await page.goto(c.base + "/results");
  await expect(page.locator(".tst-note")).toHaveCount(0);
  await expect(page.locator(".tst-item figcaption small").first()).toContainText("consent");
  await c.close();
});

test("the checklist counts ticks and the company request writes the message", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/start");
  const cl = page.locator("#before");
  const ticks = cl.getByRole("checkbox");
  const n = await ticks.count();
  await ticks.first().check();
  await expect(cl.locator("[data-tcl-count]")).toHaveText(`1 of ${n} ready`);
  await page.goto(srv.base + "/corporate");
  await page.getByLabel("Which").selectOption("The studio, for a team");
  await page.getByLabel("How many people").fill("5");
  await page.getByRole("checkbox", { name: "Wed" }).check();
  await page.getByLabel("Company or family name").fill("Harbour & Co");
  expect(await waText(page.locator("[data-tpk-go]"))).toBe("Hello, I'd like to ask about a package: The studio, for a team, 5 people, Wed, for Harbour & Co.");
  await srv.close();
});
