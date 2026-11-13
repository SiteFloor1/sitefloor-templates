// Bakery kit (chocolatiers, dessert parlours, bakeries, cake makers) and the Cacao look, as a customer uses them: the
// menu and its filters, today's counter and the gelato wall from the sheet, open late, the box (and its gift link), the
// tasting flight, the flavour vote, collection, parties, celebration cakes and Payment Links. Times are UK (GMT after
// 25 October 2026).
import { test, expect, site, start, watchErrors } from "./helpers.js";

const demo = site("demos/dessert");
const client = site("_fixtures/test-bakery-client");
const SHEET = /docs\.google\.com\/spreadsheets/;
// Thursday 29 Oct 2026, 9:30pm: open until 11:30pm. Friday 30 Oct, 11:50pm: open until 1am.
const THU_NIGHT = new Date("2026-10-29T21:30:00Z");
const FRI_LATE = new Date("2026-10-30T23:50:00Z");
const waText = async (loc) => new URL(await loc.getAttribute("href")).searchParams.get("text") ?? "";
const csv = (...rows) => ["kind,item,status,note,updated_at", ...rows].join("\n");

test.describe("the menu", () => {
  test("filters by eggless, vegan and halal and hides allergens; says what it's showing", async ({ page }) => {
    const srv = await start(demo);
    const errors = watchErrors(page);
    await page.goto(srv.base + "/");
    const menu = page.locator("#desserts");
    const squares = menu.locator('[data-item="gold-squares"]');
    const bomb = menu.locator('[data-item="chocolate-bomb"]');
    const oat = menu.locator('[data-item="oat-hot-chocolate"]');
    await expect(squares).toContainText(/Contains[^]*Tree nuts/);
    await menu.locator('label:has(input[data-diet][value="eggless"])').click();
    await expect(bomb).toBeHidden();
    await expect(squares).toBeVisible();
    await expect(oat).toBeVisible(); // vegan counts as eggless
    await menu.locator(".bk-avoid summary").click();
    await menu.locator('label:has(input[data-avoid][value="nuts"])').click();
    await expect(squares).toBeHidden();
    await expect(menu.locator("[data-bk-count]")).toContainText(/^Showing \d+ of \d+$/);
    await expect(menu.locator(".bk-statement")).toContainText("Please tell us about any allergy when you order.");
    expect(errors).toEqual([]);
    await srv.close();
  });
  test("without JavaScript every item is listed and the filters stay out of the way", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    const srv = await start(demo);
    await page.goto(srv.base + "/desserts");
    await expect(page.locator(".bk-filters")).toBeHidden();
    await expect(page.locator('.mp-list [data-item]')).toHaveCount(await page.locator(".mp-table tbody tr").count());
    await srv.close(); await ctx.close();
  });
});

