// Garage kit and the Elsden look, as a customer uses them: the hall from above with the estate parked in bay 7, picking
// a car moves the answer, the reserve link, the drawn plan and the night route together; a van gets the waiting list;
// charging and cameras are layers; moving in and laying up make calendar files; the business enquiry is one message;
// nothing jumps while pages start; and a client's site without the aerial render shows its own photograph and the
// insurer's letter.
import AxeBuilder from "@axe-core/playwright";
import { test, expect, site, start, featuresStarted, OPEN_TIME } from "./helpers.js";

const demo = site("demos/elsden");
const client = site("_fixtures/test-garage-client");
const waText = async (/** @type {import("@playwright/test").Locator} */ loc) => new URL(await loc.getAttribute("href") ?? "").searchParams.get("text") ?? "";

test("the hall from above: the estate is parked in bay 7 with reduced motion, and a picked car moves everything together", async ({ page }) => {
  const srv = await start(demo);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  const card = page.locator(".el-card");
  await expect(card.locator("h1")).toHaveText("Hall One");
  await expect(card.locator("[data-pick-answer]")).toHaveText("Bay 7 takes it, with 38 cm either side. Free now, with a 7 kW charger.");
  await expect(page.locator(".ga .ga-cap")).toHaveText("Rendered from our plan. Not a photograph.");
  await expect(page.locator("[data-aerial-ov] .ga-free image")).toHaveAttribute("href", /img\/hall-day-empty\.webp$/);
  await expect(page.locator("[data-aerial-ov] .ga-free clipPath rect")).toHaveCount(5);
  await expect(page.locator("[data-aerial-ov] .ga-glow.on rect")).toHaveCount(1);
  await expect(page.locator("[data-aerial-ov] .ga-trail")).toHaveAttribute("d", /^M/);
  await expect(page.locator('#plan [data-bay="7"]')).toHaveClass(/is-best/);
  await card.getByRole("button", { name: "large SUV" }).click();
  await expect(card.locator("[data-pick-answer]")).toHaveText("Bay 14 takes it, with 40 cm either side. Free now, with a 22 kW charger.");
  await expect(card.locator("[data-pick-reserve]")).toHaveText("Reserve bay 14");
  expect(await waText(card.locator("[data-pick-reserve]"))).toBe("Hello Elsden, I’d like to reserve bay 14 for my large SUV.");
  await expect(page.locator('#plan [data-bay="14"]')).toHaveClass(/is-best/);
  await expect(page.locator('#plan [data-bay="7"]')).toHaveClass(/is-tight/);
  await expect(page.locator("#night [data-night-bay]")).toHaveText("Bay 14 is lit and waiting, its charger on.");
  await expect(page.locator("#night [data-night-link]")).toHaveAttribute("href", /arrive-at-night\?car=suv$/);
  await card.getByRole("button", { name: "small hatchback" }).click();
  await expect(page.locator("#night [data-night-bay]")).toHaveText("Bay 4 is lit and waiting.");
  await card.getByRole("button", { name: "van" }).click();
  await expect(card.locator("[data-pick-answer]")).toContainText("No free bay takes a van tonight: our bays are 5.2 m deep.");
  await expect(card.locator("[data-pick-reserve]")).toHaveText("Join the waiting list");
  await expect(page.locator("#plan .is-fit")).toHaveCount(0);
  await expect(page.locator("#night [data-night-bay]")).toHaveText("No free bay takes a van tonight: join the waiting list.");
  await srv.close();
});

test("the night page draws the route for the car carried in its link, and says which car", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/arrive-at-night?car=suv");
  await featuresStarted(page);
  await expect(page.locator("[data-night-for]")).toContainText("For a large SUV.");
  await expect(page.locator(".gn-steps [data-night-bay]")).toHaveText("Bay 14 is lit and waiting, its charger on.");
  await expect(page.locator("[data-night-ov] .gn-line")).toHaveCount(1);
  await page.goto(srv.base + "/arrive-at-night");
  await featuresStarted(page);
  await expect(page.locator("[data-night-for]")).toContainText("For a family estate.");
  await expect(page.locator(".gn-steps [data-night-bay]")).toHaveText("Bay 7 is lit and waiting, its charger on.");
  await srv.close();
});

