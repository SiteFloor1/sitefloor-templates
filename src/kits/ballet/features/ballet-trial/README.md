# Trial class

| | |
|---|---|
| Feature id | `ballet-trial` (needs `ballet-finder`) |
| Plan | plus and above |
| Config | `trial`: `message`, `photo`, `steps` `[{ label, text }]` (2 to 6), `price?` (in the school's words), `note?`; `trialPage` `{ kicker, title, intro }`; heading in `sections.trial` |
| Files | `ballet-trial.njk` (home section and the trial page), `ballet-trial.css`, `ballet-trial.js` |

## What it does
On the home page: the photograph in a circle, the steps (before, on the day, afterwards) and "Ask for a trial class",
which follows the class picked in the finder. The trial page adds the age and the day as two rows of taps, so the
message names the exact session ("…try Little ballet, Saturday 10.00am?").

## Rules
- A trial price appears only if the school gives one (`price`). Nothing says booked: the school replies.
- Photographs of children: from behind or far away, never a child's face close up, unless the school has consent.
