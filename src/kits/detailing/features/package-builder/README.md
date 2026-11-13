# Build your package (DET3)

| | |
|---|---|
| Feature id | `package-builder` |
| Plan | plus |
| Config | `sizes`, `packages` (as DET1), `addOns`: `[{ id, name, line?, days (0 if done alongside), prices }]`, `builder.message` (the WhatsApp opening line); `sections.builder` |
| Files | `package-builder.njk`, `.css`, `.js`; sums and the message in `src/kits/detailing/lib/packages.js` |

## How it works
Pick the car's size, one package and any extras: the total is the studio's "from" prices added up, with the days
the car stays (the package's days plus each extra's own). "Send this to …" opens WhatsApp with every choice, the
make and model if given, and the website price. An extra the studio hasn't priced for that size is listed "to
quote" and left out of the total. The size is shared with the packages list.
