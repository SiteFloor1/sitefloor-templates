# Sittings, open now

| | |
|---|---|
| Feature id | `sittings` |
| Plan | starter and above |
| Config | the menu's `sittings`; `sections.sittings` (`title`, optional `intro`) |
| Files | `sittings.njk`, `.css`, `.js`; logic in `src/kits/restaurant/lib/sittings.js` |

## How it works
Lists the day's sittings (breakfast, lunch, afternoon tea, candlelit) with their times and days, marks the one being
served now ("Now") or the next one today ("Next"), and says when the kitchen closes, every minute, from the same rules
as the menu's kitchen line.

## When something is missing or fails
Without JavaScript the sittings and times show; only the "now" mark and the kitchen line need the clock.
