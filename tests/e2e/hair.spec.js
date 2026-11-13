// Hair kit and the Length look, as a client uses them: the photograph cut at your length (only the hair falls, the price
// and the message follow), my usual, the texture strip, the colour year and its calendar file, the skin test, the
// stylists' next free days and chairs free today (demo simulated, the client's published sheets mocked), the stylist
// match, before and after with consent (client only), the wedding planner, the phone home length, and no JavaScript.
import { test, expect, site, start, watchErrors } from "./helpers.js";

const demo = site("demos/hair");
const client = site("_fixtures/test-hair-client");
const waText = async (loc) => new URL(await loc.getAttribute("href")).searchParams.get("text") ?? "";
const SHEET = "https://docs.google.com/spreadsheets/d/e/2PACX-orme-test/pub?gid=0&single=true&output=csv";
const CHAIRS = "https://docs.google.com/spreadsheets/d/e/2PACX-orme-chairs/pub?gid=0&single=true&output=csv";

test("the home page opens on the photograph with chairs free today on it, then textures and stylists", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const ids = await page.$$eval("main > section", (all) => all.map((x) => x.id));
  expect(ids.slice(0, 3)).toEqual(["prices", "textures", "stylists"]);
  await expect(page.locator("#prices #chairs")).toHaveCount(1); // set on the photograph
  expect(ids).not.toContain("vouchers"); // on its own page
  await expect(page.locator("h1")).toHaveText("Priced by your length.");
  await expect(page.locator(".hr-lp-plate")).toBeVisible();
  // the display face is never set below 28px
  const small = await page.$$eval("*", (all) => all.filter((el) => el.checkVisibility() && getComputedStyle(el).fontFamily.startsWith('"Darker Grotesque"') && el.textContent.trim() && parseFloat(getComputedStyle(el).fontSize) < 28).map((el) => el.className));
  expect(small).toEqual([]);
  await srv.close();
});

test.describe("price by length", () => {
  test("a shorter length cuts the photograph: the hair band falls, the knit and chair stay; price, time and message follow", async ({ page }) => {
    const srv = await start(demo);
    const errors = watchErrors(page);
    await page.goto(srv.base + "/");
    const stage = page.locator("[data-lp-stage]");
    await expect(page.locator("[data-lp-price]")).toHaveText("£100"); // mid-length, senior, cut and finish
    await expect(page.locator("[data-lp-time]")).toHaveText("Mid-length, about 1 hr 15 min");
    await page.click('[data-lp-len="shoulder"]');
    expect(await stage.evaluate((el) => el.style.getPropertyValue("--y"))).toBe("0.46");
    // only the hair band between the old line and the new one fades, in place, to a faint trace: nothing moves
    const band = page.locator("[data-lp-fall]");
    await expect(band).toHaveClass(/is-out/);
    expect(await band.evaluate((el) => el.style.clipPath)).toBe("inset(46% 0px 42%)");
    await expect.poll(() => band.evaluate((el) => Number(getComputedStyle(el).opacity))).toBeLessThan(0.01); // the band fades out over the faint trace (.hr-lp-rest), so it settles at 30%
    expect(await band.evaluate((el) => [getComputedStyle(el).transform, getComputedStyle(el).animationName])).toEqual(["none", "none"]);
    expect(await page.locator(".hr-lp-rest").evaluate((el) => getComputedStyle(el).opacity)).toBe("0.3");
    await expect(page.locator("[data-lp-price]")).toHaveText("£92");
    await page.click('[data-lp-svc="balayage"]');
    await page.click('[data-lp-lvl="director"]');
    await expect(page.locator("[data-lp-price]")).toHaveText("£270");
    await expect(page.locator("[data-lp-time]")).toHaveText("Shoulder, about 3 hr");
    await expect(page.locator("[data-lp-note]")).toContainText("A skin test at least 48 hours before.");
    const text = await waText(page.locator("[data-lp-ask]"));
    expect(text).toBe("Hello Selwyn Orr, I'd like to book. Balayage with a director. Length: shoulder.");
    await expect(page.locator('[data-lp-len="shoulder"]')).toHaveAttribute("aria-pressed", "true");
    expect(errors).toEqual([]);
    await srv.close();
  });

  test("my usual is kept on the phone and opens next time", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await page.click('[data-lp-len="mid"]');
    await page.click('[data-lp-svc="roots"]');
    await page.click("[data-lp-usual]");
    await expect(page.locator("[data-lp-usual]")).toHaveText("Kept as my usual");
    await page.reload();
    await expect(page.locator("[data-lp-price]")).toHaveText("£106");
    await expect(page.locator('[data-lp-len="mid"]')).toHaveAttribute("aria-pressed", "true");
    await srv.close();
  });

  test("reduced motion: the line moves, nothing fades", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await page.click('[data-lp-len="short"]');
    await expect(page.locator("[data-lp-fall]")).not.toHaveClass(/is-out/);
    expect(await page.locator("[data-lp-stage]").evaluate((el) => el.style.getPropertyValue("--keep"))).toBe("0.37");
    await expect(page.locator("[data-lp-price]")).toHaveText("£84");
    await srv.close();
  });
});

