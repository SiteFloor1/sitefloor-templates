// Letting kit and the Porter look, as a tenant and an owner use them: Fees in the header of every page and in the
// phone menu, the lift plate lighting the floors with free homes, a home's card with its deposits within the caps,
// council tax band and EPC and a viewing request, the 3D building loading only on tap, the residences schedule,
// the move-in sums, and every list failing closed when the sheet is stale or can't be read.
import { test, expect, site, start, watchErrors, featuresStarted } from "./helpers.js";

const demo = site("demos/letting");
const client = site("_fixtures/test-letting-client");
const waText = async (/** @type {import("@playwright/test").Locator} */ loc) => new URL((await loc.getAttribute("href")) ?? "").searchParams.get("text") ?? "";
const MON = new Date("2026-11-16T10:30:00Z"); // a Monday morning: the demo sheet was updated at 09:15
const HEAD = "ref,building,floor,name,status,rent_pcm,beds,baths,size_m2,available_from,council_tax,epc,furnished,parking,broadband,mobile,heating,outside,pets,notes,updated_at";
const sheet = (/** @type {string} */ at) => [HEAD,
  `P-11,park,1,Flat 1,available,1150,2,1,62,now,B,C,Unfurnished,,,,,,,,${at}`,
  `P-G1,park,G,Flat G1,let,,1,1,40,,,,,,,,,,,,${at}`].join("\n");

test("Fees sits in the header of every page and in the phone menu", async ({ page }) => {
  const srv = await start(demo);
  for (const path of ["/", "/residences.html", "/owners.html", "/fees.html", "/visit.html"]) {
    await page.goto(srv.base + path);
    await expect(page.locator(".pt-links a", { hasText: "Fees" })).toHaveAttribute("href", /fees/);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(srv.base + "/");
  await page.click(".burger");
  await expect(page.locator("#mnav a", { hasText: "Fees" })).toBeVisible();
  await expect(page.locator("#mnav a", { hasText: "Residences" })).toBeVisible();
  await srv.close();
});

test("the lift plate: floors with free homes are lit; a floor lists its homes; a home's card has what the law asks for", async ({ page }) => {
  const errors = watchErrors(page);
  const srv = await start(demo);
  await page.clock.setFixedTime(MON);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  await expect(page.locator("[data-lb-count]")).toHaveText("Five homes free now.");
  await expect(page.locator("[data-lb-updated]")).toHaveText("Updated 09:15 today");
  await expect(page.locator(".lb-home")).toHaveCount(5);
  await expect(page.locator("[data-lbd-floor='4']")).toBeDisabled(); // all let
  await expect(page.locator("[data-lbd-floor='G'] small")).toHaveText("Porter");
  await page.click("[data-lbd-floor='3']");
  await expect(page.locator("[data-lbd-floor='3']")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".lb-home")).toHaveText(["Flat 3A£6,250 a month"]);
  await page.click(".lb-home");
  const card = page.locator(".pt-card");
  await expect(card).toHaveClass(/on/);
  await expect(card.locator(".lb-c-rent")).toContainText("£6,250");
  // £6,250 a month is £75,000 a year: six weeks' deposit, one week's holding deposit, rounded down
  await expect(card.locator(".lb-c-a")).toHaveText("Holding deposit £1,442 · Deposit £8,653 (6 weeks) · Council tax G · EPC C");
  const text = await waText(card.locator(".lb-c-book"));
  expect(text).toContain("Flat 3A, St John's Wood (ref 3A), £6,250 a month.");
  await page.click(".lb-c-close");
  await expect(card).not.toHaveClass(/on/);
  expect(errors).toEqual([]);
  await srv.close();
});

test("a stale sheet lights nothing and lists nothing: the page says to call", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/#stale");
  await featuresStarted(page);
  await expect(page.locator("[data-lb-updated]")).toContainText("Our list is being updated. Call us on 020 7946 0418");
  await expect(page.locator(".lb-home")).toHaveCount(0);
  await expect(page.locator("[data-lb-count]")).toHaveText("");
  for (const f of ["1", "2", "3", "5", "6"]) await expect(page.locator(`[data-lbd-floor='${f}']`)).toBeDisabled();
  await page.goto(srv.base + "/residences.html#stale");
  await expect(page.locator(".lr-cell-home")).toHaveCount(0);
  await expect(page.locator("[data-lr-updated]")).toContainText("Our list is being updated");
  await srv.close();
});

test("the building in 3D: nothing loads before the tap; then it's labelled an illustration, or the photo stays", async ({ page }) => {
  const srv = await start(demo);
  const early = [];
  page.on("request", (r) => { if (/building-scene|three/.test(r.url())) early.push(r.url()); });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  expect(early, "no 3D code before the tap").toEqual([]);
  await page.click("[data-lbd-load]");
  await expect(page.locator(".pt-hero")).toHaveClass(/is-3d|no-3d/, { timeout: 30000 });
  if (await page.locator(".pt-hero.is-3d").count()) await expect(page.locator(".lbd-tag")).toBeVisible();
  else await expect(page.locator(".pt-view picture img")).toBeVisible();
  await srv.close();
});

