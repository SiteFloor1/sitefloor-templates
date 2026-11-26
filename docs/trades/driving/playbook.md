# Driving instructors: playbook

What to build for this trade: an independent driving instructor (ADI) or a small driving school (kit `driving`, branch
`trade/driving`). Not a national school franchise. The ground rules and the steps for a new kit:
[`docs/TRADE-PLAYBOOK.md`](../../TRADE-PLAYBOOK.md). Customer questions: [`questions.md`](questions.md).

## What sells an instructor, and what loses the learner
Premium practical, not luxury: everything a learner and the parent paying need, instantly clear, with honest numbers.
People hesitate over four things: the price (and whether automatic costs more, and what a block saves), whether the
instructor covers their area, when they can start, and how long and how much until they can pass. The first screen
answers all four, so the first message is "Can I have Thursday 4pm?" rather than "How much?". It fails if it promises
a pass, quotes a pass rate it can't back, or reads like a car advert.

## Honesty rules for this kit (checked in `config.js`, not left to taste)
- No pass-rate claims, guarantees, "pass first time" promises or "fastest/cheapest way to pass" in the instructor's
  copy. A pass rate only in `instructors.passRate`, as the client gives it, with the dates it covers; never on a demo.
- DVSA badge numbers only as the client supplies them, only for an approved instructor (ADI); a trainee is shown as a
  trainee (PDI). Never on a demo.
- Test fees only as checked on gov.uk/driving-test-cost, with the date; hidden after six months (the cost to pass then
  leaves them out and says to check gov.uk).
- Rules (licences, tests, supervising a learner, Pass Plus) always link to gov.uk; guide pages accept gov.uk links only.
  The DVSA's Ready to Pass? points and the test-day steps are written once in `lib/govuk.js` with the date checked.
- "When could I pass?" is labelled "An estimate from DVSA averages and our prices", rounded to £10, never a promise.
- Prices in whole pounds; a block or course can't cost more than the same hours singly.
- Live data from the instructor's own Google Sheets on client sites; both sheets fail closed (stale, unreadable, or
  anything written outside their columns shows nothing). The progress sheet is keyed by code; no names anywhere.
- Pass photos (`driving-passed`) are client-only: real pupils, shown with their agreement.

## Features and plans (owner-approved split)
| Plan | Features |
|---|---|
| Starter | `driving-prices` (manual/automatic, block savings), `driving-areas` (postcode check), `driving-testday` (gov.uk links) |
| Plus | `driving-slots` (next free lessons), `driving-ready` (Ready to Pass?), `driving-centres`, `driving-parents` (incl. practising together), `driving-passed` (client only), and the pages: lessons, areas, book, automatic or manual, intensive, theory, Pass Plus and motorway, refresher, instructors |
| Signature | `driving-pass` (when could I pass + the cost to pass), `driving-progress` (progress card by code, with the last lesson and what to practise: the lesson recap), `driving-journal` |

Not built yet: DRIVE-7, the manoeuvres film (a rendered Blender film of parallel park, bay park and pull up on the
right; never browser 3D). It needs a render made once and shared by every driving site; it stays on the list.

## Alternative showpieces (alongside or instead)
- A lesson recap page of its own (a 3-tap Google Form after each lesson; the learner adds the next lesson to their
  calendar with an .ics), if clients want more than the progress card's last-lesson lines.
- "Practise this week": the learner's weakest skill from the progress card turned into ten-minute practice ideas for
  the parent supervising, with gov.uk's supervisor rules.
- A test-day countdown: the learner enters their test date and centre; the page lays out the last lessons, a mock test
  and the hour before, with the gov.uk links.
