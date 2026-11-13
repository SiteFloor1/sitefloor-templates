# Maintenance reminders (DET7)

| | |
|---|---|
| Feature id | `maintenance` |
| Plan | plus |
| Config | `maintenance`: `message` (WhatsApp, to book a wash), `plans`: `[{ id, name, every (weeks), text, price? (a visit), monthly?, payLink? }]`, `count?` (reminders, default 12); `sections.maintenance` |
| Files | `maintenance.njk`, `.css`, `.js`; the calendar file in `src/kits/detailing/lib/dates.js` (`maintenanceIcs`) |

## How it works
The studio's plans as a list. Choose one and the day you collect: the visits go into the phone's calendar as one
repeating entry (every `every` weeks, `count` times, 9am the studio's time). It's a reminder, not a booking: "Book a
wash" opens WhatsApp with the studio's message. Prices show only when the studio gives one.

## Paying monthly
A plan with `monthly` (whole pounds a month) and `payLink` (the studio's own Stripe Payment Link, set up in Stripe as
a monthly subscription) shows "Join monthly", which opens that link. Sitefloor holds no payment details and takes no
cut; Stripe sends the studio its receipts and cancellations. Demo sites must use a test-mode link
(`https://buy.stripe.com/test_…`), which shows a note instead of opening; client sites need the live link.