test.describe("today's counter, the gelato wall and open late", () => {
  test("the demo's counter thins out through the evening; the menu marks sold-out items; the wall says what's back tomorrow", async ({ page }) => {
    await page.clock.setFixedTime(THU_NIGHT);
    const srv = await start(demo);
    const errors = watchErrors(page);
    await page.goto(srv.base + "/");
    const counter = page.locator("#tonight");
    await expect(counter.locator('[data-item="cocoa-truffle"] [data-item-status]')).toHaveText("Only 3 left today");
    await expect(counter.locator('[data-item="blackberry-layer"] [data-item-status]')).toHaveText("Sold out today");
    await expect(page.locator('#desserts [data-item="blackberry-layer"]')).toHaveClass(/is-out/);
    await expect(page.locator('#gelato [data-flavour="raspberry-sorbet"] [data-gw-state]')).toHaveText("Back tomorrow");
    await expect(page.locator('#gelato [data-flavour="pistachio"] [data-gw-state]')).toHaveText("A few left");
    await expect(page.locator("#gelato [data-today]")).toHaveText("Thursday 29 October");
    await expect(page.locator("#late [data-ln-close]")).toHaveText("Open until 11:30pm tonight.");
    await expect(page.locator("#late [data-ln-seats]")).toContainText("A short queue for seats");
    expect(errors).toEqual([]);
    await srv.close();
  });

  test("a client's sheet: today's rows only; a stale 'a few left' goes quiet; an unreadable sheet says to ask", async ({ page }) => {
    await page.clock.setFixedTime(THU_NIGHT);
    const body = csv(
      "dessert,pistachio-kunafa,low,,2026-10-29 21:10",
      "dessert,strawberry-tart,low,,2026-10-29 18:00",
      "dessert,millefeuille,sold out,,2026-10-28 22:00",
      "seats,,plenty,,2026-10-29 21:25",
    );
    await page.route(SHEET, (r) => r.fulfill({ status: 200, contentType: "text/csv", body }));
    const srv = await start(client);
    await page.goto(srv.base + "/");
    await expect(page.locator('#tonight [data-item="pistachio-kunafa"] [data-item-status]')).toHaveText("A few left");
    await expect(page.locator('#tonight [data-item="strawberry-tart"] [data-item-status]')).toBeHidden();
    await expect(page.locator('#tonight [data-item="millefeuille"] [data-item-status]')).toBeHidden();
    await expect(page.locator("#late [data-ln-seats]")).toHaveText("Plenty of seats");
    await expect(page.locator("#tonight [data-bk-off]")).toBeHidden();
    await page.unroute(SHEET);
    await page.route(SHEET, (r) => r.abort());
    await page.reload();
    await expect(page.locator("#tonight [data-bk-off]")).toBeVisible();
    await expect(page.locator("#late [data-ln-seats]")).toBeHidden();
    await srv.close();
  });

  test("late on a Friday: last orders count down", async ({ page }) => {
    await page.clock.setFixedTime(FRI_LATE);
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await expect(page.locator("#late [data-ln-close]")).toHaveText("Open until 1am tonight.");
    await expect(page.locator("#late [data-ln-last]")).toHaveText("Last orders in 40 minutes, at 12:30am");
    await srv.close();
  });
});

test.describe("the box", () => {
  test("starts from the shop's suggestion, fills from today's counter, ties when full, and sends a gift with its link", async ({ page }) => {
    await page.clock.setFixedTime(THU_NIGHT);
    const srv = await start(demo);
    const errors = watchErrors(page);
    await page.goto(srv.base + "/");
    const box = page.locator("#box");
    await expect(box.locator("[data-bx-count]")).toHaveText("3 of 6");
    await expect(box.locator("[data-bx-price]")).toHaveText("£12");
    // The passion fruit sold out at 9pm, so it can't go in.
    await expect(box.locator('[data-bx-add="passion-fruit"]')).toBeDisabled();
    await expect(box.locator("[data-bx-tie]")).toBeDisabled();
    for (let i = 0; i < 3; i++) await box.locator('[data-bx-add="dark-70"]').click();
    await expect(box.locator("[data-bx-count]")).toHaveText("A box of 6, full");
    await expect(box.locator("[data-bx-allergens]")).toHaveText("Contains Milk, Tree nuts, Soya.");
    await box.locator("[data-bx-tie]").click();
    await expect(box.locator("[data-bx-card]")).toBeFocused();
    await box.locator("[data-bx-card]").fill("Happy birthday");
    await box.locator('label:has([data-bx-gift])').click();
    await box.locator("[data-bx-to]").fill("Sam");
    await box.locator("[data-bx-from]").fill("Jo");
    const text = await waText(box.locator("[data-bx-send]"));
    for (const s of ["a box of 6 as a gift", "3 × Dark 70%", "Price on your site: £12", 'Card: "Happy birthday"', "For Sam, from Jo. They'll collect it.", "Collection: Thursday 29 October, 10pm"]) expect(text, text).toContain(s);
    const share = await waText(box.locator("[data-bx-share]"));
    const link = share.split("\n").pop() ?? "";
    expect(link).toContain("/gift#g=");
    expect(share).toContain("Thursday 29 October, 10pm");
    expect(share).not.toContain("Today");
    // Taking a piece out unties it; a bigger box keeps what's in.
    await box.locator("[data-bx-untie]").click();
    await box.locator("[data-bx-slot='5']").click();
    await expect(box.locator("[data-bx-count]")).toHaveText("5 of 6");
    await box.locator('label:has(input[name="bx-size"][value="12"])').click();
    await expect(box.locator("[data-bx-count]")).toHaveText("5 of 12");
    await expect(box.locator("[data-bx-price]")).toHaveText("£22");
    // Whoever it's for opens the link and sees the box, the card and when to collect.
    await page.goto(link);
    const gift = page.locator("[data-bx-gift]");
    await expect(gift.locator("[data-gift-h]")).toHaveText("Sam, a box for you");
    await expect(gift.locator("[data-gift-card]")).toHaveText("“Happy birthday”");
    await expect(gift.locator("[data-gift-from]")).toHaveText("From Jo");
    await expect(gift.locator(".bx-place.is-full")).toHaveCount(6);
    await page.goto(srv.base + "/gift#g=not-a-box");
    await page.reload(); // only the hash changed
    await expect(page.locator("[data-gift-bad]")).toBeVisible();
    expect(errors).toEqual([]);
    await srv.close();
  });
});

