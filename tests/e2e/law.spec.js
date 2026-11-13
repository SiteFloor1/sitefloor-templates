// Law kit and the Portland look, as a client uses them: the home page with the SRA badge under the call to action,
// Speak to a partner by practice, conflict-safe first contact (only who is involved goes in the email), the
// first-meeting pack from its link and its calendar file, the succession map stepped a generation at a time and
// labelled an illustration, the prices and complaints pages the SRA requires, and the phone bar never covering text.
import { test, expect, site, start, watchErrors } from "./helpers.js";

// Reduced motion: no smooth scrolling or fades, so clicks never wait on an element that is still moving.
test.use({ reducedMotion: "reduce" });

const demo = site("demos/law");
const client = site("_fixtures/test-law-client");

test("the home page: the carved sentence, the badge under the call to action, practice, arrival, partner, regulation", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const ids = await page.$$eval("main > section", (all) => all.map((x) => x.id || x.className));
  expect(ids).toEqual(["hero pt-hero", "practice", "arrival", "enquiry", "regulation", "visit"]);
  const cta = page.locator(".pt-hero .pt-cta");
  const badge = page.locator(".pt-hero .lw-badge");
  await expect(badge).toContainText("Authorised and regulated by the Solicitors Regulation Authority");
  expect((await badge.boundingBox()).y).toBeGreaterThan((await cta.boundingBox()).y);
  await expect(page.locator(".lw-index-n")).toHaveCount(6);
  await expect(page.locator("#regulation")).toContainText("000000 (demo)");
  await srv.close();
});

test("a client's live SRA badge loads from the SRA's supplier, the only frame the page allows", async ({ page }) => {
  const srv = await start(client);
  await page.route("https://cdn.yoshki.com/**", (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<p>badge</p>" }));
  await page.goto(srv.base + "/");
  await expect(page.locator(".pt-hero .lw-badge iframe")).toHaveAttribute("src", "https://cdn.yoshki.com/iframe/99999r.html");
  const csp = (await page.request.get(srv.base + "/")).headers()["content-security-policy"] ?? "";
  expect(csp).toContain("frame-src https://cdn.yoshki.com");
  await srv.close();
});

test("Speak to a partner shows the partner who leads the chosen practice", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/#enquiry");
  const visible = page.locator(".lw-enq-card").filter({ visible: true });
  await expect(visible).toHaveCount(1);
  await expect(visible).toContainText("Hugo Ashdown");
  await page.selectOption("#enq-area", "family");
  await expect(visible).toContainText("Eleanor Pryce");
  await expect(visible.locator('a[href^="mailto:eleanor.pryce@"]')).toBeVisible();
  await srv.close();
});

test("conflict-safe first contact writes an email with only who is involved", async ({ page }) => {
  const srv = await start(demo);
  const errors = watchErrors(page);
  await page.goto(srv.base + "/contact");
  await page.click("#fc-form button[type=submit]");
  await expect(page.locator("#fc-err")).toHaveText("Please add your name.");
  await page.fill("#fc-name", "Anna Lee");
  await page.fill("#fc-reach", "anna@example.com");
  await page.selectOption("#fc-area", "Family");
  await page.fill("#fc-parties", "Jo Bloggs\nBloggs Holdings Ltd");
  await page.click("#fc-form button[type=submit]");
  await expect(page.locator("#fc-done")).toBeVisible();
  const msg = await page.locator("#fc-msg").textContent();
  expect(msg).toContain("- Jo Bloggs");
  expect(msg).toContain("please check you can act for me");
  const href = await page.locator("#fc-open").getAttribute("href");
  expect(href).toMatch(/^mailto:firstcontact@calderwyke\.example\?subject=First%20contact%3A%20Family&body=/);
  expect(errors).toEqual([]);
  await srv.close();
});

test("the first-meeting pack opens from its link, shows only what it names and offers a calendar file", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/meeting");
  await expect(page.locator("#mp-card")).toBeHidden();
  await page.click("[data-mp-example]");
  await expect(page.locator("#mp-card")).toBeVisible();
  await expect(page.locator("[data-mp-when]")).toHaveText("Tuesday 20 October 2026, 10:30, for 60 minutes"); // the next weekday after the test clock
  await expect(page.locator("[data-mp-past]")).toBeHidden();
  await expect(page.locator("[data-mp-person]").filter({ visible: true })).toHaveCount(1);
  await expect(page.locator("[data-mp-item]").filter({ visible: true })).toHaveCount(3);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  const download = page.waitForEvent("download");
  await page.click("[data-mp-ics]");
  expect((await download).suggestedFilename()).toBe("meeting-2026-10-20.ics");
  await page.clock.setFixedTime(new Date("2026-11-20T09:30:00Z"));
  await page.goto(srv.base + "/meeting#eyJ2IjoxLCJkIjoiMjAyNi0xMS0xMiIsInQiOiIxMDozMCIsIm0iOjYwLCJwIjoiaHVnby1hc2hkb3duIiwiZSI6ImZyb250IiwiYiI6WyJwaG90by1pZCIsIndpbGwiLCJhc3NldHMiXSwibiI6IkFubmEifQ");
  await expect(page.locator("[data-mp-past]")).toBeVisible();
  await expect(page.locator("[data-mp-ics]")).toBeHidden();
  await page.goto(srv.base + "/meeting#garbage");
  await expect(page.locator("[data-mp-why]")).toContainText("This link doesn't open a meeting");
  await srv.close();
});