test("on a phone the drawn plan scrolls sideways and can be reached from the keyboard; axe is clean at 390 px", async ({ page }) => {
  for (const s of [demo, client]) {
    const srv = await start(s);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" }); // reveal animations off, so contrast is measured on final colours
    await page.goto(srv.base + "/");
    await featuresStarted(page);
    await expect(page.locator("#plan [data-plan]")).toHaveAttribute("tabindex", "0");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
    await srv.close();
  }
});

test("the light runs in once when the hall comes into view, and again on a pick", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  const head = page.locator("[data-aerial-ov] .ga-head");
  await expect.poll(async () => Number(await head.getAttribute("opacity") ?? 0), { timeout: 4000 }).toBeGreaterThan(0);
  const first = await head.getAttribute("cx");
  await page.waitForTimeout(500);
  expect(await head.getAttribute("cx")).not.toBe(first);
  await expect(page.locator("[data-aerial-ov] .ga-glow.on rect")).toHaveCount(1, { timeout: 8000 });
  await page.locator(".el-card").getByRole("button", { name: "small hatchback" }).click();
  await expect(page.locator("[data-aerial-ov] .ga-glow.on rect")).toHaveCount(0);
  await expect(page.locator("[data-aerial-ov] .ga-glow.on rect")).toHaveCount(1, { timeout: 8000 });
  await srv.close();
});

test("free bays are live: the demo's list says when it was updated, and the bar counts them", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  await expect(page.locator("[data-bays-updated]")).toHaveText(/^Updated \d\d:\d\d$/);
  await expect(page.locator("[data-free-rows] tr")).toHaveCount(5);
  await srv.close();
});

test("a client's free bays come from their sheet: the picker, the plan and the list follow it; a stale sheet says so", async ({ page }) => {
  const srv = await start(client);
  const stamp = (/** @type {number} */ ms) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(ms).replace(",", "");
  const now = new Date(OPEN_TIME).getTime(); // the page's clock is fixed at OPEN_TIME
  let when = stamp(now - 20 * 60_000);
  await page.route("https://docs.google.com/**", (r) => r.fulfill({ contentType: "text/csv", body: `bay,status,updated_at\n4,let,${when}\n9,free,${when}\n7,let,${when}\n14,free,${when}\n` }));
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  await expect(page.locator("[data-bays-updated]")).toHaveText(/^Updated \d\d:\d\d$/);
  await expect(page.locator("[data-free-rows] tr")).toHaveCount(2);
  const card = page.locator(".el-card");
  await card.getByRole("button", { name: "small hatchback" }).click();
  await expect(card.locator("[data-pick-answer]")).toHaveText("Bay 9 takes it, with 30 cm either side. Free now.");
  await card.getByRole("button", { name: "family estate" }).click();
  await expect(card.locator("[data-pick-answer]")).toHaveText("Bay 14 takes it, with 48 cm either side. Free now, with a 22 kW charger.");
  await expect(page.locator('#plan [data-bay="7"]')).not.toHaveClass(/is-free/);
  when = stamp(now - 30 * 3_600_000);
  await page.reload();
  await featuresStarted(page);
  await expect(page.locator("[data-bays-updated]")).toHaveText("The free bays can't be confirmed right now. Ask us before you come.");
  await expect(page.locator(".gs-t")).toBeHidden();
  for (const el of await page.locator("[data-free-count]").all()) await expect(el).toHaveText("Ask us first");
  await srv.close();
});

test("charging and cameras are layers, one tap each, on the aerial hall and the plan", async ({ page }) => {
  const srv = await start(demo);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  const hero = page.locator(".ga");
  await hero.getByRole("button", { name: "Charging" }).click();
  await expect(hero.locator(".ga-lay.on .ga-tag")).toHaveCount(6);
  await expect(hero.locator("[data-layer-note]")).toHaveText("Six bays with chargers: five at 7 kW, bay 14 at 22 kW. Plug in by 10pm, charged by 7am.");
  await hero.getByRole("button", { name: "Cameras and gate" }).click();
  await expect(hero.locator(".ga-lay.on .ga-cone")).toHaveCount(4);
  await expect(hero.locator("[data-layer-note]")).toContainText("never a live feed");
  const plan = page.locator("#plan");
  await plan.getByRole("button", { name: "Cameras" }).click();
  await expect(plan.locator("[data-plan]")).toHaveClass(/show-watch/);
  await srv.close();
});

