# Nail, lash and beauty salons: playbook

What to build for this trade (kit `nails`). The ground rules and the steps for a new kit: [`docs/TRADE-PLAYBOOK.md`](../../TRADE-PLAYBOOK.md).

## The plan (from the original trade list)

6. NAIL, LASH AND BEAUTY. Demo: fictional
   Customers ask: Can I see your work for my style? Who's best for acrylics, BIAB or nail
   art? How long does it take and last? Removals? Patch test? Deposit and cancellation?
   Free slots this week?
   Core: Our work filtered by style hashtags (#chrome, #french, #almond, #russianlashes);
   prices with times; policies; questions.
   Plus: team with specialities; aftercare page; a free-slots grid from a Sheet.
   SIGNATURE, "Try it on":
   - nails: a drawn hand where they pick shape (almond, coffin, square), length, finish
     (gloss, chrome, French) and colour;
   - lashes: a drawn eye where they pick a style map (natural, cat eye, doll, wispy);
   - both give the price, time and "book this look";
   - an infill and patch-test timer: "Your infill is due by 14 Nov" saved as a calendar
     file for the customer.
   Extras: deposit by Payment Link; loyalty card.

## Nail salon (new kit `nails`, branch `trade/nail-salon`) — built 29 Oct 2026
- Owner's feel: a beauty counter at a grand hotel; precise, glossy, colour as the jewel. References: Townhouse, the Ritz
  Paris Nail Bar, Guerlain 68 Champs-Élysées. Demo **Verrall** (fictional; searched, no salon uses it), Marylebone.
  Directions, the approved Counter screen and every review round: `sitefloor-internal/docs/design/nail-salon.md`.
- Built: kit `nails`, look `quail`, demo `sites/demos/nail-salon`, fixture `tests/fixtures/sites/test-nails-client`.
- **Starter:** `shade-hand` (the hand in the hero; a swatch fades to the salon's photo of the same hand in that shade;
  the card and every Book follow the shade), `next-slot` (the salon's Sheet: `next_free, updated_at`), `menu-hours`,
  `gel-biab`, `salon` (the colour wall and a counter detail).
- **Plus:** `nail-menu` (menu page with policies), `shades-page`, `art-page`, `shapes-page`, `monthly-edit` (hides two
  weeks after its month), `nail-bridal`, `nail-gifts` (vouchers), `infill-reminder` (.ics), `usual-set` (phone only).
- **Signature:** `shade-on-hand` (any shade laid into the nails from a hand-drawn mask, light kept, three skin tones),
  `build-set`, `nail-bridal-timeline` (.ics), `party-booking`, `finish-clips` (real macro clips on tap).
- **Alternatives (not built):** hold it to your outfit (colours read on the phone, three nearest shades); a shade wall
  at true scale for the retail shelf; a seasonal shade calendar; a "first BIAB" explainer (week 1, week 3, the infill).
- **Setting up a client:** photograph one hand (the client's) in 3–5 house shades in one light for Starter/Plus; for
  Signature, 2–3 hands in different skin tones and a mask drawn for each (`sitefloor-internal/docs/design/verrall-photos/build.py`);
  every shade's hex matched to the bottle in daylight; the menu's times and prices; the Sheet for the next slot;
  finish clips the salon films itself (5–8 s, silent). Running cost £0.
