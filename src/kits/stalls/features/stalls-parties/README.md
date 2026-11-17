# Parties and private hire (page)

| | |
|---|---|
| Feature id | `stalls-parties` |
| Plan | plus and above |
| Config | `partiesPage` { `title`, `intro?`, `photo?`, `blocks` [{ `title`, `text` }] } |

The page `parties/`: what the stall brings to a birthday, a school fair or an office day, in the stall's own words
(how many it serves in an hour, what's included, travel), with a photo. The set-up card (`stalls-setup`) and Book us
(`stalls-book`) follow when they're on. No prices or numbers are written for the stall: they come from `blocks`.

Registered in `src/kits/stalls/kit.js`.