test("moving in and laying up are calendar files; the business enquiry is one message", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  const mi = page.locator("#moving-in");
  await mi.getByLabel("Your first day").fill("2027-01-15");
  await mi.getByLabel("Your first day").dispatchEvent("change");
  await expect(mi.locator("[data-mi-steps] li").first()).toContainText("Tuesday 12 January");
  const [dl] = await Promise.all([page.waitForEvent("download"), mi.getByRole("link", { name: "Add to your calendar" }).click()]);
  expect(dl.suggestedFilename()).toBe("moving-in.ics");
  await page.goto(srv.base + "/laying-up");
  await featuresStarted(page);
  await page.getByLabel("Stored from").fill("2027-01-01");
  await page.getByLabel("Stored from").dispatchEvent("change");
  await page.getByLabel("Back on the road").fill("2027-03-01");
  await page.getByLabel("Back on the road").dispatchEvent("change");
  await expect(page.locator("[data-lu-events] li")).toHaveCount(2);
  await expect(page.locator("[data-lu-events] li").last()).toContainText("Monday 1 March");
  await page.goto(srv.base + "/business");
  await featuresStarted(page);
  await page.getByLabel("Business name").fill("Hale Couriers");
  await page.getByLabel("Every hour").check();
  expect(await waText(page.getByRole("link", { name: "Send on WhatsApp" }))).toBe("Hello Elsden, a business enquiry from Hale Couriers. Vehicles: One to three vehicles. Access: Every hour. We’d like a monthly invoice.");
  await srv.close();
});

test("on a phone the hall turns so the gate is at the bottom, the picker follows it, and the bar shows the free bays", async ({ page }) => {
  const srv = await start(demo);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  await expect(page.locator("[data-aerial-ov]")).toHaveAttribute("viewBox", "0 0 18.1 27.5");
  const img = await page.locator(".ga img").boundingBox(), chips = await page.locator(".el-card .gp-chips").boundingBox();
  expect(img && chips && chips.y > img.y + img.height).toBeTruthy();
  await expect(page.locator(".el-bar-free")).toHaveText("5 bays free");
  await srv.close();
});

test("nothing jumps while pages start, with slow fonts and scripts; no page scrolls sideways on a small phone", async ({ browser }) => {
  const srv = await start(demo);
  for (const [path, width] of /** @type {[string, number][]} */ ([["/", 390], ["/", 1440], ["/arrive-at-night", 390], ["/laying-up", 1024], ["/business", 390]])) {
    const page = await browser.newPage({ viewport: { width, height: 800 } });
    await page.route("**/*.woff2", async (r) => { await new Promise((x) => setTimeout(x, 600)); await r.continue(); });
    await page.route("**/assets/site-*.js", async (r) => { await new Promise((x) => setTimeout(x, 1500)); await r.continue(); });
    await page.addInitScript(() => {
      const w = /** @type {any} */ (window); w.__cls = 0;
      new PerformanceObserver((l) => { for (const e of /** @type {any[]} */ (l.getEntries())) if (!e.hadRecentInput) w.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto(srv.base + path);
    await featuresStarted(page);
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => /** @type {any} */ (window).__cls), `${path} at ${width} px`).toBeLessThan(0.05);
    await page.close();
  }
  const small = await browser.newPage({ viewport: { width: 320, height: 640 } });
  for (const path of ["/", "/arrive-at-night", "/laying-up", "/business", "/terms", "/privacy", "/visit"]) {
    await small.goto(srv.base + path);
    expect(await small.evaluate(() => document.documentElement.scrollWidth), `${path} at 320 px`).toBeLessThanOrEqual(320);
  }
  await small.close();
  await srv.close();
});

test("a client's site without the aerial render: its own photograph, the picker in its card, and the insurer's letter", async ({ page }) => {
  const srv = await start(client);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  await expect(page.locator(".el-photo img")).toBeVisible();
  await expect(page.locator(".ga")).toHaveCount(0);
  await expect(page.locator(".el-card h1")).toHaveText("The Arches");
  await expect(page.locator(".el-card [data-pick-chips]")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Our security, in a letter for your insurer" })).toHaveAttribute("href", /security-letter\.pdf$/);
  await expect(page.locator(".gcc-h span")).toHaveText("example");
  await srv.close();
});
