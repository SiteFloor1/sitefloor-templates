// Checks every built site (demos and client fixtures). When shared code
// changes, these run against every kit, so a change that breaks one site fails here.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { test, expect, testedSites, start, pathOf, watchErrors, OPEN_TIME } from "./helpers.js";
import { DEMO_MARKERS } from "../../scripts/lib/verify.js";

for (const s of testedSites()) {
  test.describe(`${s.label} (${s.mode}, ${s.plan})`, () => {
    let srv;
    test.beforeAll(async () => { srv = await start(s); });
    test.afterAll(async () => { await srv.close(); });

    // Layout shift on phones while fonts arrive and the live status fills in. Google's "good" limit is 0.1.
    for (const width of [360, 390, 412]) {
      for (const [when, at] of [["open", OPEN_TIME], ["closed", new Date("2026-10-19T21:30:00Z")]]) {
        test(`home page doesn't jump on a ${width}px phone (${when})`, async ({ browser }) => {
          const ctx = await browser.newContext({ viewport: { width, height: 800 } });
          const p = await ctx.newPage();
          await p.clock.setFixedTime(at);
          await p.route(/\.woff2$/, async (r) => { await new Promise((x) => setTimeout(x, 800)); await r.continue(); });
          await p.addInitScript(() => {
            window.__cls = 0; window.__shifts = [];
            new PerformanceObserver((l) => {
              for (const e of l.getEntries()) {
                if (e.hadRecentInput) continue;
                window.__cls += e.value;
                // What moved, so a failure says where to look.
                window.__shifts.push(`${e.value.toFixed(3)} @${Math.round(e.startTime)}ms: ` + e.sources.map((s) => `${s.node?.nodeName ?? "?"}.${String(s.node?.className ?? "").slice(0, 40)} y${Math.round(s.previousRect.y)}→${Math.round(s.currentRect.y)} h${Math.round(s.previousRect.height)}→${Math.round(s.currentRect.height)}`).join(" | "));
              }
            }).observe({ type: "layout-shift", buffered: true });
          });
          await p.goto(srv.base + "/");
          await p.waitForTimeout(1600);
          const { cls, shifts } = await p.evaluate(() => ({ cls: window.__cls, shifts: window.__shifts }));
          expect(cls, shifts.join("\n")).toBeLessThan(0.1);
          await ctx.close();
        });
      }
    }

    for (const page of s.pages) {
      test(`${pathOf(page)} renders, has correct SEO tags and no errors`, async ({ page: p }) => {
        const errors = watchErrors(p);
        const res = await p.goto(srv.base + pathOf(page));
        expect(res?.status()).toBe(200);
        await expect(p.locator("h1")).toHaveCount(1);
        expect(await p.title()).toContain(s.name);
        await expect(p.locator('meta[name="description"]')).toHaveAttribute("content", /.{20,}/);
        await expect(p.locator('link[rel="canonical"]')).toHaveAttribute("href", `${s.url}${pathOf(page)}`);
        await expect(p.locator('meta[property="og:url"]')).toHaveAttribute("content", `${s.url}${pathOf(page)}`);
        const robots = p.locator('meta[name="robots"]');
        if (s.indexable && !s.unlisted?.includes(page)) await expect(robots).toHaveCount(0);
        else await expect(robots).toHaveAttribute("content", "noindex, nofollow");
        await p.waitForTimeout(300);
        expect(errors).toEqual([]);
      });
    }

    test("every WhatsApp link goes to this business's number with an encoded message", async ({ page: p }) => {
      let total = 0;
      for (const page of s.pages) {
        await p.goto(srv.base + pathOf(page));
        const hrefs = await p.locator('a[href^="https://wa.me/"]').evaluateAll((as) => as.map((a) => a.getAttribute("href")));
        total += hrefs.length;
        for (const h of hrefs) {
          const u = new URL(h);
          expect(u.pathname).toBe(`/${s.whatsapp}`);
          expect(u.searchParams.get("text")?.length ?? 0).toBeGreaterThan(5);
        }
      }
      expect(total).toBeGreaterThan(0); // every site offers WhatsApp somewhere, even when bookings go to an app
    });

    test("the booking buttons a customer sees work, on desktop and on a phone", async ({ browser }) => {
      const expectBooking = (href) => {
        if (s.booking.provider === "whatsapp") {
          const u = new URL(href);
          expect(u.origin + u.pathname).toBe(`https://wa.me/${s.whatsapp}`);
          expect(u.searchParams.get("text")?.length ?? 0).toBeGreaterThan(5);
        } else if (s.booking.provider === "phone") expect(href).toBe(`tel:${s.phone.replace(/\s/g, "")}`);
        else expect(href).toBe(s.booking.url);
      };
      const desktop = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      for (const pg of [desktop, phone]) await pg.clock.setFixedTime(OPEN_TIME); // pages made here bypass the fixture
      // Each look words and places its own actions (CLAUDE.md rule 4), so they're found by where they go, not their words.
      const bookLink = s.booking.provider === "whatsapp" ? `a[href^="https://wa.me/${s.whatsapp}"]`
        : s.booking.provider === "phone" ? 'a[href^="tel:"]' : `a[href="${s.booking.url}"]`;
      for (const page of s.pages) {
        await desktop.goto(srv.base + pathOf(page));
        const book = desktop.locator(`header ${bookLink}`).filter({ visible: true }).first();
        await expect(book, `a booking link in the header on ${pathOf(page)}`).toBeVisible();
        expectBooking(await book.getAttribute("href"));

        await phone.goto(srv.base + pathOf(page));
        const wa = phone.locator(`.mbar ${bookLink}`).filter({ visible: true }).first();
        await expect(wa, `a booking link in the phone bar on ${pathOf(page)}`).toBeVisible();
        expectBooking(await wa.getAttribute("href"));
        for (const call of await phone.locator('.mbar a[href^="tel:"]').all()) expect(await call.getAttribute("href")).toBe(`tel:${s.phone.replace(/\s/g, "")}`);
      }
      await desktop.close();
      await phone.close();
    });

    test("404 page is not presented as a real page; favicon and privacy page are there", async ({ page: p }) => {
      const res = await p.goto(srv.base + "/no-such-page");
      expect(res.status()).toBe(404);
      await expect(p.locator('link[rel="canonical"]')).toHaveCount(0);
      const icon = await p.locator('link[rel="icon"]').getAttribute("href");
      expect((await p.request.get(new URL(icon, srv.base).href)).status()).toBe(200);
      await p.goto(srv.base + "/");
      await expect(p.locator("footer").getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
      expect(s.pages).toContain("privacy");
    });

    test("each review shows its own star rating or none, never a made-up five", async ({ page: p }) => {
      const src = s.label.startsWith("_fixtures/") ? `tests/fixtures/sites/${s.label.slice(10)}` : `sites/${s.label}`;
      const site = JSON.parse(readFileSync(path.join(src, "site.json"), "utf8"));
      test.skip(!site.features.includes("reviews"), "no reviews on this site");
      // Reviews are on the home page unless the look moves them to a page of their own (e.g. the bridal kit's brides page).
      let found = false;
      for (const page of s.pages) {
        await p.goto(srv.base + pathOf(page));
        if (await p.locator("#reviews").count()) { found = true; break; }
      }
      expect(found, "the reviews appear on some page").toBe(true);
      const cards = p.locator("#reviews figure");
      await expect(cards).toHaveCount(site.reviews.items.length);
      for (const [i, r] of site.reviews.items.entries()) {
        const stars = cards.nth(i).locator(".st");
        if (!(await stars.count())) { // a look may quote reviews without stars; then no rating may appear at all
          expect(await cards.nth(i).textContent()).not.toMatch(/[★☆]/);
          continue;
        }
        await expect(stars.locator(".sr-only")).toHaveText(`Rated ${r.rating} out of 5`);
        const shown = await stars.locator('[aria-hidden="true"]').textContent();
        expect([...shown].filter((c) => c === "★").length, `review ${i + 1}`).toBe(r.rating);
        expect([...shown].filter((c) => c === "☆").length).toBe(5 - r.rating);
      }
    });

    test("JSON-LD on the home page describes this business", async ({ page: p }) => {
      await p.goto(srv.base + "/");
      const data = JSON.parse(await p.locator('script[type="application/ld+json"]').textContent());
      expect(data.name).toBe(s.name);
      expect(data.telephone).toBe(s.phone.replace(/\s/g, ""));
      expect(data.url).toBe(`${s.url}/`);
      expect(data.aggregateRating).toBeUndefined();
    });

    test("robots.txt, sitemap and _headers match the indexing decision", async () => {
      const robots = readFileSync(path.join(s.outDir, "robots.txt"), "utf8");
      const headers = readFileSync(path.join(s.outDir, "_headers"), "utf8");
      expect(headers).toContain("Content-Security-Policy:");
      if (s.indexable) {
        expect(robots).toContain(`Sitemap: ${s.url}/sitemap.xml`);
        const xml = readFileSync(path.join(s.outDir, "sitemap.xml"), "utf8");
        for (const page of s.pages) {
          if (s.unlisted?.includes(page)) expect(xml).not.toContain(`<loc>${s.url}${pathOf(page)}</loc>`); // a private page, reached by the studio's link
          else expect(xml).toContain(`<loc>${s.url}${pathOf(page)}</loc>`);
        }
        expect(headers).not.toContain("X-Robots-Tag");
      } else {
        expect(robots).toContain("Disallow: /");
        expect(existsSync(path.join(s.outDir, "sitemap.xml"))).toBe(false);
        expect(headers).toContain("X-Robots-Tag: noindex");
      }
    });

    if (s.mode === "client") {
      test("client build contains no demo-only content", async ({ page: p }) => {
        for (const page of s.pages) {
          await p.goto(srv.base + pathOf(page));
          const html = await p.content();
          for (const m of DEMO_MARKERS) expect(html, `${page} contains ${m}`).not.toContain(m);
          expect(html).not.toContain("Fade District");
        }
        const assets = path.join(s.outDir, "assets");
        for (const f of readdirSync(assets).filter((n) => n.endsWith(".js"))) {
          const js = readFileSync(path.join(assets, f), "utf8");
          expect(js, "demo plan switcher bundled into a client site").not.toContain("sitefloor-demo-plan");
          expect(js, "demo WhatsApp preview bundled into a client site").not.toContain("data-wa-preview");
        }
      });
    }

    test("unknown URLs return the 404 page", async ({ page: p }) => {
      const res = await p.goto(`${srv.base}/does-not-exist`);
      expect(res?.status()).toBe(404);
      await expect(p.locator("h1")).toContainText("isn't here");
    });

    test("phone layout: no sideways scroll, menu opens and closes with the keyboard", async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: 360, height: 760 }, hasTouch: true, isMobile: true });
      const p = await ctx.newPage();
      await p.clock.setFixedTime(OPEN_TIME); // made outside the fixture, so pin the time here too
      for (const page of s.pages) {
        await p.goto(srv.base + pathOf(page));
        const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${page} scrolls sideways`).toBeLessThanOrEqual(0);
      }
      await p.goto(srv.base + "/");
      const burger = p.locator(".burger");
      await burger.focus();
      await p.keyboard.press("Enter");
      await expect(p.locator("#mnav")).toBeVisible();
      await expect(burger).toHaveAttribute("aria-expanded", "true");
      await p.keyboard.press("Escape");
      await expect(p.locator("#mnav")).toBeHidden();
      await expect(burger).toBeFocused();
      for (const call of await p.locator('.mbar a[href^="tel:"]').all()) await expect(call).toHaveAttribute("href", `tel:${s.phone.replace(/\s/g, "")}`);
      await ctx.close();
    });

    test("skip link moves focus to the main content", async ({ page: p }) => {
      await p.goto(srv.base + "/");
      await p.keyboard.press("Tab");
      await expect(p.locator(".skip")).toBeFocused();
      await p.keyboard.press("Enter");
      await expect(p).toHaveURL(/#main$/);
    });
  });
}
