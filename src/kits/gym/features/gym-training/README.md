# Personal training

| | |
|---|---|
| Feature id | `gym-training` |
| Plan | plus and above (a page: `training.html`) |
| Config | `training` `{ title, intro, photo, who, packs: [{ id, name, sessions, minutes, price, mandatoryFees, text }], notes, message }` |

Who personal training is for (`who`, in the club's words: members only, or open to anyone), then the packs as a ledger.
The same price rule as memberships (DMCC Act 2024, CMA209): each pack lists its mandatory fees (an assessment, say, or
`[]`), and the build shows the total the client pays as the headline, then the price a session (worked out from that
total, rounded down) smaller beside it. Leaving `mandatoryFees` out is refused. "Ask on WhatsApp" carries the pack's
name. If personal training is for members only, say so in `who`: the membership is a separate product with its own
lawful total on the memberships page.