test("the firm's link maker writes a pack link that opens", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/meeting#make");
  await page.fill("#mk-d", "2026-12-03");
  await page.fill("#mk-t", "15:00");
  await page.selectOption("#mk-p", "eleanor-pryce");
  await page.check('[data-mk-bring][value="photo-id"]');
  await page.click("#mp-make button[type=submit]");
  const link = await page.locator("#mk-link").inputValue();
  await page.goto(link);
  await expect(page.locator("[data-mp-when]")).toHaveText("Thursday 3 December 2026, 15:00, for 60 minutes");
  await expect(page.locator("[data-mp-person]").filter({ visible: true })).toContainText("Eleanor Pryce");
  await srv.close();
});

test("the succession map is labelled an illustration and steps a generation at a time", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/succession");
  await expect(page.locator(".lw-sm-note")).toContainText("An illustration only, not advice");
  const sc = page.locator("[data-sm=with-trust]");
  await expect(sc.locator(".lw-sm-flow.is-later"), "start").toHaveCount(4, { timeout: 3000 });
  await sc.locator("[data-sm-next]").click();
  await expect(sc.locator(".lw-sm-flow.is-later")).toHaveCount(2);
  await sc.locator("[data-sm-next]").click();
  await expect(sc.locator("[data-sm-next]")).toBeDisabled();
  await page.click("[data-sm-tab=without-trust]");
  await expect(page.locator("[data-sm=without-trust]")).toBeVisible();
  await expect(sc).toBeHidden();
  await srv.close();
});

test("the SRA's pages: prices with and without VAT, and how and when to go to the Ombudsman", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/pricing");
  await expect(page.locator("#probate .lw-svc-price")).toHaveText("From £3,500 to £9,000 (£4,200 to £10,800 with VAT)");
  await expect(page.locator(".lw-pricing-vat")).toContainText("Demo figures");
  await page.goto(srv.base + "/complaints");
  await expect(page.locator("main")).toContainText("8 weeks");
  await expect(page.locator("main")).toContainText("within six months of our final response");
  await expect(page.locator("main")).toContainText("0300 555 0333");
  await srv.close();
});

test("on a phone the bar never covers the last of the page", async ({ browser }) => {
  const srv = await start(demo);
  const p = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await p.goto(srv.base + "/");
  await p.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await p.waitForFunction(() => Math.abs(window.scrollY + window.innerHeight - document.documentElement.scrollHeight) < 2);
  const bar = await p.locator(".mbar").boundingBox();
  const credit = await p.locator("footer .by").boundingBox();
  expect(credit.y + credit.height).toBeLessThanOrEqual(bar.y + 1);
  await p.close();
  await srv.close();
});

test("without JavaScript every partner and every step still shows", async ({ browser }) => {
  const srv = await start(demo);
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const p = await ctx.newPage();
  await p.goto(srv.base + "/");
  await expect(p.locator(".lw-enq-card").filter({ visible: true })).toHaveCount(6);
  await p.goto(srv.base + "/contact");
  await expect(p.locator(".lw-fc-plain")).toBeVisible();
  await p.goto(srv.base + "/succession");
  await expect(p.locator("[data-sm=without-trust]")).toBeVisible();
  await ctx.close();
  await srv.close();
});

test("the practice page: a photograph per area, honest facts, the matter step by step and the will reminder", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/practice");
  await expect(page.locator(".lw-pp-fig")).toHaveCount(6);
  await expect(page.locator("#private-wealth .lw-pp-facts")).toContainText("£3,500 to £9,000 before VAT");
  const steps = page.locator("#steps-probate");
  await expect(steps.locator(".lw-ms-p").filter({ visible: true })).toContainText("First meeting");
  await steps.locator("[data-ms='2']").click();
  await expect(steps.locator(".lw-ms-p").filter({ visible: true })).toContainText("Tax and probate");
  await page.locator("#private-wealth [data-wr-ev][value=married]").check();
  await expect(page.locator("#private-wealth [data-wr-yes] a")).toHaveAttribute("href", /^mailto:hugo\.ashdown@/);
  await srv.close();
});

