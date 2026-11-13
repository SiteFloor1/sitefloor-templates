# Your reformer settings (Signature showpiece)

| | |
|---|---|
| Feature id | `reformer-settings` |
| Plan | signature |
| Config | `machine`: `springs` (heaviest first, `{ id, name }`), `maxPerSpring`, `footbar` (positions), `headrest` and `straps` (the words the studio uses), `gear` (positions), `message` (the line sent with the link) |
| Files | `reformer-settings.njk`, `.js`, `.css`; encoding in `src/kits/pilates/lib/members.js`; page `settings.html` (unlisted, not indexed) |

## How it works
After a first class the teacher opens the page, fills in the client's springs, footbar, headrest, straps, gear and a
short note, and shares the link from the phone's own share sheet (WhatsApp, Messages, email) or copies it. The link opens the client's own card at the reformer; "Keep on this phone"
saves it in their own browser. The settings live in the link, so the studio stores nothing and the sheet has no names.

## When something is missing or fails
A link with nothing valid in it shows no card, only "Your teacher sends you this page". Without JavaScript the same.
