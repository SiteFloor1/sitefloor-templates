# What a week costs

| | |
|---|---|
| Feature id | `nursery-week` |
| Plan | signature |
| Config | `fees` (rate, weeksOpen, sessions, extras: see `nursery-fees`), `funding.stretched`, `week.message` (WhatsApp opening) |
| Files | `nursery-week.njk`, `nursery-week.css`, `nursery-week.js`, `week-words.js`; sums in `src/kits/nursery/lib/nursery.js` (`weekCost`) |

## How it works
Pick an age band, tap the days (off, then each session the nursery offers) and pick funded hours. The card shows what
the family pays a month: hours booked, funded hours taken off, hours paid at the hourly rate, over the weeks the
nursery is open, in 12 equal months. "Ask … to check this" sends the quote on WhatsApp.

## The rules it follows (gov.uk, checked 26 Nov 2026)
- 15 or 30 funded hours a week for 38 weeks a year (570 or 1,140 hours), spread across the weeks the nursery is open,
  never more than the hours booked.
- Which offers an age can have: none under 9 months; working families' 30 hours from 9 months; 15 hours for some 2
  year olds; 15 hours for every 3 and 4 year old, 30 for eligible working families. gov.uk decides who is eligible;
  the tool only does the sums and links to gov.uk.
- Extras are always shown as optional (DfE statutory guidance) and never added to the headline.