test("the texture strip opens one texture and its line", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await expect(page.locator('[data-tx-d="curls"]')).toBeVisible();
  await page.click('[data-tx="coils"]');
  await expect(page.locator('[data-tx="coils"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[data-tx-d="coils"]')).toContainText("Marcus · From £115");
  await expect(page.locator('[data-tx-d="curls"]')).toBeHidden();
  await srv.close();
});

test("the colour year marks the visits from the day it was done, and gives a calendar file", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const sec = page.locator("#colour-year");
  await sec.locator("[data-cy-kind]").selectOption("roots");
  await sec.locator("#cy-last-d").selectOption("5");
  await sec.locator("#cy-last-m").selectOption("10");
  await sec.locator("#cy-last-y").selectOption("2026");
  await expect(sec.locator("[data-cy-year] li").nth(1).locator("b")).toHaveText("Root tint 16"); // 5 Oct + 6 weeks, in November
  await expect(sec.locator("[data-cy-note]")).toHaveText("Every 6 weeks from 5 October 2026, the salon's usual for root tint.");
  const download = page.waitForEvent("download");
  await sec.locator("[data-cy-ics]").click();
  const file = await (await download).path();
  const ics = (await import("node:fs")).readFileSync(file, "utf8");
  expect(ics).toContain("DTSTART;VALUE=DATE:20261116");
  expect(ics).toContain("SUMMARY:Root tint due · Selwyn Orr");
  await srv.close();
});

test("the skin test day from the colour day, on the colour page", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/colour");
  const sk = page.locator("#skin-test");
  await sk.locator("#sk-date-d").selectOption("30");
  await sk.locator("#sk-date-m").selectOption("10");
  await sk.locator("#sk-date-y").selectOption("2026");
  await expect(sk.locator("[data-sk-out]")).toHaveText("Walk in for your skin test by Wednesday 28 October 2026.");
  expect(await waText(sk.locator("[data-sk-send]"))).toContain("My colour is on Friday 30 October 2026.");
  await srv.close();
});

test("the stylist match: the service, the hair, then soonest or most senior", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/stylists");
  const m = page.locator("#match");
  await expect(page.locator('[data-st-free="rae"]')).toContainText("Next free");
  await m.locator('input[name="mt-doing"][value="textured"]').check({ force: true });
  await m.locator('input[name="mt-texture"][value="braids"]').check({ force: true });
  await expect(m.locator("[data-mt-name]")).toHaveText("Marcus Bello");
  await m.locator('input[name="mt-doing"][value="colour"]').check({ force: true });
  await m.locator('input[name="mt-texture"][value=""]').check({ force: true });
  await m.locator('input[name="mt-want"][value="senior"]').check({ force: true });
  await expect(m.locator("[data-mt-name]")).toHaveText("Hana Ostrow");
  expect(await waText(m.locator("[data-mt-book]"))).toBe("Hello Selwyn Orr. I'd like to book with Hana Ostrow.");
  await srv.close();
});