test.describe("the tasting flight", () => {
  test("five pieces, put in tasting order whatever order they're picked; sold-out pieces can't be picked", async ({ page }) => {
    await page.clock.setFixedTime(THU_NIGHT);
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    const tf = page.locator("#flight");
    await expect(tf.locator('[data-tf="passion-fruit"]')).toBeDisabled();
    await expect(tf.locator("[data-tf-send]")).toHaveAttribute("aria-disabled", "true");
    for (const id of ["dark-70", "coffee-caramel", "white-vanilla", "gianduja", "raspberry"]) await tf.locator(`[data-tf="${id}"]`).click();
    await expect(tf.locator("[data-tf-count]")).toHaveText("Your flight, in tasting order");
    await expect(tf.locator(".tf-step").first()).toContainText("White vanilla");
    await expect(tf.locator(".tf-step").last()).toContainText("Dark 70%");
    await expect(tf.locator('[data-tf="salted-caramel"]')).toHaveAttribute("aria-disabled", "");
    await expect(tf.locator("[data-tf-send]")).not.toHaveAttribute("aria-disabled", "true");
    const text = await waText(tf.locator("[data-tf-send]"));
    for (const s of ["a tasting flight of 5", "1. White vanilla", "2. Raspberry", "5. Dark 70%", "Price on your site: £9"]) expect(text, text).toContain(s);
    await tf.locator("[data-tf-clear]").click();
    await expect(tf.locator("[data-tf-count]")).toHaveText("Choose 5 more");
    await srv.close();
  });
});

test.describe("the flavour vote", () => {
  test("shows this week's shares, votes through the shop's Form, and remembers the vote", async ({ page }) => {
    await page.clock.setFixedTime(THU_NIGHT);
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    const fv = page.locator("#vote");
    await expect(fv.locator("[data-fv-total]")).toHaveText(/^\d+ votes so far this week\.$/);
    const pcs = await fv.locator("[data-fv-pc]").allTextContents();
    expect(pcs.reduce((n, p) => n + parseInt(p, 10), 0)).toBe(100);
    const go = fv.locator('[data-fv="pistachio"] [data-fv-go]');
    const href = new URL(await go.getAttribute("href") ?? "");
    expect(href.searchParams.get("entry.1000001")).toBe("Pistachio");
    await page.evaluate(() => document.addEventListener("click", (e) => e.preventDefault(), true)); // stay here instead of opening the Form
    await go.click();
    await expect(fv.locator("[data-fv-card]")).toBeVisible();
    await expect(fv.locator("[data-fv-mine]")).toHaveText("Pistachio");
    expect(await waText(fv.locator("[data-fv-send]"))).toContain("My vote: Pistachio.");
    await page.reload();
    await expect(page.locator("#vote [data-fv-mine]")).toHaveText("Pistachio");
    await srv.close();
  });
});

