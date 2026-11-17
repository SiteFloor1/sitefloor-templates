# Where to find us (page)

| | |
|---|---|
| Feature id | `stalls-find` |
| Plan | plus and above |
| Config | `findPage` { `title`, `intro?` }; uses `stops` (with `stalls-where`, which it needs) |

The page `find-us/`: the whole week from the stall's sheet (every stop with its date, market, postcode and
Directions), then the regular markets with their usual days. With the pitch finder (`stalls-pitch`) on, each market
the stall has photographed shows its pitch and one line on how to spot it. Fails as `stalls-where` does.

Registered in `src/kits/stalls/kit.js`.
