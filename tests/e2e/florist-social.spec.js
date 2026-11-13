// Florist kit and the Tissue look (Laleh demo), as a customer uses them: the home page opens on the florist's feed
// (Fresh and Forever, a pinned post, what's left of each bouquet), "Ask for this one" writes the order out for
// WhatsApp or an Instagram DM, "Send the link" takes only TikTok, Instagram and Pinterest links, the drop counts down
// to the florist's own time and never shows a count it can't stand behind, and LIVE sessions drop off once they end.
import { test, expect, site, start, watchErrors } from "./helpers.js";

const demo = site("demos/florist-social");
const client = site("_fixtures/test-florist-social-client");
/** Serves the florist's published Sheet with these rows (kind,key,value), or a failure. */
const sheet = (page, rows, status = 200) => page.route("https://docs.google.com/**", (r) => r.fulfill({ status, contentType: "text/csv", body: status === 200 ? `kind,key,value\n${rows.join("\n")}\n` : "" }));
const waText = async (loc) => new URL(await loc.getAttribute("href")).searchParams.get("text") ?? "";

test("the home page opens on the feed: ranges, the pinned post, then the bouquets", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/");
  await expect(page.locator("main h1")).toHaveClass(/sr-only/);
  await expect(page.locator("main > section").first()).toHaveAttribute("id", "bouquets");
  await expect(page.locator(".tb-post").first()).toHaveClass(/tb-pinned/);
  await expect(page.locator(".tb-flag")).toContainText("Pinned");
  // Fresh shows first; Forever's bouquets are there but hidden until chosen.
  await expect(page.locator("[data-tb-in='fresh']:visible")).toHaveCount(4);
  await expect(page.locator("[data-tb-in='forever']:visible")).toHaveCount(0);
  await page.click("[data-tb-range='forever']");
  await expect(page.locator("[data-tb-in='forever']:visible")).toHaveCount(4);
  await expect(page.locator("[data-tb-in='fresh']:visible")).toHaveCount(0);
  await expect(page.locator("[data-tb-range='forever']")).toHaveAttribute("aria-selected", "true");
  expect(errors).toEqual([]);
  await srv.close();
});

test("what's left: a few left says so, sold out has no Ask", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await expect(page.locator("[data-tb-item='just-peonies'] [data-tb-status]")).toHaveText("2 left");
  await expect(page.locator("[data-tb-item='one-peony'] [data-tb-status]")).toHaveText("Sold out");
  await expect(page.locator("[data-tb-item='one-peony'] [data-tb-ask]")).toBeHidden();
  await srv.close();
});

test("Ask for this one: the order carries the bouquet, the day, the card and the extras", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await page.click("[data-tb-item='blush-sage'] [data-tb-ask]");
  const dlg = page.locator("[data-tb-order]");
  await expect(dlg).toBeVisible();
  await expect(dlg.locator("h2")).toHaveText("Blush and sage");
  await dlg.locator("[data-tb-o-day]").fill("2026-10-23");
  await dlg.locator("[data-tb-o-card]").fill("Happy birthday, gorgeous");
  await dlg.locator("[data-tb-o-add][value='candle']").check();
  const text = await waText(dlg.locator("[data-tb-o-wa]"));
  expect(text).toContain("Blush and sage (£48)");
  expect(text).toContain("Add: A soy candle (£16)");
  expect(text).toContain("For: Fri 23 Oct");
  expect(text).toContain("Happy birthday, gorgeous");
  await expect(dlg.locator("[data-tb-o-msg]")).toContainText("Blush and sage");
  await expect(dlg.locator("[data-tb-o-ig]")).toBeVisible();
  await srv.close();
});

test("Send the link: only TikTok, Instagram and Pinterest; the message has the link, budget and day", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const send = page.locator("[data-mk-send]");
  await expect(send).toHaveAttribute("aria-disabled", "true");
  await page.fill("#mk-link", "https://example.com/flowers");
  await expect(page.locator("[data-mk-why]")).toHaveText("That link isn't from TikTok, Instagram or Pinterest.");
  await expect(send).toHaveAttribute("aria-disabled", "true");
  await page.fill("#mk-link", "https://www.tiktok.com/@someone/video/7431?is_from_webapp=1");
  await page.locator(".mk-bud label", { hasText: "£60" }).click();
  await page.fill("#mk-day", "2026-10-24");
  await expect(page.locator("[data-mk-msg]")).toHaveText("Hi Laleh, can you do this one? https://www.tiktok.com/@someone/video/7431 Budget £60, for Sat 24 Oct.");
  await expect(send).not.toHaveAttribute("aria-disabled", "true");
  expect(await waText(send)).toContain("https://www.tiktok.com/@someone/video/7431");
  await srv.close();
});

