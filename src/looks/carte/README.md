# Look: Carte

A printed menu card for restaurants and cafés. Demo: Saffron & Ash (`sites/demos/restaurant`). Used by the restaurant kit.

| | Carte | Studio | Noir | Street |
|---|---|---|---|---|
| Colours | day: menu-card paper `#FFFDF9` on a celadon wall `#E4E7DF`, ink `#191712`, paprika `#A3341A`; evening: aubergine-black `#191113`, candle cream `#F2E6D2`, ember `#E8A24E` | cool studio white, signal red | near-black, gold | warm paper, enamel blue |
| Fonts | Bodoni Moda (headings, dish names, prices) and Schibsted Grotesk (everything else), self-hosted | Hanken Grotesk only | Playfair Display, Manrope | Bricolage Grotesque, Figtree |
| Buttons | a printed double rule: filled with an inner hairline, or outlined twice | square, wide-tracked capitals | square gold blocks | pills with a hard ink shadow |
| Edges | double rules, a card on the wall with a soft shadow, an inset hairline frame on the menu | hairlines, no shadows | deep shadows | rounded cards outlined in ink |
| Hero | the menu card itself: the restaurant's line between rules, a Bodoni headline, then the menu with today's specials and the live board clipped beside it | a car in the studio / the Showroom | stacked headline, barber pole | street plate and queue ticket |
| Layout | centred section heads between short double rules, like a menu's section titles | left-aligned, hairline above each section | split section heads | tight bands |
| Leads with | the menu, today's specials, The Pass, The Table, The Room, the table request (`homeOrder`) | Showroom, from prices | chair board | queue, prices |
| Copy | short, menu-like | very little | longer | short |

**Day and evening.** Each sitting in `menu.sittings` has a `mood` (`day` or `evening`). A fixed inline script in `<head>`
(`src/core/lib/daypart.js`, allowed in the CSP by its hash) sets `<html data-mood>` before the first paint, so an evening
visitor never sees the daytime colours flash; the menu keeps it current and picking a sitting's tab previews its colours.
Without JavaScript the site stays in its day colours. Only colours change, so nothing moves on the page.

**Brand accent.** A client's own accent (`brand.accent`) is used by day. The evening keeps the look's ember accent, which is
made to read on the dark background; a client accent that doesn't is never put there.

Type options (`site.json` → `brand.type`): `classic` (Bodoni headings, default), `plain` ("Café": grotesk headings, no extra download).

The hero title's `|` is a line break; this look fits 15 characters per line on a phone.
Files: `look.json`, `look.css`, `fonts.css`, `type-plain.css`, `hero.njk`, `favicon.svg`.
