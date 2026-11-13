# Will you bring it to us? (venue delivery checker)

| | |
|---|---|
| Feature id | `venue-check` |
| Plan | signature |
| Config | `delivery.areas[]` (`name`, `districts`: postcode areas like "SW" or districts like "RG9", `from` in whole pounds, `arrive`: when it arrives, e.g. "two hours before the meal"), `delivery.unknown` (what to say elsewhere; may use `{district}`), optional `delivery.day[]`, `stands`, `marquee`, `after` (shown on the delivery page); `sections.delivery` |
| Files | `venue-check.njk`, `.js`, `.css`; `areaFor` in `src/kits/cakes/lib/cakes.js` |

## How it works
The postcode (full, or its first half) is reduced to its district; a district the studio lists wins over its
postcode area. The answer names the area, the starting charge and when the studio arrives. Each district may be in
one area only (validation refuses duplicates). Anywhere not listed gets the studio's own words asking for the venue.
The areas are listed underneath, so the section works without the script.
