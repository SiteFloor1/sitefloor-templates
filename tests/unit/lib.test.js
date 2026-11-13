import { test } from "node:test";
import assert from "node:assert/strict";
import { waUrl, normaliseUkNumber, isFictionalUkNumber } from "../../src/core/lib/whatsapp.js";
import { inlineMarkup, plainText, escapeHtml, gbp, monthYear, mapsSearchUrl } from "../../src/core/lib/text.js";
import { localBusinessJsonLd, safeJson, robotsTxt, shouldIndex, headersFile, sitemapXml, unlistedPages } from "../../src/core/lib/seo.js";
import { readFileSync } from "node:fs";

const client = JSON.parse(readFileSync(new URL("../fixtures/sites/test-barber-client/site.json", import.meta.url), "utf8"));
const demo = JSON.parse(readFileSync(new URL("../../sites/demos/barber/site.json", import.meta.url), "utf8"));

test("WhatsApp links encode the message and reject bad numbers", () => {
  assert.equal(waUrl("442079460456"), "https://wa.me/442079460456");
  assert.equal(waUrl("442079460456", "Hi & bye?\n• £20"), "https://wa.me/442079460456?text=Hi%20%26%20bye%3F%0A%E2%80%A2%20%C2%A320");
  assert.throws(() => waUrl("020 7946 0456"));
  assert.throws(() => waUrl("+442079460456"));
});

test("UK numbers normalise to E.164 digits", () => {
  assert.equal(normaliseUkNumber("020 7946 0456"), "442079460456");
  assert.equal(normaliseUkNumber("+44 (0)20 7946 0456".replace("(0)", "")), "442079460456");
  assert.equal(normaliseUkNumber("0044 20 7946 0456"), "442079460456");
  assert.equal(normaliseUkNumber("hello"), null);
  assert.equal(isFictionalUkNumber("447700900123"), true);
  assert.equal(isFictionalUkNumber("442079460456"), false);
});

test("headline markup escapes HTML and only allows *em* and | line breaks", () => {
  assert.equal(inlineMarkup("Sharp *fades.*|No rush."), "Sharp <em>fades.</em><br>No rush.");
  assert.equal(inlineMarkup('<script>alert(1)</script> *x*'), "&lt;script&gt;alert(1)&lt;/script&gt; <em>x</em>");
  assert.equal(plainText("Sharp *fades.*|No rush."), "Sharp fades. No rush.");
  assert.equal(escapeHtml(`"'&<>`), "&quot;&#39;&amp;&lt;&gt;");
  assert.equal(gbp(20), "£20");
  assert.equal(gbp(4.5), "£4.50");
});

test("LocalBusiness JSON-LD comes from the site's own config and has no self-serving ratings", () => {
  const data = localBusinessJsonLd(client);
  assert.equal(data["@type"], "BarberShop");
  assert.equal(data.name, "Northgate Barbers");
  assert.equal(data.telephone, "+442079460456");
  assert.equal(data.url, "https://northgate-barbers.example.co.uk/");
  assert.equal(data.address.postalCode, "TE1 1ST");
  assert.equal(data.openingHoursSpecification.length, 6); // Sunday closed
  assert.equal(data.aggregateRating, undefined);
  assert.equal(data.review, undefined);
  assert.ok(!JSON.stringify(data).includes("Fade District"));
});

test("inline JSON cannot break out of its script tag", () => {
  assert.ok(!safeJson({ x: "</script><script>alert(1)</script>" }).includes("</script>"));
});

test("only production builds of indexable client sites are indexable", () => {
  assert.equal(shouldIndex(client, "production"), true);
  assert.equal(shouldIndex(client, "preview"), false);
  assert.equal(shouldIndex(demo, "production"), false);
  assert.match(robotsTxt(demo, "production"), /Disallow: \//);
  assert.match(robotsTxt(client, "production"), /Sitemap: https:\/\/northgate-barbers\.example\.co\.uk\/sitemap\.xml/);
  assert.match(headersFile(client, "preview"), /X-Robots-Tag: noindex/);
  assert.doesNotMatch(headersFile(client, "production"), /X-Robots-Tag/);
});

test("CSP only allows Google Sheets when the chair board reads a sheet", () => {
  assert.match(headersFile(client, "production"), /connect-src 'self' https:\/\/docs\.google\.com/);
  assert.match(headersFile(demo, "preview"), /connect-src 'self';/);
});

test("sitemap lists absolute URLs on the site's own domain", () => {
  const xml = sitemapXml(client, ["/", "/team"], "2026-10-22");
  assert.match(xml, /<loc>https:\/\/northgate-barbers\.example\.co\.uk\/team<\/loc>/);
  assert.equal((xml.match(/<url>/g) ?? []).length, 2);
});

test("review dates and directions links are formatted for people", () => {
  assert.equal(monthYear("2026-10"), "October 2026");
  assert.equal(monthYear("2026-01-05"), "January 2026");
  assert.throws(() => monthYear("2 weeks ago"));
  assert.equal(mapsSearchUrl({ streetAddress: "12 Kirkgate", locality: "Leeds", postcode: "LS1 6BY" }),
    "https://www.google.com/maps/search/?api=1&query=12%20Kirkgate%2C%20Leeds%20LS1%206BY");
});

test("built pages with blank headings or title parts are caught", async () => {
  const { emptyText } = await import("../../scripts/lib/verify.js");
  assert.deepEqual(emptyText("<title>Team · Shop</title><h1>Hi <em>there</em></h1><h2>Ok</h2>"), []);
  assert.equal(emptyText("<title>Probe · </title>").length, 1);
  assert.equal(emptyText("<title>A</title><h1></h1><h2> <span></span> </h2>").length, 2);
});

test("HSTS doesn't force HTTPS on a client's other subdomains", () => {
  const h = headersFile(client, "production");
  assert.match(h, /Strict-Transport-Security: max-age=31536000\n/);
  assert.doesNotMatch(h, /includeSubDomains/);
});

test("a kit adds its own security-policy sources (kit.js → csp), and a sheet is allowed once however many the site reads", () => {
  const car = JSON.parse(readFileSync(new URL("../fixtures/sites/test-car-client/site.json", import.meta.url), "utf8"));
  const h = headersFile(car, "production");
  assert.equal(h.match(/https:\/\/docs\.google\.com/g)?.length, 1);
  assert.match(h, /connect-src [^;]*blob:/); // the 3D Showroom, from the car kit's own hook
  const barber = headersFile({ ...client, kit: "barber" }, "production");
  assert.doesNotMatch(barber, /wasm-unsafe-eval|frame-src/); // another kit's sources never leak in
});

test("unlisted pages: only the site's own unlisted features, with their collections, leave the sitemap", () => {
  const features = [
    { id: "neighbours-page", page: "neighbours", unlisted: true },
    { id: "meeting-room", page: "meeting", unlisted: true },
    { id: "gallery", page: "gallery" },
  ];
  const pages = ["index", "gallery", "meeting-notes", "neighbours-n5-rear", "neighbours"];
  assert.deepEqual(unlistedPages(pages, features, ["gallery", "neighbours-page"]), ["neighbours-n5-rear", "neighbours"]);
  assert.deepEqual(unlistedPages(pages, features, ["gallery", "neighbours-page", "meeting-room"]), ["meeting-notes", "neighbours-n5-rear", "neighbours"]);
  assert.deepEqual(unlistedPages(["meeting-notes"], features, []), [], "a custom page named meeting-notes stays listed on a site without that feature");
});
