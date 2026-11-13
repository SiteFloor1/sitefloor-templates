# How a design runs

| | |
|---|---|
| Feature id | `design-process` (page `design-process.html`) |
| Plan | plus and above |
| Config | `process`: `kicker`, `title`, `intro`, optional `fee` (the studio's own words on how it charges), `stages` (at least two, in order): `id`, `name`, `text`, optional `receive`, `weeks` (in words, e.g. "Two to three weeks"), `stop` (true where a client can stop and use their own builder) |
| Files | `design-process.njk`, `.css` |

## How it works
The questions clients ask most before a first call: what a design includes, how long it takes, and whether they can
have just the design. Each stage in order with what they receive and the studio's typical weeks; "You can stop here"
shows where the studio allows it. Fees and weeks are the studio's own, or left out.
