# Next slot

| | |
|---|---|
| Feature id | `next-slot` |
| Plan | starter and above |
| Config | `nextSlot`: `source` ("sheet", or "simulated" on demos), `csvUrl` (published Google Sheet CSV), `staleAfterMinutes?` (default 240) |

## How it works
Under the shade card: "Next free · Tomorrow, 10:00". The salon keeps one sheet, two columns, `next_free` (`2026-10-30 14:30`) and `updated_at`, and changes it from its phone when the book fills. Markup is the look's `hero.njk`; logic in `lib/slot.js`; demo `src/demo/slot-provider.js`.

## When something is missing or fails
Fails closed: a sheet that can't be read in 6 seconds, a missing column, a slot already gone or an update older than `staleAfterMinutes` says "Message us for the next free time" instead. A site using the sheet allows `docs.google.com` in its security policy.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
