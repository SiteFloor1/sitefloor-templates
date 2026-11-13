# Private hire and team classes

| | |
|---|---|
| Feature id | `private-hire` |
| Plan | signature |
| Config | `studioHire`: `kicker`, `title`, `intro`, `kinds` (1–4 `{ id, name, text }`), `includes` (short lines), `maxPeople`, `message` (WhatsApp opening line), optional `photo` |
| Files | `private-hire.njk`, `.js`, `.css` (layout shared with `private-page.css`); page `src/kits/pilates/pages/hire.njk` |

## How it works
Hiring the room, team classes, a celebration: what's included and how many at once, then a request (which, the date in
UK order, how many, a company or occasion) sent on WhatsApp. A request, never a booking.

## When something is missing or fails
Without JavaScript the button sends the opening line only.
