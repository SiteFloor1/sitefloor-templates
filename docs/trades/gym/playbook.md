# Gyms and health clubs: playbook

What to build for this trade (kit `gym`). The ground rules and the steps for a new kit: [`docs/TRADE-PLAYBOOK.md`](../../TRADE-PLAYBOOK.md).

## Premium members' training club (new `gym` kit, look `chalk`, demo Halde) — design round 1, 16 Nov 2026

- Customer: someone who already trains, comparing a premium club with the one they're in; often a Hyrox entrant.
  The site's job: show it's the right kind of room (polished, never a budget chain), answer price and contract
  honestly, show tonight's classes, and get a free day pass booked.
- Demo brand **Halde** (fictional; a web check found no UK gym using it, confirm at Companies House before
  publishing), Ancoats, Manchester. Feeling: Third Space and Equinox polish, Heimat's calm, Hyrox's energy.
- Features map to the approved codes GYM-1 to GYM-9 and the 15 approved pages in `docs/VISION.md`.

### Tiers (to confirm with the design)
- **Starter:** GYM-1 timetable, GYM-2 tiers and prices with the first-year total (the easy lower-tier feature),
  GYM-3 usually busy times.
- **Plus:** GYM-4 class finder, GYM-5 trial pass request, GYM-6 facilities tour; "Your first week" (below).
- **Signature:** GYM-7 spaces left, GYM-8 Hyrox race-prep planner, GYM-9 members' events; the live count on the hero.

### Showpieces (discussed, not agreed)
- **How busy now, honest (the round-1 hero).** The "usually" bars are easy and always true (the club's own averages
  by hour). The live number is only possible if the club's door system exports a count to a Sheet, or staff update
  one; it must show its age and fall back to "usually" after 15 minutes. Worth it: no UK club's homepage shows this.
- **Spaces left (GYM-7).** The riskiest feature for honesty: most clubs book in Mindbody, Glofox or TeamUp, and a
  Sheet copy goes stale. Build it to show spaces only from a fresh sheet with its time; otherwise "Book in the app".
- **Hyrox race-prep planner (GYM-8).** The strongest Signature showpiece on its own page: pure date arithmetic from
  the race date and the club's own class types, saved as .ics. No medical or result promises.
- **"Your first week" (new, Plus).** From a goal and the real timetable, three sessions picked for the visitor's
  free hours. Easy, and it sells the day pass.
- **Membership calculator: the true first-year total.** Right, and also the law (no drip pricing); give it to
  Starter as part of GYM-2 rather than a separate showpiece.
- **Alternatives to pitch:** a recovery booking strip (sauna and plunge slots, same spaces logic); a bring-a-friend
  pass on WhatsApp; corporate rate by company (the club's list, no lookup service).
