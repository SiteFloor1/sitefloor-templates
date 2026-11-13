# Next free bay

| | |
|---|---|
| Feature id | `next-bay` |
| Plan | plus and above |
| Config | `bay`: `source` ("sheet", or "simulated" on demos), `csvUrl` (published Google Sheet CSV), `staleAfterHours?` (default 48), `message` (WhatsApp opening line), `deposit?` (`amount`, `link`: the studio's own Stripe Payment Link, `text`, `terms`), `wait?` (`text`, `lounge?`, `upToHours?`); `sections.bay` |
| Files | `next-bay.njk`, `next-bay.css`, `next-bay.js`, `sheet-provider.js`; logic in `src/kits/car/lib/bay.js`; demo `src/demo/bay-provider.js` |

## The studio's sheet
One Google Sheet, published to the web as CSV (File → Share → Publish to web → CSV), two columns:

| next_free | updated_at |
|---|---|
| 2026-10-29 | 2026-10-26 09:12 |

The studio changes the date from its phone whenever the diary moves, and the time it did so.

## How it works
The page shows the day in words ("Thursday 29 October", "Tomorrow") and when the diary was updated, and the
WhatsApp button asks for that day. The deposit button goes straight to the studio's own Stripe Payment Link
(Stripe takes its fee per payment; there is no running cost). "Can I wait?" lists the studio's lounge and every
job whose quickest time is within `upToHours`, from the studio's own times.

## When something is missing or fails
Fails closed: a sheet that can't be read in 6 seconds, a missing column, a date in the past, or an update older
than `staleAfterHours` shows "Message us for the next free day" instead of a date. Without JavaScript the same
message shows. A site using the sheet allows `docs.google.com` and `*.googleusercontent.com` in its security policy.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
