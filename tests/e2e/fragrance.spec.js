// Fragrance kit and the Verrière look, as a client uses them: the bottle turned by hand, the notes across the bottle
// naming the other scents, sizes and Buy, the engraving desk drawing the words on the glass, the organ, the discovery
// set, the gift order, Let them choose, and launch mode on a new house's site (the client fixture, before its day).
import { test, expect, site, start } from "./helpers.js";

const demo = site("demos/verriere");
const client = site("_fixtures/test-fragrance-client");
const waText = async (loc) => new URL(await loc.getAttribute("href")).searchParams.get("text") ?? "";

test("the bottle turns as it's dragged and with the arrow keys, and nothing turns by itself", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const turn = page.locator(".fr-turn");
  await expect(turn).toHaveAttribute("aria-valuenow", "1");
  await page.waitForTimeout(1500);
  await expect(turn).toHaveAttribute("aria-valuenow", "1");
  const box = await turn.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 64, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(turn).not.toHaveAttribute("aria-valuenow", "1");
  await expect(turn.locator("img")).not.toHaveAttribute("src", /d-01\.webp/);
  await turn.focus();
  await page.keyboard.press("Home");
  await expect(turn).toHaveAttribute("aria-valuenow", "1");
  await page.keyboard.press("ArrowLeft");
  await expect(turn).toHaveAttribute("aria-valuenow", "36");
  await expect(turn.locator("img")).toHaveAttribute("src", /d-18\.webp/); // the back is the front again
  await srv.close();
});

test("the notes read as one sentence across the bottle, and a tapped note names the other scents", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const notes = page.locator(".fr-notes");
  await expect(notes).toContainText("It opens on bergamot and sea salt,");
  await expect(notes).toContainText("and dries down to cedarwood and white musk.");
  await notes.getByRole("button", { name: "iris" }).click();
  await expect(notes).toContainText("Iris is also in No. 2 Poudre and No. 7 Pluie.");
  await notes.getByRole("button", { name: "ambrette" }).click();
  await expect(notes).toContainText("Ambrette is only in this one.");
  await expect(notes).not.toContainText("Iris is also in");
  await srv.close();
});

test("choosing a size changes Buy; on the demo the order goes to WhatsApp in the house's words", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const hero = page.locator(".vr-buy");
  await expect(hero.locator("[data-buy]")).toHaveText("Buy, £95");
  await hero.getByRole("radio", { name: "100 ml" }).check();
  await expect(hero.locator("[data-buy]")).toHaveText("Buy, £140");
  expect(await waText(hero.locator("[data-buy]"))).toBe("Hello Verrière, I'd like No. 4 Sable, 100 ml (£140).");
  await expect(page.locator("#library .fr-size-p").first()).toContainText("per 10 ml");
  await srv.close();
});

test("the engraving desk draws the words on the glass in the chosen style, within the house's limit", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  const desk = page.locator("#engraving");
  await desk.getByLabel(/Your words/).fill("Ada Lovelace");
  await expect(desk.locator("[data-engr]")).toHaveText("ADA LOVELACE");
  await desk.getByRole("radio", { name: "Initials" }).check();
  await expect(desk.locator("[data-engr]")).toHaveText("A.L.");
  await expect(desk.locator(".fr-desk-cap")).toHaveText("Preview");
  await expect(desk.getByLabel(/Your words/)).toHaveAttribute("maxlength", "24");
  await expect(desk.locator("[data-desk-go]")).toHaveText("Order with engraving, £110");
  expect(await waText(desk.locator("[data-desk-go]"))).toBe("Hello Verrière, I'd like No. 4 Sable, 50 ml, engraved \"A.L.\" in initials on the glass (£110).");
  await srv.close();
});

test("the organ: chosen ingredients turn to colour and the scents that have them rise", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/scent-finder.html");
  await page.getByRole("button", { name: /Iris/ }).click();
  await page.getByRole("button", { name: /Sea salt/ }).click();
  await expect(page.locator(".fr-org-say")).toHaveText("3 fragrances have them, most first.");
  await expect(page.locator("[data-scent-row]:visible .fr-org-n")).toHaveText(["No. 4 Sable", "No. 7 Pluie", "No. 2 Poudre"]);
  await page.getByRole("button", { name: /Fig/ }).click();
  await page.getByRole("button", { name: /Rose/ }).click(); // a fourth is not taken
  await expect(page.getByRole("button", { name: /Rose/ })).toHaveAttribute("aria-pressed", "false");
  await srv.close();
});

test("the discovery set fills as it's chosen and sends the choice", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/discovery-sets.html");
  for (const n of ["No. 4 Sable", "No. 2 Poudre", "No. 6 Ombre", "No. 1 Lin"]) await page.locator(".fr-disc-o", { hasText: n }).click();
  await expect(page.locator("[data-disc-count]")).toHaveText("Your 4, ready");
  await expect(page.locator(".fr-disc-o", { hasText: "No. 3 Verger" }).locator("input")).toBeDisabled();
  expect(await waText(page.locator("[data-disc-go]"))).toBe("Hello Verrière, I'd like a discovery set (£16): No. 4 Sable, No. 2 Poudre, No. 6 Ombre and No. 1 Lin.");
  await srv.close();
});