test("the wedding planner dates every step and strikes the ones already past", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/bridal-and-occasion");
  await page.selectOption("#wd-date-d", "12");
  await page.selectOption("#wd-date-m", "12");
  await page.selectOption("#wd-date-y", "2026");
  await expect(page.locator('[data-step="trial"] [data-when]')).toHaveText("Saturday 19 September 2026");
  await expect(page.locator('[data-step="trial"]')).toHaveAttribute("data-past", "");
  await expect(page.locator('[data-step="colour"] [data-when]')).toHaveText("Saturday 28 November 2026");
  await expect(page.locator("[data-wd-late]")).toContainText("The consultation and trial would have been earlier");
  expect(await waText(page.locator("[data-wd-send]"))).toContain("Colour: Saturday 28 November 2026.");
  await srv.close();
});

test("before and after is client only: the consent date shows, and the demo has none", async ({ page }) => {
  let srv = await start(demo);
  await page.goto(srv.base + "/look-book");
  await expect(page.locator("#pairs")).toHaveCount(0);
  await srv.close();
  srv = await start(client);
  await page.route(SHEET, (r) => r.fulfill({ status: 200, contentType: "text/csv", body: "stylist,next free,updated\nines,2026-10-22,2026-10-19\n" }));
  await page.goto(srv.base + "/look-book");
  await expect(page.locator(".hr-pr-one[data-ba-ready]")).toHaveCount(1);
  await expect(page.locator("#pairs figcaption")).toContainText("Shown with consent, 12 October 2026");
  await srv.close();
});

test("chairs free today: the demo's slots after now, each with who, the price from and a message", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const ch = page.locator("#chairs");
  await expect(ch.locator("[data-ch-list] li")).toHaveCount(3);
  await expect(ch.locator("[data-ch-list] li").first()).toContainText("11:30");
  await expect(ch.locator("[data-ch-list] li").first()).toContainText("Blow-dry with Rae · from £");
  await expect(ch.locator("[data-ch-none]")).toBeHidden();
  expect(await waText(ch.locator("[data-ch-list] li a").first())).toContain("I'd like the 11:30 blow-dry with Rae today, if it's still free.");
  await srv.close();
});

test("chairs free today on a client: only today's rows, never from the future, and nothing when every row is old", async ({ page }) => {
  const srv = await start(client);
  let body = "service,time,stylist,updated\nblow-dry,12:00,ines,2026-10-19 09:00\nblow-dry,13:00,rae,2026-10-18 17:00\nblow-dry,14:00,rae,2026-10-19 11:00\nblow-dry,10:00,ines,2026-10-19 09:00\n";
  await page.route(SHEET, (r) => r.fulfill({ status: 200, contentType: "text/csv", body: "stylist,next free,updated\n" }));
  await page.route(CHAIRS, (r) => r.fulfill({ status: 200, contentType: "text/csv", body }));
  await page.goto(srv.base + "/");
  const ch = page.locator("#chairs");
  await expect(ch.locator("[data-ch-list] li")).toHaveCount(1);
  await expect(ch.locator("[data-ch-list] li")).toContainText("12:00");
  body = "service,time,stylist,updated\nblow-dry,12:00,ines,2026-10-18 09:00\n";
  await page.reload();
  await expect(ch.locator("[data-ch-none]")).toBeVisible();
  await expect(ch.locator("[data-ch-list] li")).toHaveCount(0);
  await srv.close();
});

test("the stylists through their work, and the blow-dry pass on the services page", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await expect(page.locator("#stylists .hr-st-work img")).toHaveCount(4);
  await expect(page.locator("#pass")).toHaveCount(0);
  await page.goto(srv.base + "/services");
  const ps = page.locator("#pass");
  await expect(ps).toContainText("£220");
  await expect(ps.locator("a.hr-ps-buy")).toHaveAttribute("href", /^https:\/\/buy\.stripe\.com\//);
  await srv.close();
});

