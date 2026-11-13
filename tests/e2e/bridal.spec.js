// Bridal kit and the Dove look, as a bride uses them: a quiet home page (no dropdowns on it), the appointment request
// in its sheet and the gown diary (one shared wedding date, always UK order), the calendar file, the gown finder, the
// shortlist and its link, the mirror, trunk shows dropping off when they finish, and the pages without JavaScript.
import { readFileSync } from "node:fs";
import { test, expect, site, start, watchErrors } from "./helpers.js";

const demo = site("demos/bridal");
const client = site("_fixtures/test-bridal-client");
const waText = async (loc) => new URL(await loc.getAttribute("href")).searchParams.get("text") ?? "";
const diaryDate = async (page, d, m, y) => {
  await page.click("[data-gd-pick]");
  await pickDate(page, "gd", d, m, y);
  await page.click("[data-gd-done]");
};
const pickDate = async (page, prefix, d, m, y) => {
  await page.selectOption(`#${prefix}-y`, String(y));
  await page.selectOption(`#${prefix}-m`, String(m));
  await page.selectOption(`#${prefix}-d`, String(d));
};

test("the home page is a few quiet sections with no dropdowns on it", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const ids = await page.$$eval("main > section", (all) => all.map((x) => x.id || x.className));
  expect(ids).toEqual(["hero dv-hero", "gowns", "appointment", "diary", "trunk-shows", "visit"]);
  expect(await page.$$eval("select", (all) => all.filter((x) => x.checkVisibility()).length)).toBe(0);
  await expect(page.locator(".bd-ed")).toHaveCount(3);
  await expect(page.locator(".bd-ed").first()).toContainText("From £4,600");
  await srv.close();
});

test.describe("the appointment and the dates", () => {
  test("the request opens in a sheet and carries the wedding date in UK order, who is coming and the designers", async ({ page }) => {
    const srv = await start(demo);
    const errors = watchErrors(page);
    await page.goto(srv.base + "/");
    await page.click("[data-ap-open]");
    await expect(page.locator("[data-ap-sheet]")).toBeVisible();
    await pickDate(page, "ap", 18, 9, 2027);
    await page.selectOption("#ap-party", "2");
    await page.locator("#appointment label.bd-chip", { hasText: "A Saturday" }).click();
    await page.locator("#appointment label.bd-chip", { hasText: "Studio Morrell" }).click();
    const text = await waText(page.locator("[data-ap-send]"));
    expect(text).toContain("Wedding: Saturday 18 September 2027");
    expect(text).toContain("Coming: me and 1 guest");
    expect(text).toContain("Best for me: A Saturday");
    expect(text).toContain("Designers I'd like to see: Studio Morrell");
    expect(text).not.toMatch(/booked|confirmed/i);
    await page.keyboard.press("Escape");
    // the same date reaches the diary, which leads with the last day to order
    await expect(page.locator("[data-gd-order]")).toHaveText("Order your gown by Saturday 12 December 2026.");
    await expect(page.locator('#diary [data-step="first"] [data-when]')).toHaveText("Saturday 24 July 2027");
    await expect(page.locator("[data-gd-away]")).toHaveText("Saturday 18 September 2027 · 47 weeks to go");
    expect(errors).toEqual([]);
    await srv.close();
  });

  test("a date too close says so plainly; an impossible day is refused", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await diaryDate(page, 12, 12, 2026);
    await expect(page.locator("[data-gd-late]")).toBeVisible();
    await expect(page.locator('#diary [data-step="order"]')).toHaveAttribute("data-past", "");
    await expect(page.locator("[data-gd-order]")).toContainText("That day has passed.");
    await page.click("[data-gd-pick]");
    await pickDate(page, "gd", 31, 2, 2027);
    await expect(page.locator("#diary [data-date-field]")).toHaveAttribute("data-invalid", "");
    await page.click("[data-gd-done]");
    await expect(page.locator("[data-gd-ics]")).toBeHidden();
    await srv.close();
  });

  test("every date goes to the calendar as all-day events", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await diaryDate(page, 18, 9, 2027);
    const [download] = await Promise.all([page.waitForEvent("download"), page.click("[data-gd-ics]")]);
    expect(download.suggestedFilename()).toBe("gown-diary-2027-09-18.ics");
    const ics = readFileSync(await download.path(), "utf8");
    expect(ics).toContain("DTSTART;VALUE=DATE:20261212");
    expect(ics).toContain("SUMMARY:Final fitting · Wexley");
    expect(ics).toContain("DTSTART;VALUE=DATE:20270918");
    const sent = await waText(page.locator("[data-gd-send]"));
    expect(sent).toContain("Collect your gown: Saturday 11 September 2027");
    await srv.close();
  });
});

