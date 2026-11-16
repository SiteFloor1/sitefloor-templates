# The cover

| | |
|---|---|
| Feature id | `bridalbeauty-cover` |
| Plan | starter |
| Config | `hero`: `{ kicker, star, photo, focus?: { wide, phone }, cutout?: { src } }` |
| Files | markup in the look's `hero.njk`; `bridalbeauty-cover.js` fills the cover lines |

The home page opens as a bridal magazine cover: one finished bride full-bleed, the artist's name across the top, and
cover lines that are the real answers. The lines come from other features when they're on:

- `bridalbeauty-dates`: "The next open Saturday · Saturday 19 June 2027 · *Open.*" from the artist's diary; once she
  picks her own date, "Your date". Never says booked; an unreadable or old sheet says "Ask me."
- `bridalbeauty-packages`: "Trial and wedding day £520, hair and makeup", the service a picker in the line.
- `bridalbeauty-start` (Plus): "We start at 7:25 for a 2pm ceremony, four of you", the ceremony a picker; the party
  comes from `bridalbeauty-party` when it's on; the early-start fee is named when the start is before the cut-off.
- `hero.star`: "On the cover: …", the look in a line.

**The name above or behind her head.** By default the name sits above the photograph. When her photo has room above
her head, set `hero.cutout.src` to the same photo with everything but her head and hair transparent (WebP, same size),
and the name passes behind her head as on a printed cover. The intake checklist asks the artist for a cover photo
with headroom; without one, leave `cutout` out. `hero.focus` places her face on a wide screen and a phone
("50% 30%", CSS object-position).

The choices (her date, service, ceremony, party) are shared with the party quote and the morning, trial and skin pages
on the same page through the shared store (`wedding`, `service`, `ceremony`, `party`).
