import { test } from "node:test";
import assert from "node:assert/strict";
import { bookingHref, bookingLabel, checkBooking } from "../../src/core/lib/booking.js";

const contact = { whatsapp: "442079460456", phone: "+44 20 7946 0456" };

test("book buttons go to WhatsApp by default, with the message", () => {
  assert.equal(bookingHref(undefined, contact, "Hi there"), "https://wa.me/442079460456?text=Hi%20there");
  assert.equal(bookingLabel(undefined), "Book on WhatsApp");
});

test("Booksy, Fresha, other and phone go where the shop takes bookings", () => {
  const booksy = { provider: "booksy", url: "https://booksy.com/en-gb/123_shop" };
  assert.equal(bookingHref(booksy, contact, "ignored"), booksy.url);
  assert.equal(bookingLabel(booksy), "Book on Booksy");
  assert.equal(bookingLabel({ provider: "fresha", url: "https://www.fresha.com/a/x" }), "Book on Fresha");
  assert.equal(bookingLabel({ provider: "other", url: "https://www.treatwell.co.uk/x", name: "Treatwell" }), "Book on Treatwell");
  assert.equal(bookingHref({ provider: "phone" }, contact, "x"), "tel:+442079460456");
  assert.equal(bookingLabel({ provider: "phone" }), "Call to book");
});

test("booking settings are checked: provider, https, the provider's own domain, a name for other", () => {
  assert.deepEqual(checkBooking(undefined), []);
  assert.deepEqual(checkBooking({ provider: "booksy", url: "https://booksy.com/en-gb/1_x" }), []);
  assert.match(checkBooking({ provider: "calendly" })[0], /^booking\.provider/);
  assert.match(checkBooking({ provider: "booksy", url: "https://evil.example/booksy.com" })[0], /must be a Booksy link/);
  assert.match(checkBooking({ provider: "fresha", url: "http://www.fresha.com/x" })[0], /https/);
  assert.match(checkBooking({ provider: "booksy" })[0], /booking\.url/);
  assert.match(checkBooking({ provider: "other", url: "https://x.co.uk/b" })[0], /booking\.name/);
  assert.match(checkBooking({ provider: "whatsapp", url: "https://wa.me/1" })[0], /not used/);
});