test.describe("the gowns", () => {
  test("the finder narrows the rail and never offers a choice that shows nothing; a designer's link opens filtered", async ({ page }) => {
    const srv = await start(demo);
    const errors = watchErrors(page);
    await page.goto(srv.base + "/gowns");
    await expect(page.locator("[data-gf-count]")).toHaveText("12 gowns");
    await page.selectOption("#gf-sleeve", "long");
    await expect(page.locator("[data-gf-count]")).toHaveText("4 gowns");
    await expect(page.locator('[data-gown="aurele"]')).toBeHidden();
    await expect(page.locator('#gf-silhouette option[value="ballgown"]')).toHaveJSProperty("disabled", true);
    await page.selectOption("#gf-sleeve", "");
    await page.evaluate(() => { location.hash = "studio-morrell"; });
    await expect(page.locator("#gf-house")).toHaveValue("studio-morrell");
    await expect(page.locator("[data-gf-count]")).toHaveText("2 gowns");
    const ask = await waText(page.locator('[data-gown="delphine"] a.bd-go'));
    expect(ask).toContain("I'd like to try Delphine by Studio Morrell");
    expect(errors).toEqual([]);
    await srv.close();
  });

  test("the mirror shows a gown from three sides, and closes back to it", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/gowns");
    const btn = page.locator('[data-mirror="aurele"]');
    await btn.click();
    const dlg = page.locator("dialog.bd-mirror");
    await expect(dlg).toBeVisible();
    const srcs = await dlg.locator(".bd-pane img").evaluateAll((imgs) => imgs.map((i) => i.getAttribute("src")));
    expect(srcs).toHaveLength(3);
    expect(new Set(srcs).size).toBe(3);
    await expect(dlg.locator("figcaption")).toHaveText(["Side", "Front", "The collar"]);
    await page.keyboard.press("Escape");
    await expect(dlg).toBeHidden();
    await expect(btn).toBeFocused();
    await expect(page.locator('[data-gown="iris"] [data-mirror]')).toHaveCount(0); // one photograph: no mirror
    await srv.close();
  });

  test("the shortlist is sent on WhatsApp, travels in a link, and joins the appointment request", async ({ page, browser }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/gowns");
    await expect(page.locator("[data-sl-bar]")).toBeHidden();
    await page.click('[data-keep="aurele"]');
    await page.click('[data-keep="iris"]');
    await expect(page.locator('[data-keep="iris"]')).toHaveAttribute("aria-pressed", "true");
    const sent = await waText(page.locator("[data-sl-send]"));
    expect(sent).toContain("1. Aurèle, Maison Vérane\n2. Iris, Vale & Oriel");
    expect(sent).toContain("/gowns#shortlist=aurele.iris");
    await page.goto(srv.base + "/");
    expect(await waText(page.locator("[data-ap-send]"))).toContain("Gowns I'd like to try: Aurèle, Iris");
    // her mother's phone: a fresh browser with only the link
    const ctx = await browser.newContext();
    const other = await ctx.newPage();
    await other.goto(srv.base + "/gowns#shortlist=iris.unknown");
    await expect(other.locator("[data-sl-names]")).toHaveText("Iris");
    await expect(other.locator("[data-sl-shared]")).toBeVisible();
    await ctx.close();
    await srv.close();
  });
});

test("a shared shortlist link never replaces the list this phone has kept", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/gowns");
  await page.click('[data-keep="isadora"]');
  await page.goto(srv.base + "/gowns#shortlist=aurele.odile");
  await page.reload();
  await expect(page.locator("[data-sl-names]")).toHaveText("Aurèle · Odile");
  expect(await page.evaluate(() => localStorage.getItem("sf-shortlist"))).toBe('["isadora"]');
  await page.click("[data-sl-mine]");
  await expect(page.locator("[data-sl-names]")).toHaveText("Isadora");
  await page.goto(srv.base + "/gowns#shortlist=aurele.odile");
  await page.reload();
  await page.click("[data-sl-adopt]");
  await expect(page.locator("[data-sl-names]")).toHaveText("Isadora · Aurèle · Odile");
  expect(await page.evaluate(() => localStorage.getItem("sf-shortlist"))).toBe('["isadora","aurele","odile"]');
  await srv.close();
});

test("on the demo, the made-up waiting-list form shows a note instead of opening", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await page.locator("#trunk-shows a", { hasText: "Join the list" }).click();
  await expect(page.locator("[data-tier-toast]")).toContainText("This demo's form isn't real.");
  expect(page.url()).toContain(srv.base);
  await srv.close();
});

test("trunk shows drop off once they finish", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2027-01-25T10:00:00Z"));
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await expect(page.locator('#trunk-shows [data-to="2027-01-24"]')).toBeHidden();
  await expect(page.locator('#trunk-shows [data-to="2027-02-21"]')).toBeVisible();
  await srv.close();
});

test("without JavaScript the request is a plain link and every gown is listed", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  expect(await page.locator("[data-ap-open]").getAttribute("href")).toMatch(/^https:\/\/wa\.me\//);
  await expect(page.locator("[data-ap-sheet]")).toBeHidden();
  await expect(page.locator('#diary [data-step="order"] [data-when]')).toHaveText("40 weeks before");
  await page.goto(srv.base + "/gowns");
  await expect(page.locator("[data-gown]")).toHaveCount(12);
  await expect(page.locator("[data-gf-form]")).toBeHidden();
  await ctx.close();
  await srv.close();
});

test("the client site carries no demo wording and its request goes to the salon", async ({ page }) => {
  const srv = await start(client);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/");
  await expect(page.locator("body")).not.toContainText(/demo|stock photos/i);
  expect(await waText(page.locator("[data-ap-send]"))).toContain("Hello Ivory and Pin, I'd like an appointment.");
  await expect(page.locator(".dv-mirror img")).toHaveCount(3);
  expect(errors).toEqual([]);
  await srv.close();
});
