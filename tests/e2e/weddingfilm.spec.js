// Weddingfilm kit and the Première look, as a couple uses them: the film first with its chapters, the date check
// (free, held, booked; the date in UK order and the sunset in the message), the light sentence worked out for the
// date and place chosen, the builder's total, the films by venue, the couple's page by code, and the client site.
import { test, expect, site, start, watchErrors } from "./helpers.js";

const demo = site("demos/weddingfilm");
const client = site("_fixtures/test-weddingfilm-client");
const waText = async (loc) => new URL(await loc.getAttribute("href")).searchParams.get("text") ?? "";

test("the home page leads with the film, then the date and the light; the rest is on its own pages", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/");
  const ids = await page.$$eval("main > section", (all) => all.map((x) => x.id || x.className));
  expect(ids).toEqual(["hero pr-hero", "date", "light", "reviews"]);
  await expect(page.locator(".pr-hero picture img")).toHaveAttribute("fetchpriority", "high");
  await expect(page.locator(".pr-hero video")).toHaveAttribute("preload", "none");
  await expect(page.locator(".wf-ch")).toHaveCount(4);
  await expect(page.locator(".wf-ch").first()).toHaveAttribute("aria-current", "true");
  expect(errors).toEqual([]);
  await srv.close();
});

test("a chapter goes to its place in the film and is marked as playing, even with reduced motion", async ({ page }) => {
  const srv = await start(demo);
  // Reduced motion: the film doesn't start by itself, so the tap is what loads it. (The test server doesn't serve
  // video in ranges, so a film already playing couldn't be moved past what it has downloaded; a real host can.)
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(srv.base + "/");
  await expect(page.locator(".pr-hero video")).not.toHaveAttribute("src", /./);
  await page.locator(".wf-ch", { hasText: "Hands" }).click();
  await expect(page.locator(".wf-ch", { hasText: "Hands" })).toHaveAttribute("aria-current", "true");
  await expect(page.locator(".wf-ch", { hasText: "The lake" })).toHaveAttribute("aria-current", "false");
  await expect(page.locator(".pr-hero video")).toHaveAttribute("src", /reel\.mp4$/);
  // The chapter's time is asked for at once, never after a wait on the network.
  await expect(page.locator(".pr-hero video")).toHaveAttribute("data-chapter-at", "6.3");
  // Where the browser has loaded the film and can seek that far (the test server serves whole files, not ranges, and
  // some CI browsers have no H.264), check it really is there once the seek finishes.
  const at = await page.locator(".pr-hero video").evaluate((el) => new Promise((done) => {
    const v = /** @type {HTMLVideoElement} */ (el);
    const check = () => {
      if (!(v.seekable.length && v.seekable.end(0) >= 6.3)) { done(null); return; }
      if (v.seeking) v.addEventListener("seeked", () => done(v.currentTime), { once: true }); else done(v.currentTime);
    };
    if (v.readyState >= 1) check(); else { v.addEventListener("loadedmetadata", () => setTimeout(check, 50), { once: true }); setTimeout(() => done(null), 4000); }
  }));
  if (at !== null) expect(at).toBeGreaterThanOrEqual(6);
  await srv.close();
});

test("the light sentence is right before any script runs, and follows the date and place", async ({ page, browser }) => {
  const srv = await start(demo);
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const p0 = await noJs.newPage();
  await p0.goto(srv.base + "/");
  await expect(p0.locator("[data-lp-set]")).toHaveText("21:29");
  await expect(p0.locator("[data-lp-date-text]")).toHaveText("Saturday 19 June 2027");
  await noJs.close();

  await page.goto(srv.base + "/");
  await expect(page.locator("[data-lp-facts]")).toContainText("Golden hour 20:35 to 21:58");
  await expect(page.locator("[data-lp-advice]")).toHaveText("We keep 20:40 to 21:20 free for your portraits.");
  await page.selectOption("[data-lp-place]", "como");
  await expect(page.locator("[data-lp-place-text]")).toHaveText("Bellagio, Lake Como");
  await expect(page.locator("[data-lp-set]")).toHaveText("21:17");
  await page.fill("[data-lp-date]", "2027-09-18");
  await page.dispatchEvent("[data-lp-date]", "change");
  await expect(page.locator("[data-lp-date-text]")).toHaveText("Saturday 18 September 2027");
  const text = await waText(page.locator("[data-lp-send]"));
  expect(text).toContain("Wedding: Saturday 18 September 2027");
  expect(text).toContain("Where: Bellagio, Lake Como");
  await expect(page.locator("[data-lp-ics]")).toBeVisible();
  await srv.close();
});

test("the date check says free, held or booked, and sends the date, venue and sunset", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await page.fill("#dc-date", "2027-06-12");
  await page.dispatchEvent("#dc-date", "change");
  await expect(page.locator("[data-dc-answer]")).toContainText("Saturday 12 June 2027 is booked.");
  await page.fill("#dc-date", "2027-06-19");
  await page.dispatchEvent("#dc-date", "change");
  await page.fill("#dc-venue", "Wrenmoor Hall");
  await expect(page.locator("[data-dc-answer]")).toContainText("is free in our diary. The sun sets at 21:29 around Bibury.");
  const text = await waText(page.locator("[data-dc-send]"));
  expect(text).toContain("Wedding: Saturday 19 June 2027");
  expect(text).toContain("Venue: Wrenmoor Hall");
  expect(text).toContain("Sunset that day: 21:29");
  expect(text).not.toMatch(/confirmed/i);
  // the same date moves the light sentence
  await expect(page.locator("[data-lp-date-text]")).toHaveText("Saturday 19 June 2027");
  await srv.close();
});

