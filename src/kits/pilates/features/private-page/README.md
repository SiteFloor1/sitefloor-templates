# Private and duet sessions (PIL-7)

| | |
|---|---|
| Feature id | `private-page` |
| Plan | signature |
| Config | `privatePage`: `kicker`, `title`, `intro`, `kinds` (one to four `{ id, name, minutes, text }`), `assessment`, `message` (WhatsApp opening line), optional `photo`, `photo2` |
| Files | `private-page.njk`, `.js`, `.css`; the page is `src/kits/pilates/pages/private.njk` |

## How it works
One-to-one and duet (or whatever kinds the studio offers), each with its length and a line; the assessment that
comes first; and a request (which, when suits, what to work on, a name) sent on WhatsApp. The studio offers a time.

## When something is missing or fails
Without JavaScript the button sends the opening line only.