test.describe("the drop", () => {
  test("before it opens, a countdown to the florist's own day and time", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/drop"); // Monday 19 Oct 10:30 BST → Friday 23 Oct 19:00 BST
    await expect(page.locator("[data-drop-clock]")).toBeVisible();
    await expect(page.locator("[data-drop-clock] [data-d='d']")).toHaveText("04");
    await expect(page.locator("[data-drop-clock] [data-d='h']")).toHaveText("08");
    await expect(page.locator("[data-drop-order]")).toBeHidden();
    await page.goto(srv.base + "/");
    await expect(page.locator("[data-drop-tile] [data-drop-clock]")).toBeVisible();
    await srv.close();
  });

  test("while it's open, what's left (the demo's own count); the order opens", async ({ page }) => {
    const srv = await start(demo);
    await page.clock.setFixedTime(new Date("2026-10-23T19:30:00Z")); // Friday 20:30 BST
    await page.goto(srv.base + "/drop");
    await expect(page.locator("[data-drop-now]")).toHaveText("Open now: 12 of 20 left.");
    await expect(page.locator("[data-drop-clock]")).toBeHidden();
    await expect(page.locator("[data-drop-order]")).toBeVisible();
    await srv.close();
  });
});

test("LIVE sessions drop off once they've ended", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await expect(page.locator("[data-lv-session]:visible")).toHaveCount(3);
  await page.clock.setFixedTime(new Date("2026-11-12T21:00:00Z")); // after the 12 Nov session ended
  await page.goto(srv.base + "/");
  await expect(page.locator("[data-lv-session='2026-11-12T19:00']")).toBeHidden();
  await expect(page.locator("[data-lv-session]:visible").first()).toHaveAttribute("data-lv-session", "2026-11-19T20:00");
  await srv.close();
});

test("same-day: closed on Mondays, so it names tomorrow; Birmingham postcodes only", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await expect(page.locator("#bouquets [data-sd-text]")).toHaveText("Today's deliveries have gone. Order now for tomorrow.");
  await page.click("#bouquets summary:has-text('Check your postcode')");
  await page.fill("#pc-feed", "B15 2TT");
  await page.click("#bouquets .ts-pc button");
  await expect(page.locator("#bouquets [data-sd-answer]")).toContainText("B15");
  await page.fill("#pc-feed", "M1 1AA");
  await page.click("#bouquets .ts-pc button");
  await expect(page.locator("#bouquets [data-sd-answer]")).toContainText("We don't deliver by hand to M1");
  await srv.close();
});

test("follow your order shows the demo's own note and photo", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/your-order#LAL7Q2");
  await expect(page.locator("[data-track-step][aria-current='step'] b")).toHaveText("Being made");
  await expect(page.locator("[data-track-note]")).toContainText("on the table now");
  await srv.close();
});

test("on a phone the order bar never covers the drop at rest, and the feed is two columns", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(new Date("2026-10-19T09:30:00Z"));
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const bar = await page.locator(".mbar").boundingBox();
  const drop = await page.locator("[data-drop-tile]").boundingBox();
  expect(drop.y >= bar.y || drop.y + drop.height <= bar.y).toBe(true);
  const [a, b] = await page.locator("[data-tb-in='fresh']:visible").evaluateAll((els) => els.slice(0, 2).map((e) => e.getBoundingClientRect().top));
  expect(a).toBe(b);
  await ctx.close();
  await srv.close();
});