test("a gift adds up from the house's prices; Let them choose sends the amount and the names", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/gifts.html");
  await page.getByLabel("The fragrance", { exact: true }).selectOption("ombre");
  await page.getByLabel(/Engraving, if you'd like it/).fill("For J");
  await page.getByRole("checkbox", { name: /Wrapped in our paper/ }).check();
  await expect(page.locator("[data-gift-sum]")).toHaveText("No. 6 Ombre, 50 ml, engraved, wrapped: £130");
  const choose = page.locator("#choose");
  await choose.getByRole("radio", { name: "£150" }).check();
  await choose.getByLabel("For").fill("Sam");
  await choose.getByLabel("From").fill("Alex");
  await expect(choose.locator("[data-give-go]")).toHaveText("Give £150");
  expect(await waText(choose.locator("[data-give-go]"))).toBe("Hello Verrière, I'd like to give £150 to Sam, from Alex. Please post the samples and the card.");
  await srv.close();
});

test("the demo shows the page before launch on request; a new house's site is before its day by itself", async ({ page }) => {
  let srv = await start(demo);
  await page.goto(srv.base + "/");
  await expect(page.locator(".vr-hero [data-buy]")).toBeVisible();
  await page.getByRole("button", { name: "before launch" }).click();
  await expect(page.locator(".vr-hero .fr-wait")).toBeVisible();
  await expect(page.locator("#scent-sable [data-buy]")).toBeHidden(); // the library follows the switch too
  await expect(page.locator("#scent-poudre [data-buy]")).toBeVisible();
  await expect(page.locator(".vr-hero [data-buy]")).toBeHidden();
  await srv.close();
  srv = await start(client);
  await page.goto(srv.base + "/");
  await expect(page.locator(".vr-hero .vr-line:visible")).toContainText("Out on 1 February");
  await expect(page.locator(".vr-hero .fr-wait a").first()).toHaveAttribute("href", "https://forms.gle/testAmbryWaitlist");
  await expect(page.locator(".vr-hero .fr-wait a").nth(1)).toHaveAttribute("href", "https://buy.stripe.com/test_preone");
  await expect(page.getByRole("button", { name: "before launch" })).toHaveCount(0);
  // Before the day no launch scent can be bought anywhere: no live size or sample link shows, on the home page or the fragrances page.
  for (const path of ["/", "/fragrances.html"]) {
    await page.goto(srv.base + path);
    await expect(page.locator('a[href*="buy.stripe.com/test_one"]:visible, a[href*="buy.stripe.com/test_two"]:visible, a[href*="buy.stripe.com/test_three"]:visible')).toHaveCount(0);
    await expect(page.locator("#scent-one .fr-before-only.fr-go")).toHaveAttribute("href", "https://buy.stripe.com/test_preone");
    await expect(page.locator("#scent-two .fr-before-only.fr-go")).toHaveText("Tell me on the day");
  }
  await expect(page.locator("text=Fictional business")).toHaveCount(0);
  await srv.close();
});

test("before a launch, the discovery set and gifts leave out the launch scents; on the day they come back", async ({ page }) => {
  const srv = await start(client); // all three of this house's scents are launch scents, out on 1 Feb 2099
  await page.goto(srv.base + "/discovery-sets.html");
  await expect(page.locator(".fr-disc-o:visible")).toHaveCount(0);
  await expect(page.locator("[data-disc-go]")).toBeHidden();
  await expect(page.locator('a[href*="buy.stripe.com"]:visible')).toHaveCount(0);
  await expect(page.locator(".fr-disc-side .fr-before-only.fr-go")).toHaveText("Tell me on the day");
  await page.goto(srv.base + "/gifts.html");
  await expect(page.locator("[data-gift-form]")).toBeHidden();
  await expect(page.locator(".fr-gift-wait")).toContainText("Gifts open on 1 February");
  await page.clock.setFixedTime(new Date("2099-02-01T09:00:00Z"));
  await page.goto(srv.base + "/discovery-sets.html");
  await expect(page.locator(".fr-disc-o:visible")).toHaveCount(3);
  await expect(page.locator("[data-disc-go]")).toHaveAttribute("href", "https://buy.stripe.com/test_set");
  await page.goto(srv.base + "/gifts.html");
  await expect(page.locator("[data-gift-form]")).toBeVisible();
  await expect(page.locator("#gift-scent option:enabled")).toHaveCount(3);
  await expect(page.locator("#gift-scent")).toHaveValue("one"); // a scent is chosen, matching the order message
  await srv.close();
});