test.describe("collection, parties, cakes and payment", () => {
  test("a collection request: items, a time within tonight's hours, the total and allergens", async ({ page }) => {
    await page.clock.setFixedTime(THU_NIGHT);
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    const co = page.locator("#collect");
    await co.getByRole("button", { name: "One more Gianduja layer" }).click();
    await co.getByRole("button", { name: "One more Gianduja layer" }).click();
    await co.getByRole("button", { name: "One more Hot chocolate" }).click();
    await expect(co.locator("[data-co-total]")).toHaveText("£19.80");
    await expect(co.locator("[data-co-day]")).toHaveValue("2026-10-29");
    await expect(co.locator("[data-co-time] option").first()).toHaveText("10pm");
    const text = await waText(co.locator("[data-co-send]"));
    expect(text).toContain("2 × Gianduja layer");
    expect(text).toContain("Collection: Today, 10pm");
    expect(text).toContain("Tree nuts");
    await srv.close();
  });

  test("the party calculator serves everyone from the shop's own sizes", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/parties");
    await page.locator("[data-pa-guests]").evaluate((el) => { el.value = "50"; el.dispatchEvent(new Event("input", { bubbles: true })); });
    await expect(page.locator("[data-pa-n]")).toHaveText("50");
    const first = page.locator(".pa-plan").first();
    await expect(first).toContainText("serves");
    expect(await waText(page.locator("[data-pa-send]"))).toContain("a party for 50 guests");
    await srv.close();
  });

  test("a client's cake page: earliest day, a priced request, and a reminder for next year", async ({ page }) => {
    await page.clock.setFixedTime(THU_NIGHT);
    await page.route(SHEET, (r) => r.fulfill({ status: 200, contentType: "text/csv", body: csv("cakes,2026-11-02,full,,2026-10-28 09:00") }));
    const srv = await start(client);
    await page.goto(srv.base + "/cakes");
    await expect(page.locator("[data-cc-soon]")).toHaveText("The earliest we can make one now: Tuesday 3 November.");
    await page.locator('[data-cc="stack"]').selectOption("one-6");
    await expect(page.locator("[data-cc-price]")).toHaveText("£60");
    await page.locator('[data-cc="message"]').fill("Happy 7th, Leo");
    await expect(page.locator('[data-cc="day"]')).toHaveValue("2026-11-03");
    const text = await waText(page.locator("[data-cc-send]"));
    expect(text, text).toContain("Collection: Tuesday 3 November");
    expect(text).toContain('Message: "Happy 7th, Leo"');
    const download = page.waitForEvent("download");
    await page.locator("[data-cc-remind]").click();
    expect((await download).suggestedFilename()).toBe("cake-reminder.ics");
    await expect(page.locator('a[data-pay="cake-deposit"]')).toHaveAttribute("href", "https://buy.stripe.com/test_cake20");
    await srv.close();
  });

  test("on the demo a Payment Link says no payment is taken instead of leaving the site", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    const pay = page.locator('#pay a[data-pay="box-12"]');
    await expect(pay).toHaveAttribute("href", /^https:\/\/buy\.stripe\.com\/demo-/);
    await pay.click();
    await expect(page.locator("#pay [data-pay-demo]")).toContainText("Demo site: no payment taken");
    expect(page.url()).toBe(srv.base + "/");
    await srv.close();
  });
});

test.describe("the new counter tools", () => {
  test("from the kitchen, and a take-home tub of no more flavours than it holds, never one that's off today", async ({ page }) => {
    await page.clock.setFixedTime(THU_NIGHT);
    const srv = await start(demo);
    const errors = watchErrors(page);
    await page.goto(srv.base + "/");
    await expect(page.locator("#gelato [data-kl-note]")).toContainText("Tomorrow's gianduja cooling");
    const gt = page.locator("#tubs");
    await expect(gt.locator('[data-gt="raspberry-sorbet"]')).toBeDisabled();
    await gt.locator('label:has(input[name="gt-size"][value="litre"])').click();
    for (const id of ["pistachio", "caramel", "lime-sorbet", "strawberry"]) await gt.locator(`[data-gt="${id}"]`).click();
    await expect(gt.locator('[data-gt="strawberry"]')).toHaveAttribute("aria-pressed", "false");
    await expect(gt.locator("[data-gt-price]")).toHaveText("£16");
    const text = await waText(gt.locator("[data-gt-send]"));
    for (const s of ["a Litre tub to take home", "Pistachio\nCaramel\nLime", "Price on your site: £16"]) expect(text, text).toContain(s);
    expect(errors).toEqual([]);
    await srv.close();
  });

  test("posting: the next send day from the cut-off, and the total with posting", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-29T09:30:00Z"));
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    const pb = page.locator("#post");
    await expect(pb.locator("[data-pb-when]")).toHaveText("Order by 12pm today, usually with them Friday.");
    await pb.locator('label:has(input[name="pb-box"][value="1"])').click();
    await expect(pb.locator("[data-pb-total]")).toHaveText("£26.95");
    await pb.locator("[data-pb-to]").fill("Sam");
    await pb.locator("[data-pb-addr]").fill("1 High Street\nLeeds");
    const text = await waText(pb.locator("[data-pb-send]"));
    await page.clock.setFixedTime(new Date("2026-12-23T10:00:00Z"));
    await page.reload();
    await expect(page.locator("#post [data-pb-when]")).toHaveText("Order by 12pm Thursday, usually with them Tuesday.");
    for (const s of ["a box of twelve posted", "For: Sam", "Address: 1 High Street, Leeds", "£26.95 with posting", "usually with them Friday 30 October"]) expect(text, text).toContain(s);
    await srv.close();
  });

  test("a box a month pays through the shop's own monthly Stripe link", async ({ page }) => {
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await expect(page.locator('#box-month a[data-pay="box-month"]')).toHaveText("Start the box a month");
    await expect(page.locator('#pay a[data-pay="box-month"]')).toHaveAttribute("aria-label", "Pay £24 a month: A box a month");
    await srv.close();
  });
});

