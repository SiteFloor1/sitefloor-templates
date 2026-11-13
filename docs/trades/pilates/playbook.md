# Reformer Pilates studios: playbook

What to build for this trade (kit `pilates`). The ground rules and the steps for a new kit: [`docs/TRADE-PLAYBOOK.md`](../../TRADE-PLAYBOOK.md).

## Luxury reformer Pilates studio (new `pilates` kit, look `dune`, demo Ottoline) — built 30 Oct 2026
- Customer: someone deciding between studios on their phone, often new to the reformer. The site's job: show today's
  classes and places, get a first class booked, and sell the intro card.
- Demo brand **Ottoline** (fictional; searched, no Pilates studio uses it), Marylebone, six reformers. Design contract,
  references and comparisons: `sitefloor-internal/docs/design/pilates.md`. Handover: `sitefloor-internal/docs/HANDOVER-PILATES.md`.
- **Starter:** `timetable` (PIL-1: today in the hero, the week with Book on every class), `class-types` (PIL-2),
  `first-class` (PIL-4, moved down from Plus: static, answers the first question).
- **Plus:** `spaces-left` (PIL-3, the studio's Sheet, fails closed), `intro-card` (PIL-5, punched card, Stripe link),
  `your-week` (PIL-6, moved down: .ics), `class-finder`, `waitlist`, `gift-cards`, `classes-page`, `studio-gifts`.
- **Plus** also: `pack-calculator` (cheapest way to pay for how often you come; expiring packs counted honestly).
- **Signature:** showpieces `reformer-settings` (settings in the link, nothing stored), `class-passport` (by code from
  the Sheet, no names), `method-library` (a page per exercise); pages `class-pages`, `teacher-pages`, `private-page`
  (PIL-7), `retreats-page` (PIL-8, with a page per retreat), `prenatal-guide`, `private-hire`, `workshops`;
  `reformer-clip` (a real captioned clip, film only on tap; no 3D, no paid model).
- **Alternatives (not built):** class reminders (a WhatsApp nudge the studio sends from the Sheet); bring a friend (a
  duet card). Choose your reformer was dropped: classes are small and spot booking isn't how studios run.
- Honesty: Book opens the studio's booking app or WhatsApp; places only from a fresh sheet; prices only the studio's;
  pregnancy and injury wording points to the GP or midwife and the teacher, never a promise.