test("insights and guides are a photographed reading room", async ({ page }) => {
  const srv = await start(demo);
  for (const p of ["/insights", "/guides"]) {
    await page.goto(srv.base + p);
    await expect(page.locator(".lw-lead-fig img")).toHaveCount(1);
    await expect(page.locator(".lw-card-fig img")).toHaveCount(5);
  }
  await page.goto(srv.base + "/digital-assets");
  await expect(page.locator(".lw-art-fig img")).toBeVisible();
  await srv.close();
});

test("the probate estimator never leaves the published range and shows VAT", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/pricing#estimate");
  const est = page.locator("#estimate");
  await expect(est.locator("[data-est-fee]")).toHaveText("£3,500");
  await est.getByText("More than one", { exact: true }).click();
  await est.getByText("More than fifteen", { exact: true }).click();
  await est.getByText("Yes, or not sure", { exact: true }).click();
  await est.getByText("More than ten", { exact: true }).click();
  await expect(est.locator("[data-est-fee]")).toHaveText("£6,250 to £9,000");
  await expect(est.locator("[data-est-vat]")).toHaveText("£7,500 to £10,800 with VAT at 20%");
  await srv.close();
});

test("if there's no will: a typical family to start, and the answer follows the rules", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/succession#no-will");
  const out = page.locator("[data-int-shares]");
  await expect(out).toContainText("the first £322,000 and half");
  await page.getByText("A husband, wife or civil partner").click();
  await page.getByText("Children", { exact: true }).click();
  await page.getByText("A partner you are not married to").click();
  await expect(out).toContainText("The Crown");
  await expect(page.locator("[data-int-notes]")).toContainText("unmarried partner inherits nothing");
  await page.getByText("A parent", { exact: true }).click();
  await expect(out).toContainText("Your parents");
  await srv.close();
});

test("the house, room by room", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/house");
  await expect(page.locator(".lw-ht-fig.is-on")).toHaveAttribute("data-ht-fig", "front");
  await page.getByRole("tab", { name: /The drawing room/ }).click();
  await expect(page.locator(".lw-ht-fig.is-on")).toHaveAttribute("data-ht-fig", "drawing");
  await page.keyboard.press("ArrowDown");
  await expect(page.locator(".lw-ht-fig.is-on")).toHaveAttribute("data-ht-fig", "reading");
  await srv.close();
});

test("the help pages: words, when someone has died, what to gather", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/words");
  await page.fill("#gl-find", "probate");
  await expect(page.locator("[data-term]").filter({ visible: true })).toHaveCount(1);
  await page.goto(srv.base + "/when-someone-dies");
  await page.fill("#bv-start", "2026-11-02");
  await page.locator("#bv-start").dispatchEvent("change");
  await expect(page.locator("[data-bv-step=register] [data-bv-when]")).toHaveText("Suggested reminder: Tuesday 3 November 2026");
  const dl = page.waitForEvent("download");
  await page.click("#bv-ics");
  expect((await dl).suggestedFilename()).toBe("reminders.ics");
  await page.goto(srv.base + "/gather");
  await page.locator("[data-ga=will] input").first().check();
  await page.reload();
  await expect(page.locator("[data-ga=will] input").first()).toBeChecked();
  await page.click("[data-ga-tab=buying]");
  await expect(page.locator("[data-ga=buying]")).toBeVisible();
  await expect(page.locator("[data-ga=will]")).toBeHidden();
  await srv.close();
});

test("our day in yours converts the firm's hours", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/#enquiry");
  await page.selectOption("#yh-zone", "Asia/Hong_Kong");
  await expect(page.locator("[data-yh-day='1'] [data-yh-time]")).toHaveText("16:00–01:00 (next day)"); // the test clock is in October, British Summer Time
  await srv.close();
});

test("your matter, by code: the example opens at its stage; a wrong code says to call", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/your-matter");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  await page.click("[data-mc-try]");
  await expect(page.locator("[data-mc-stage].now")).toContainText("Tax and probate");
  await page.fill("#mc-code", "ZZZZ9999");
  await page.click("#mc-form button[type=submit]");
  await expect(page.locator("#mc-off")).toContainText("We can't find that code");
  await srv.close();
});