test.describe("favours and your seal", () => {
  test("the price per box falls at the shop's numbers; the seal is redrawn with their initials; Plus has no seal", async ({ page }) => {
    await page.clock.setFixedTime(THU_NIGHT);
    const srv = await start(demo);
    const errors = watchErrors(page);
    await page.goto(srv.base + "/");
    const fv = page.locator("#favours");
    await fv.locator("[data-fv-n]").fill("120");
    await fv.locator("[data-fv-n]").dispatchEvent("change");
    await expect(fv.locator("[data-fv-per]")).toHaveText("120 boxes at £4");
    await expect(fv.locator("[data-fv-total]")).toHaveText("£480");
    await expect(fv.locator("[data-fv-break]")).toHaveText("From 250 boxes, £3.50 a box.");
    await expect(fv.locator("[data-fv-day]")).toHaveValue("2026-11-12");
    await fv.locator("[data-fv-a]").fill("a");
    await fv.locator("[data-fv-b]").fill("s");
    await fv.locator("[data-fv-line]").fill("Amira & Sam · 14 June 2027");
    await expect(fv.locator("[data-fv-seal] .seal-m1")).toHaveText("A");
    await expect(fv.locator("[data-fv-seal] textPath")).toHaveText("AMIRA & SAM · 14 JUNE 2027 · VELVET SPOON ·");
    expect(await waText(fv.locator("[data-fv-send]"))).toContain('Our seal: A & S, "AMIRA & SAM · 14 JUNE 2027" around it');
    await page.locator('[data-demo-ribbon] [data-tier-pick="plus"]').click();
    await expect(fv.locator(".fv-sealf")).toBeHidden();
    await expect(fv.locator("[data-fv-seal] .seal-m1")).toHaveText("V");
    expect(await waText(fv.locator("[data-fv-send]"))).not.toContain("Our seal");
    expect(errors).toEqual([]);
    await srv.close();
  });
});

test.describe("the advent box", () => {
  test("a preview before December that remembers what's open; in December, only up to today", async ({ page }) => {
    await page.clock.setFixedTime(THU_NIGHT);
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    const av = page.locator("#advent");
    await expect(av.locator("[data-av-state]")).toHaveText("Every window opens before December, so you can see inside.");
    await av.locator('[data-av="17"]').click();
    await expect(av.locator('[data-av="17"]')).toHaveClass(/is-open/);
    await expect(av.locator("[data-av-picked]")).toContainText("Window 17:");
    await page.reload();
    await expect(page.locator('#advent [data-av="17"]')).toHaveClass(/is-open/);
    await page.clock.setFixedTime(new Date("2026-12-09T10:00:00Z"));
    await page.reload();
    await expect(page.locator("#advent [data-av-state]")).toHaveText("It's the 9th: windows 1 to 9 open.");
    await expect(page.locator('#advent [data-av="17"]')).not.toHaveClass(/is-open/);
    await expect(page.locator('#advent [data-av="9"]')).toHaveClass(/is-today/);
    await page.locator('#advent [data-av="10"]').click();
    await expect(page.locator("#advent [data-av-picked]")).toHaveText("Window 10 opens on the 10th of December.");
    await srv.close();
  });

  test("without JavaScript the windows are plain items showing what's behind them, with nothing to press", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    const srv = await start(demo);
    await page.goto(srv.base + "/");
    await expect(page.locator("#advent button")).toHaveCount(0);
    await expect(page.locator("#advent .av-in img")).toHaveCount(24);
    await expect(page.locator("#advent .av-front").first()).toBeHidden();
    await expect(page.locator('#advent [data-av-state]')).toBeHidden();
    await srv.close(); await ctx.close();
  });
});
