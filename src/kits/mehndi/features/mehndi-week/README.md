# Wedding week planner

| | |
|---|---|
| Feature id | `mehndi-week` |
| Plan | signature (a page: `planner.html`) |
| Config | `planner`: `message` (WhatsApp opening), `steps` (2–10, `{ id, label, daysBefore, text?, mehndi? }`; exactly one step is the mehndi itself, `"mehndi": true`); `plannerPage`: `{ kicker, title, intro }` |

## How it works
The bride enters her wedding date (UK order). Every step gets its day, worked back by the artist's own days before:
the trial weeks ahead, nails and waxing, the mehndi evening, paste off, and the wedding. Then three actions:
"Ask to hold my mehndi day" (to the artist, with the wedding and the mehndi day), "Add to my calendar" (one file of
all-day events, made on the phone, nothing stored), and "Send to the family" (the week as a WhatsApp message she
forwards to her own group). Steps already gone are marked, with a line saying the artist will fit what they can.
Logic in `lib/mehndi.js` (`planDates`, `weekIcs`, `familyText`, `plannerText`).

## When something is missing or fails
Without JavaScript the steps show as "Six weeks before", "Two days before" and so on, and the WhatsApp link asks to
plan.

Registered in `src/kits/mehndi/kit.js`. Add to a site by listing the id in `features` in its `site.json`.
