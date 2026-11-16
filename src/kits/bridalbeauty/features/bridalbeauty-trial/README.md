# The trial

| | |
|---|---|
| Feature id | `bridalbeauty-trial` |
| Plan | plus |
| Config | `trial`: `{ message, price, minutes, earliestWeeks, latestWeeks, where: [..], bring: [..], text, guests? }`; `trialPage`: `{ title, intro }` |

Her wedding date gives the weeks to have the trial in (`earliestWeeks` to `latestWeeks` before, never before today);
past that window it says there's often still time and asks. Where (the artist's own places), whether she's bringing
someone, and the request on WhatsApp. `price` 0 shows "Included".
