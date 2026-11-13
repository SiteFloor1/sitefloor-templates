# The flavour calendar (seasonal flavours)

| | |
|---|---|
| Feature id | `seasonal-flavours` |
| Plan | signature (needs `flavours`) |
| Config | `flavours.items[].months` (leave out for all year); `sections.seasonal` |
| Files | `seasonal-flavours.njk`, `.js`, `.css`; `inSeason` in `src/kits/cakes/lib/cakes.js` |

Choose the month of your event and see the flavours on then. It starts on the visitor's own month; without the
script it shows June.
