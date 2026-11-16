# Everyone in the chair

| | |
|---|---|
| Feature id | `bridalbeauty-party` |
| Plan | signature |
| Config | `party`: `{ message, start: { <packages.party id>: count }, max, text?, photo?, caption? }`; uses `packages` and `morning`; heading in `sections.party` |

The bride's party priced together from the artist's own per-person prices (`packages.party`), starting from `start`.
The total adds the early-start fee when the morning would start before the artist's cut-off, and a second artist's fee
when one alone would start before `morning.secondArtist.earliest`. Every stepper moves the cover's start time (the
shared `party`). "Send me this on WhatsApp" writes the quote with her date, service, party and ceremony time; it asks
the artist to confirm and never says booked. Above `max`, it asks her to message for a team.
