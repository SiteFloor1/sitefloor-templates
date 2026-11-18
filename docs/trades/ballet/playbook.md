# Children's dance and ballet schools: playbook

What to build for this trade (kit `ballet`). The ground rules and the steps for a new kit: [`docs/TRADE-PLAYBOOK.md`](../../TRADE-PLAYBOOK.md).

## Children's ballet and dance school (new `ballet` kit), built 17 Nov 2026
- Customer: a parent, most often of a three- or four-year-old, wanting the right class, the day and time, a trial,
  then the year's dates, the uniform, the fees and the shows. The site's job: a trial request naming the age, the
  class and the session.
- Demo school **Wrenna** (fictional; no active company of that name on Companies House, no UK business found). Design
  round: `sitefloor-internal`, `docs/trades/ballet/design-r1/` (B, The round, approved with the finder on the first
  screen, the ring still, and the children watching the stage as the trial section).
- Customer questions: [`questions.md`](questions.md). Safeguarding, DBS and first aid only as the school's own words;
  exam boards only if the school names one.

### Features by plan (approved BAL-1 to BAL-7 and four new ones)
- **Starter** (home + Plan your visit): BAL-1 class finder by age (`ballet-finder`), BAL-2 the year in one calendar
  file (`ballet-year`, the ring of dates round the hero).
- **Plus** (up to 5 pages): BAL-3 trial class (`ballet-trial`), classes by age (`ballet-classes`), the timetable
  (`ballet-timetable`), fees and terms (`ballet-fees`), BAL-4 uniform per class (`ballet-uniform`), BAL-5 exam dates
  (`ballet-exams`), places left per class (`ballet-places`, the school's Sheet), catch-up finder (`ballet-catchup`).
- **Signature**: BAL-6 shows and tickets (`ballet-shows`, the school's own ticket link), BAL-7 parent handbook
  (`ballet-handbook`), show day by code (`ballet-showday`, page 13), where she'll go next (`ballet-path`).
- General pages (`custom-pages`): holiday camps, birthday parties, teachers.

### Alternative showpieces (alongside or instead)
- Holiday-camp day picker paid through the school's own Stripe Payment Links (Signature).
- Birthday-party request: date, age and numbers in one WhatsApp message (Plus).
- Costume-fitting slots from a Google Form (Signature).
- Parents' watching-week request (Plus).
