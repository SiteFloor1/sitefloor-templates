# Before / after

| | |
|---|---|
| Feature id | `before-after` |
| Plan | plus and above |
| Config | `beforeAfter.items`: `before`, `after` (photos in `img/`, ideally the same framing, 4:5), `alt` (what they show), optional `beforeLabel`, `afterLabel`, `caption`, `by`; `sections.beforeAfter` |
| Files | `before-after.njk`, `.css`, `.js` |

## How it works
One frame per pair with a wipe slider (drag, tap, or arrow keys: it is a native range input over the photos).
It nudges once when it first comes into view. Without JavaScript the two photos sit side by side.

## Notes
On client sites the photos must be the shop's own work, of the same client, with their permission: never pair two different people. The Street demo uses two stock photos labelled only as an example ("In progress", "Finished").
Registered in `src/features/registry.js`.
