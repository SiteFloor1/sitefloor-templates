# Build your package (WVID-4)

| | |
|---|---|
| Feature id | `wf-builder` (needs `wf-packages`) |
| Plan | plus and above |
| Config | `builder`: `message` (WhatsApp opening), `extras` (each `{ id, name, price, text?, per?, max? }`; `per: "hour"` with `max: 3` sells up to three hours), optional `depositLink` (the studio's own Stripe Payment Link; a test link on demos) with `depositText`. Heading in `sections.builder` |
| Files | `wf-builder.njk`, `.js`, `.css`; sums in `src/kits/weddingfilm/lib/packages.js` |

A package (only priced packages can be built), then extras: an hour more, a second shooter, drone where the venue
allows it, an album. The total is the studio's own prices added up; "Send this to us" puts the package, the extras,
the total and (if the couple chose one in the date check) the wedding date in a WhatsApp message. Nothing is booked
until the studio replies; the deposit link is the studio's own.
