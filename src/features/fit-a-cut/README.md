# Will I make it? (fit a cut in)

| | |
|---|---|
| Feature id | `fit-a-cut` |
| Plan | signature (sell as an add-on below that) |
| Needs | `walk-in-queue` on (it reads the same live queue and busyness), `services`; uses `visitInfo.journeys` for "coming from" if present |
| Config | `sections.fitCut` only |
| Files | `fit-a-cut.njk`, `.css`, `.js`; maths in `src/core/lib/fit-cut.js` |

## How it works
Three taps: when they need to be done (in 20/30/45 min, 1 hr, or by a time), what they're having (from `services`,
with its minutes) and where they're coming from (each journey on the Plan your visit page, or "I'm outside"), and
whether they need to get back there. It answers straight away:

- **Yes:** "You'll be done by 4:42pm", minutes to spare and the latest time to leave, a timeline of
  walk → wait → cut → walk back against their deadline, and "On my way" (WhatsApp: "I'm on my way, there in 2 min").
- **Too tight / Not today:** how many minutes short, or that the shop closes first, and the best time left today
  (the shortest usual wait that still finishes before closing) with **Remind me**: a calendar file for that time
  with a 15-minute alert. When closed, it offers the next opening time.

The wait comes only from the live queue. Without a current live number the answer is "Probably. If there's no
queue, you'll be done by…", with the usual busyness as a word ("usually quiet at this hour") and never a guessed
number of minutes; "too tight" then says "even with no queue". Before opening it plans from today's opening time
("Yes, if you're here for 7:30am"). The best time left today is the quietest hour by the shop's own busyness that
still finishes before closing. Reminders are written in UTC, so every calendar app reads them the same way.

## When something is missing or fails
Without JavaScript the form is hidden and the card shows "Ask on WhatsApp". The shop never promises a slot: it's walk-in, and the page says so.

## Notes
Registered in `src/features/registry.js`. Works for any walk-in trade (key cutting, phone repair, nail bars).