for (const [label, rows] of [["3 chairs (demo)", null], ["1 chair", "blow-dry,12:00,ines,2026-10-19 09:00\n"], ["0 chairs", ""]]) {
  test(`at 1280 × 720 with ${label}, chairs free today never covers a control or the hair, and its words are whole`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const srv = await start(rows === null ? demo : client);
    if (rows !== null) {
      await page.route(SHEET, (r) => r.fulfill({ status: 200, contentType: "text/csv", body: "stylist,next free,updated\n" }));
      await page.route(CHAIRS, (r) => r.fulfill({ status: 200, contentType: "text/csv", body: `service,time,stylist,updated\n${rows}` }));
    }
    await page.goto(srv.base + "/");
    await expect(page.locator("#chairs[data-ready]")).toHaveCount(1);
    await page.waitForTimeout(300);
    for (const len of ["long", "mid", "short"]) {
      await page.click(`[data-lp-len="${len}"]`);
      await page.waitForTimeout(600);
      const bad = await page.evaluate(() => {
        const band = /** @type {HTMLElement} */ (document.querySelector("#chairs")).getBoundingClientRect();
        const out = [];
        for (const el of document.querySelectorAll("#prices button, #prices .hr-lp-copy a, .hr-lp-tag, .hr-lp-line")) {
          const r = el.getBoundingClientRect();
          if (!r.width || el.closest("#chairs")) continue;
          if (r.bottom > band.top + 1) out.push(`${el.className} under the band`);
          if (el.matches("button, a")) { const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); if (top !== el && !el.contains(top)) out.push(`${el.textContent?.trim()} is covered`); }
        }
        for (const el of document.querySelectorAll("#chairs li, #chairs [data-ch-none]")) {
          const t = /** @type {HTMLElement} */ (el);
          if (t.hidden || !t.getClientRects().length) continue;
          const r = t.getBoundingClientRect();
          if (r.top >= band.top - 1 && r.bottom <= band.bottom + 1 && t.scrollWidth > t.clientWidth + 1) out.push("chairs words cut short");
        }
        return out;
      });
      expect(bad, len).toEqual([]);
    }
    await page.click("[data-lp-usual]");
    await expect(page.locator("[data-lp-usual]")).toHaveText("Kept as my usual");
    await srv.close();
  });
}

test("the phone home page stays about six screens long", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  expect(h / 844).toBeLessThanOrEqual(6.3);
  await srv.close();
  await ctx.close();
});

test("a client reads next free days from the salon's sheet, and shows nothing when it's old", async ({ page }) => {
  const srv = await start(client);
  let body = "stylist,next free,updated\nines,2026-10-22,2026-10-19\nrae,2026-10-10,2026-10-19\n";
  await page.route(SHEET, (r) => r.fulfill({ status: 200, contentType: "text/csv", body }));
  await page.goto(srv.base + "/");
  await expect(page.locator('[data-st-free="ines"]')).toHaveText("Next free Thursday");
  await expect(page.locator('[data-st-free="rae"]')).toHaveText(" "); // a day already past
  body = "stylist,next free,updated\nines,2026-10-22,2026-10-01\n";
  await page.reload();
  await expect(page.locator('[data-st-free="ines"]')).toHaveText(" ");
  await srv.close();
});

test("without JavaScript the photograph, the price and every texture's line still show", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await expect(page.locator(".hr-lp-plate")).toBeVisible();
  await expect(page.locator("[data-lp-price]")).toHaveText("£100");
  await expect(page.locator('[data-tx-d="braids"]')).toBeVisible();
  expect(await waText(page.locator("[data-lp-ask]"))).toBe("Hello Selwyn Orr, I'd like to book.");
  await srv.close();
  await ctx.close();
});