test("the builder adds the studio's prices; the packages page holds packages, builder and delivery", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/packages");
  await expect(page.locator("main > section")).toHaveCount(3);
  await page.locator(".wf-opt", { hasText: "Film and photographs" }).click();
  await page.selectOption("#bd-x-hour", "2");
  await page.locator(".wf-opt", { hasText: "Drone" }).click();
  await expect(page.locator("[data-bd-total]")).toHaveText("£4,750 in all");
  const text = await waText(page.locator("[data-bd-send]"));
  expect(text).toContain("Package: Film and photographs\nAdd: Another hour × 2\nAdd: Drone\nTotal on your site: £4,750");
  await page.fill("#dl-date", "2027-06-19");
  await page.dispatchEvent("#dl-date", "change");
  await expect(page.locator('[data-step="trailer"] [data-when]')).toHaveText("Saturday 10 July 2027");
  await srv.close();
});

test("films load only when played, and the venue chips find them", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/films");
  await expect(page.locator(".wf-fl video[src]")).toHaveCount(0);
  await page.locator(".wf-chip", { hasText: "Pellory Barn" }).click();
  await expect(page.locator(".wf-fl:visible")).toHaveCount(1);
  await page.locator("#film-pellory [data-fp-play]").click();
  await expect(page.locator("#film-pellory video")).toHaveAttribute("src", /f-pellory\.mp4$/);
  await srv.close();
});

test("your film's progress opens by the code in the link and refuses an unknown one", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/your-film#LARCH0619");
  await expect(page.locator('[data-pg-stage="2"]')).toHaveAttribute("aria-current", "step");
  await expect(page.locator('[data-pg-stage="1"]')).toHaveAttribute("data-state", "done");
  await expect(page.locator('[data-pg-stage="4"]')).toHaveAttribute("data-state", "next");
  await expect(page.locator('[data-pg-part="trailer"] [data-pg-state]')).toHaveText("Delivered");
  await expect(page.locator(".wf-pg a[href^='http']")).toHaveCount(0);
  await expect(page.locator(".wf-pg-private")).toContainText("directly");
  await page.fill("#pg-code", "NOTACODE");
  await page.click(".wf-pg-f button");
  await expect(page.locator("[data-pg-msg]")).toContainText("We don't recognise that code");
  await expect(page.locator("[data-pg-out]")).toBeHidden();
  await srv.close();
});

test("the day planner builds the day from the ceremony time, with portraits in that evening's golden hour", async ({ page, browser }) => {
  const srv = await start(demo);
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const p0 = await noJs.newPage();
  await p0.goto(srv.base + "/the-day");
  await expect(p0.locator('[data-dp-list] [data-id="portraits"] .wf-day-time')).toHaveText("20:40–21:20");
  await noJs.close();
  await page.goto(srv.base + "/the-day");
  await page.fill("#dp-time", "13:00");
  await page.dispatchEvent("#dp-time", "change");
  await expect(page.locator('[data-dp-list] [data-id="ceremony"] .wf-day-time')).toHaveText("13:00–13:30");
  await page.fill("#dp-time", "20:00");
  await page.dispatchEvent("#dp-time", "change");
  await expect(page.locator("#dp-time")).toHaveValue("18:00");
  await expect(page.locator('[data-dp-list] [data-id="ceremony"] .wf-day-time')).toHaveText("18:00–18:30");
  await page.fill("#dp-date", "2026-12-19");
  await page.dispatchEvent("#dp-date", "change");
  await page.fill("#dp-time", "15:00");
  await page.dispatchEvent("#dp-time", "change");
  await expect(page.locator("[data-dp-note]")).toContainText("before your ceremony ends");
  await page.fill("#dp-venue", "Wrenmoor Hall");
  const text = await waText(page.locator("[data-dp-send]"));
  expect(text).toContain("Wedding: Saturday 19 December 2026");
  expect(text).toContain("Where: Wrenmoor Hall, Bibury");
  expect(text).toContain("15:00–15:30 The ceremony");
  await expect(page.locator("[data-dp-ics]")).toHaveAttribute("download", "wedding-day-2026-12-19.ics");
  await srv.close();
});

test("each film has its own page with the light that evening; venues list their light, drone rule and sources", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/film-wrenmoor");
  await expect(page.locator(".wf-one-facts")).toContainText("Golden hour");
  await expect(page.locator(".wf-one-next")).toContainText("Under the pines");
  await page.goto(srv.base + "/venues");
  await expect(page.locator(".wf-vn-i")).toHaveCount(3);
  await expect(page.locator("#venue-wrenmoor .wf-vn-facts")).toContainText("Midsummer");
  await expect(page.locator(".wf-src-list li")).toHaveCount(4);
  await page.goto(srv.base + "/music");
  await expect(page.locator(".wf-ref").first()).toHaveAttribute("href", /#src-\d/);
  await srv.close();
});

test("the client site (Plus) has no chapters, light planner or couple's page, and reads its own sheet", async ({ page }) => {
  const srv = await start(client);
  await page.route("**/docs.google.com/**", (r) => r.fulfill({ status: 200, contentType: "text/csv", body: "date,status,updated_at\n2027-06-19,booked,2026-10-19 09:00\n" }));
  await page.goto(srv.base + "/");
  await expect(page.locator(".wf-ch")).toHaveCount(0);
  await expect(page.locator("#light")).toHaveCount(0);
  await page.fill("#dc-date", "2027-06-19");
  await page.dispatchEvent("#dc-date", "change");
  await expect(page.locator("[data-dc-answer]")).toContainText("is booked.");
  expect((await page.goto(srv.base + "/your-film")).status()).toBe(404);
  expect((await page.goto(srv.base + "/the-day")).status()).toBe(404);
  await srv.close();
});
