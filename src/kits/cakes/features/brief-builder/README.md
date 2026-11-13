# Order a cake (brief builder)

| | |
|---|---|
| Feature id | `brief-builder` (page `order`) |
| Plan | plus and above (needs `servings` and `flavours`) |
| Config | `brief.intro` (the message's first line, e.g. "Hello Pastillage, we'd like a cake."), `brief.finishes[]` (the studio's finishes: buttercream, sugar flowers…); `cakePages.order` (title, intro) |
| Files | `brief-builder.njk`, `.js`, `.css`; the message is `briefText` in `src/kits/cakes/lib/cakes.js` |

## How it works
Date, guests and how it's served choose the tiers from the studio's chart (the same as the servings calculator), then
one flavour per tier, the finish, the venue and notes. The brief is shown as it will be sent; the button opens
WhatsApp with it written. Nothing is sent or stored by the site. Arriving from the calculator fills in the guests.

## When something is missing
More guests than the chart covers says the studio will design it with them and leaves out the tiers. Without the
script it is a message link with the first line.
