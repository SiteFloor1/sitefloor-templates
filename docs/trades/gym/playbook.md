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
- **Starter:** GYM-1 timetable with "Book in the app" on every class, GYM-2 tiers with lawful total prices (the
  easy lower-tier feature), GYM-3 usually busy times.
- **Plus:** GYM-4 class finder, GYM-5 trial pass request, GYM-6 facilities tour; "Your first week" (below).
- **Signature:** GYM-7 spaces left (only for gyms that keep a sheet), GYM-8 Hyrox race-prep planner, GYM-9 members'
  events; the live count on the hero.

### Prices (required before any price is designed; checked 16 Nov 2026)
The DMCC Act 2024 requires an invitation to purchase to show the total price, including every fee the customer must
pay. Rules for every gym site, on every page and in the hero:
- **Every headline price includes every mandatory fee:** joining, admin, compulsory induction or key fob. The CMA
  names "joining fees that new members pay on top of their first regular payment" as mandatory (CMA209, para 4.4).
  Calling a fee "extra" or showing it separately doesn't make it optional (para 4.3).
- **No split prices.** "£129 a month + £30 joining fee" is partitioned pricing, which is generally prohibited
  (para 3.21). The total comes first; a breakdown may sit underneath it.
- **Contract memberships (default):** lead with the total over the minimum term, joining fee in ("£1,578 for 12
  months, joining fee included"), with the monthly payment beside it. The CMA's Gold's Gym notice (29 Sep 2026)
  also accepts a total monthly price with the commitment period stated prominently, but the term total is the safer
  default.
- **Rolling memberships (no minimum term):** the first month's total, joining fee in, at the same prominence as the
  monthly price after it ("£159 the first month, joining fee included, then £129 a month").
- **"From" prices** only if a real person can buy at that price; say what it gets (off-peak, one club). Never a
  "from" built on a rare or restricted option (paras 3.2, 3.5, 4.19).
- **Optional extras** (towel service, locker, personal training) stay out of the total but are shown where they are
  offered (paras 4.19, 5.8 to 5.9).
- **Kit check:** each tier in `site.json` lists its mandatory fees; the build works out the totals and fails if a
  tier has a price but no `mandatoryFees` field (empty list allowed, it must be stated). Totals are never typed by hand.

Sources (checked 16 Nov 2026):
- CMA209, *Unfair commercial practices: price transparency*, 18 Nov 2025:
  https://assets.publishing.service.gov.uk/media/691b10065a253e2c40d705d9/Price_transparency_-_CMA209_.pdf
- CMA207, *Unfair commercial practices guidance*: https://www.gov.uk/government/publications/unfair-commercial-practices-cma207
- CMA, Gold's Gym (UK) Limited final infringement notice, 29 Sep 2026: joining fee left out of early prices,
  £45,000 penalty after settlement and refunds of joining fees:
  https://assets.publishing.service.gov.uk/media/6ace3abbb8542d3693fd4403/___Final_Infringement_Notice__.pdf
Re-check CMA209 for revisions before the first real gym client goes live.

### Booking and spaces left
- **Default, every plan:** each class shows "Book in the app", a deep link to the gym's own booking app (Mindbody,
  Glofox, TeamUp or similar): the class's page if the app has one, else the timetable page. Set per gym in `site.json`.
- **Spaces left (GYM-7), Signature, only for gyms that keep a sheet:** counts come from the gym's Sheet and show
  their age ("updated 3 minutes ago"). Same staleness rule as the busy-now bars: after 15 minutes without an update
  the counts disappear and every row falls back to "Book in the app". Never an estimated or remembered count.

### Showpieces (discussed, not agreed)
- **How busy now, honest (the round-1 hero).** The "usually" bars are easy and always true (the club's own averages
  by hour). The live number is only possible if the club's door system exports a count to a Sheet, or staff update
  one; it must show its age and fall back to "usually" after 15 minutes. Worth it: no UK club's homepage shows this.
- **Spaces left (GYM-7).** Agreed with the owner as the riskiest: the app link is the default; spaces only from a
  fresh sheet (see "Booking and spaces left").
- **Hyrox race-prep planner (GYM-8).** The strongest Signature showpiece on its own page: pure date arithmetic from
  the race date and the club's own class types, saved as .ics. No medical or result promises.
- **"Your first week" (new, Plus).** From a goal and the real timetable, three sessions picked for the visitor's
  free hours. Easy, and it sells the day pass.
- **Membership calculator: the true total.** Not optional: the law (see "Prices"). Part of GYM-2 for Starter, not
  a separate showpiece.
- **Alternatives to pitch:** a recovery booking strip (sauna and plunge slots, same spaces logic); a bring-a-friend
  pass on WhatsApp; corporate rate by company (the club's list, no lookup service).
