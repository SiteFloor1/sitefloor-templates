// Demo-only behaviour: plan switcher and WhatsApp preview.
import { test, expect, site, start } from "./helpers.js";

const demo = site("demos/barber");

test.describe("demo plan switcher", () => {
  let srv;
  test.beforeAll(async () => { srv = await start(demo); });
  test.afterAll(async () => { await srv.close(); });

  test("Starter hides Plus and Signature features; Signature shows them again", async ({ page }) => {
    await page.goto(srv.base + "/");
    await page.locator("[data-demo-ribbon]").getByRole("button", { name: "Starter" }).click();
    await expect(page.locator('[data-feature="chair-board"]')).toBeHidden();
    await expect(page.locator('[data-feature="page-links"]')).toBeHidden();
    await expect(page.getByRole("link", { name: /See all our work/ })).toBeHidden(); // the work page is Plus
    for (const f of ["gallery", "reviews", "price-list"]) await expect(page.locator(`[data-feature="${f}"]`)).toBeVisible();
    await expect(page.locator("[data-tier-toast]")).toContainText("Starter");
    await page.locator("[data-demo-ribbon]").getByRole("button", { name: "Signature" }).click();
    await expect(page.locator('[data-feature="chair-board"]')).toBeVisible();
  });

  test("the chosen plan carries to other pages, and Plus-only pages show a gate on Starter", async ({ page }) => {
    await page.goto(srv.base + "/");
    await page.locator("[data-demo-ribbon]").getByRole("button", { name: "Starter" }).click();
    await page.goto(srv.base + "/team");
    await expect(page.locator("[data-tier-gate]")).toBeVisible();
    await page.locator("[data-tier-gate]").getByRole("button", { name: "See it on Plus" }).click();
    await expect(page.locator("[data-tier-gate]")).toBeHidden();
  });

  test("WhatsApp links open a preview instead of leaving the page", async ({ page }) => {
    await page.goto(srv.base + "/");
    await page.locator(".hero").getByRole("link", { name: /Book on WhatsApp/ }).click();
    await expect(page.locator("[data-wa-preview]")).toBeVisible();
    await expect(page.locator("[data-wa-bubble]")).toContainText("can I book in for a cut");
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-wa-preview]")).toBeHidden();
    expect(new URL(page.url()).pathname).toBe("/");
  });
});

test.describe("seasonal modes", () => {
  let srv;
  test.beforeAll(async () => { srv = await start(demo); });
  test.afterAll(async () => { await srv.close(); });

  for (const [when, name, tint] of [
    ["2026-10-19T09:30:00Z", "Half-term", "autumn"],
    ["2026-11-27T12:00:00Z", "Black Friday", "winter"],
    ["2026-12-10T12:00:00Z", "Christmas", "festive"],
    ["2027-03-01T12:00:00Z", null, null],
  ]) {
    test(`on ${when.slice(0, 10)} the banner is ${name ?? "off"}`, async ({ page }) => {
      await page.clock.setFixedTime(new Date(when));
      await page.goto(srv.base + "/");
      const shown = page.locator(".season:not([hidden])");
      if (name) {
        await expect(shown).toHaveCount(1);
        await expect(shown.locator("b")).toHaveText(name);
        await expect(page.locator("html")).toHaveAttribute("data-season", tint);
      } else {
        await expect(shown).toHaveCount(0);
        await expect(page.locator("html")).not.toHaveAttribute("data-season", /./);
      }
    });
  }
});
