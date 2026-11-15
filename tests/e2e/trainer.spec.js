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
