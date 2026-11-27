# Day nurseries and pre-schools: playbook

What to build for this trade (kit `nursery`). The ground rules and the steps for a new kit: [`docs/TRADE-PLAYBOOK.md`](../../TRADE-PLAYBOOK.md).

## Day nursery and pre-school (new `nursery` kit), built 27 Nov 2026
- Customer: a parent, often expecting or with a baby under one, wanting to know if there is a place in the right room
  from the right month, what a week really costs after funded hours, what a day looks like, the food, the Ofsted
  report, and a look round. The site's job: a look-round request naming the child's age and the start month.
- Demo nursery **Alnwood**, Walthamstow (fictional; no active company of that name on Companies House, no UK nursery
  found). Design round: `sitefloor-internal`, `docs/trades/nursery/design-r1/` (B, The atelier wall, approved with A's
  places by room on the home page for Starter and C's fees tool redrawn as the Signature week builder).
- Customer questions: [`questions.md`](questions.md).
- Hard rules for this trade: children never identifiable (no faces, names or initials; work, rooms and hands only).
  Ofsted grade, date and report link only as the nursery supplies them (`reportUrl` must be on
  reports.ofsted.gov.uk). Funding words follow gov.uk (15 or 30 hours for 38 weeks, stretched over the weeks open;
  starts the term after the age is reached) with the date checked shown, and link to gov.uk. Ratios only as the
  nursery states them. Extras alongside funded hours must be optional (`optional: true`, checked). The headline
  price includes every mandatory fee.

### Features by plan
- **Starter** (home + Plan your visit): the atelier wall (`nursery-wall`, the hero), today's notice
  (`nursery-today`, the nursery's Sheet, 160 characters), places by room and month (`nursery-places`, the nursery's
  Sheet; fails closed when stale), fees by room (`nursery-fees`).
- **Plus** (up to 5 pages): rooms (`nursery-rooms`), funded hours and when they start, from the child's birthday
  (`nursery-funding`), look-round times as WhatsApp requests (`nursery-visit`), a day in each room with "around now"
  (`nursery-day`), the week's menu (`nursery-menu`), the Ofsted report (`nursery-ofsted`), getting ready list with
  a print version (`nursery-ready`).
- **Signature**: the week builder (`nursery-week`: days and sessions in, funded hours taken off, the month's cost
  out, sent as one WhatsApp message), term dates and closures in one calendar file (`nursery-terms`), a settling-in
  plan from the start date (`nursery-settling`, skips weekends and closures, calendar file), the work and the areas
  of learning (`nursery-work`).
- General pages (`custom-pages`) as the nursery needs.

### Alternative showpieces (alongside or instead)
- Waiting-list position check by reference, from the nursery's Sheet (Signature).
- Holiday club day picker paid through the nursery's own Stripe Payment Links (Signature).
- Sibling start planner: two children, two rooms, one month's cost (Signature, extends the week builder).
- Parents' evening slots from a Google Form (Plus).
- Lost-property board from the nursery's Sheet (Starter add-on).