test("residences: each building's free homes floor by floor; one building at a time on a phone", async ({ page }) => {
  const srv = await start(demo);
  await page.clock.setFixedTime(MON);
  await page.goto(srv.base + "/residences.html");
  await featuresStarted(page);
  await expect(page.locator("[data-lr-cell='sjw|6'] .lr-cell-home")).toContainText("£8,200");
  await expect(page.locator("[data-lr-cell='sjw|4']")).toHaveText("Let");
  await expect(page.locator("[data-lr-cell='sjw|G']")).toHaveText("Porter");
  await expect(page.locator(".lr-cell-home")).toHaveCount(5 + 6 + 3);
  await page.locator("[data-lr-cell='mar|4'] .lr-cell-home").click();
  await expect(page.locator(".lr-card")).toHaveClass(/on/);
  await expect(page.locator(".lr-card .lb-c-name")).toHaveText("Penthouse");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.click("[data-lr-pick='ken']");
  await expect(page.locator("td[data-lr-col='ken']").first()).toBeVisible();
  await expect(page.locator("td[data-lr-col='sjw']").first()).toBeHidden();
  await srv.close();
});

test("the fees page: every fee with VAT, the tenant's permitted payments, the move-in sums, the schemes and the GOV.UK source", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/fees.html");
  await featuresStarted(page);
  await expect(page.locator(".lf-table tbody tr").first()).toContainText("12% of a year's rent, once");
  await expect(page.locator(".lf-other")).toContainText("£180.00 each tenancy");
  await expect(page.locator("#tenant-fees")).toContainText("Up to £50 to change your tenancy");
  await expect(page.locator(".lf-src a")).toHaveAttribute("href", "https://www.gov.uk/guidance/fees-you-can-charge-as-part-of-a-tenancy");
  await page.locator("[data-lm-rent]").fill("1500");
  await expect(page.locator("[data-lm-total]")).toHaveText("£3,230"); // five weeks £1,730 + £1,500
  await page.locator("[data-lm-rent]").fill("9000");
  await expect(page.locator("[data-lm-total]")).toHaveText("Ask us");
  await expect(page.locator("#schemes")).toContainText("The Property Ombudsman, member 000000 (demo)");
  await expect(page.locator(".pt-foot-s")).toContainText("Client money protected by Propertymark, 000000 (demo)");
  await srv.close();
});

test("one rent, from both sides: the owner's side follows the service and the rent", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  await expect(page.locator("[data-ln-net]")).toHaveText("£5,125"); // fully managed, 18% of £6,250
  await page.click("[data-ln-svc='let']");
  await expect(page.locator("[data-ln-olabel]")).toHaveText("Then the rent goes to you");
  await page.locator("[data-ln-rent]").fill("2000");
  await expect(page.locator("[data-ln-keys]")).toHaveText("£4,307"); // £2,307 deposit + £2,000
  await srv.close();
});

test("client site: the agent's own sheet, and it fails closed when stale or unreachable", async ({ page }) => {
  const srv = await start(client);
  await page.clock.setFixedTime(MON);
  await page.route("https://docs.google.com/**", (r) => r.fulfill({ status: 200, contentType: "text/csv", body: sheet("2026-11-16 09:00") }));
  await page.goto(srv.base + "/");
  await featuresStarted(page);
  await expect(page.locator(".lb-home")).toHaveText(["Flat 1£1,150 a month"]);
  await expect(page.locator("[data-lbd-load]")).toHaveCount(0); // the 3D building is Signature only
  await page.unroute("https://docs.google.com/**");
  await page.route("https://docs.google.com/**", (r) => r.fulfill({ status: 200, contentType: "text/csv", body: sheet("2026-11-13 09:00") }));
  await page.reload();
  await featuresStarted(page);
  await expect(page.locator("[data-lb-updated]")).toContainText("Our list is being updated");
  await expect(page.locator(".lb-home")).toHaveCount(0);
  await page.unroute("https://docs.google.com/**");
  await page.route("https://docs.google.com/**", (r) => r.abort());
  await page.reload();
  await featuresStarted(page);
  await expect(page.locator(".lb-home")).toHaveCount(0);
  await page.goto(srv.base + "/fees.html");
  await expect(page.locator("#schemes a", { hasText: "Our certificate" })).toHaveAttribute("href", /cmp-certificate/);
  await srv.close();
});

test("report a repair: the gas line first; the form writes the WhatsApp message as you type", async ({ page }) => {
  const srv = await start(demo);
  await page.goto(srv.base + "/repairs.html");
  await featuresStarted(page);
  await expect(page.locator(".lp-gas a")).toHaveAttribute("href", "tel:0800111999");
  await page.locator("[data-lp-form] [name=home]").fill("Flat 3A");
  await page.locator("[data-lp-form] [name=what]").fill("The kitchen tap drips");
  await page.locator("[data-lp-form] input[value^='Yes']").check();
  const text = await waText(page.locator("[data-lp-send]"));
  expect(text).toBe("Hello Halvern, I'd like to report a repair.\nHome: Flat 3A\nWhat's wrong: The kitchen tap drips\nAccess: Yes, you may use your keys");
  await srv.close();
});