test.describe("a client's site: what's left comes from the florist's Sheet, and only while it's fresh", () => {
  const item = (page, id) => page.locator(`[data-tb-item='${id}']`);

  test("a fresh Sheet: counts, sold out, hidden; an impossible count shows nothing", async ({ page }) => {
    const srv = await start(client);
    await sheet(page, ["bouquet,updated,2026-10-19 10:00", "bouquet,peonies,few:2", "bouquet,one-peony,sold", "bouquet,in-white,hidden", "bouquet,blush-sage,999"]);
    await page.goto(srv.base + "/"); // Monday 10:30 BST: updated half an hour ago
    await expect(item(page, "peonies").locator("[data-tb-status]")).toHaveText("2 left");
    await expect(item(page, "one-peony").locator("[data-tb-status]")).toHaveText("Sold out");
    await expect(item(page, "one-peony").locator("[data-tb-ask]")).toBeHidden();
    await expect(item(page, "in-white")).toBeHidden();
    await expect(item(page, "blush-sage").locator("[data-tb-status]")).toBeHidden();
    await srv.close();
  });

  test("a stale Sheet shows no count and no sold out (hidden still hides)", async ({ page }) => {
    const srv = await start(client);
    await sheet(page, ["bouquet,updated,2026-10-19 07:00", "bouquet,peonies,few:2", "bouquet,one-peony,sold", "bouquet,in-white,hidden"]);
    await page.goto(srv.base + "/"); // three and a half hours later, past the florist's 120 minutes
    await expect(item(page, "peonies").locator("[data-tb-status]")).toBeHidden();
    await expect(item(page, "one-peony").locator("[data-tb-ask]")).toBeVisible();
    await expect(item(page, "in-white")).toBeHidden();
    await srv.close();
  });

  test("no update time, or a broken Sheet: nothing claimed", async ({ page }) => {
    const srv = await start(client);
    await sheet(page, ["bouquet,peonies,few:2"]);
    await page.goto(srv.base + "/");
    await expect(item(page, "peonies").locator("[data-tb-status]")).toBeHidden();
    await page.unrouteAll();
    await sheet(page, [], 500);
    await page.goto(srv.base + "/");
    await expect(page.locator("[data-tb-status]:visible")).toHaveCount(0);
    await expect(page.locator("[data-tb-in='fresh'] [data-tb-ask]:visible")).toHaveCount(4);
    await srv.close();
  });
});

test.describe("a client's drop reads its count from the Sheet", () => {
  const open = new Date("2026-10-23T19:30:00Z"); // Friday 20:30 BST, the drop opened at 19:00
  const now = (page) => page.locator("[data-drop-now]");
  const cases = [
    ["a fresh count", ["drop,left,7", "drop,updated,2026-10-23 20:25"], "Open now: 7 of 12 left."],
    ["sold out", ["drop,left,0", "drop,updated,2026-10-23 20:28"], "Sold out. The next drop is next week."],
    ["a stale count", ["drop,left,7", "drop,updated,2026-10-23 20:10"], "Open now. Check our Instagram stories for what's left."],
    ["no update time", ["drop,left,7"], "Open now. Check our Instagram stories for what's left."],
    ["more than were made", ["drop,left,13", "drop,updated,2026-10-23 20:25"], "Open now. Check our Instagram stories for what's left."],
    ["not a number", ["drop,left,lots", "drop,updated,2026-10-23 20:25"], "Open now. Check our Instagram stories for what's left."],
  ];
  for (const [name, rows, text] of cases) {
    test(name, async ({ page }) => {
      const srv = await start(client);
      await page.clock.setFixedTime(open);
      await sheet(page, rows);
      await page.goto(srv.base + "/drop");
      await expect(now(page)).toHaveText(text);
      await srv.close();
    });
  }

  test("a broken Sheet never shows a number", async ({ page }) => {
    const srv = await start(client);
    await page.clock.setFixedTime(open);
    await sheet(page, [], 500);
    await page.goto(srv.base + "/drop");
    await expect(now(page)).toHaveText("Open now. Check our Instagram stories for what's left.");
    await srv.close();
  });
});

test("a client's build carries no demo code or demo labels", async ({ page }) => {
  const srv = await start(client);
  await page.goto(srv.base + "/");
  const scripts = await page.$$eval("script[src]", (s) => s.map((x) => x.src));
  for (const src of scripts) {
    const body = await (await page.request.get(src)).text();
    expect(body).not.toMatch(/simulatedFlorist|DEMO ONLY|stage every 20/);
  }
  await expect(page.getByText("Fictional business")).toHaveCount(0);
  await srv.close();
});
