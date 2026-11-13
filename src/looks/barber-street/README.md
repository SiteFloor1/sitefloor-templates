# Look: Barber Street

Daylight express walk-in shop. Demo: Swift Cuts (`sites/demos/barber-street`). Used by the barber kit.

| | Street | (Noir, for contrast) |
|---|---|---|
| Colours | warm paper `#F3EFE6`, enamel-sign blue `#1F4BD1`, ink `#15171C` | near-black, gold |
| Fonts | Bricolage Grotesque (headlines), Figtree (body), self-hosted | Playfair Display, Manrope |
| Buttons | pills outlined in ink with a hard 3px ink shadow | square gold blocks, soft glow |
| Edges | 18px rounded cards outlined in ink, flat | hard corners, deep shadows |
| Hero | street-name plate, one plain sentence, a "today" ticket with live status, the live queue and the shop's top four prices | stacked three-line headline, barber pole |
| Layout | single-column section heads, tight sections, alternating paper bands | split section heads, tall sections |
| Leads with | live queue, prices, memberships, before/after, loyalty, vouchers (`homeOrder` in `look.json`) | chair board, photo band, build your cut |
| Copy | short: no hero stats, shorter section intros | hero stats, longer intros |

Type options (`site.json` → `brand.type`): `classic` (Street grotesk, default), `plain` (Figtree only, no extra download).

The hero title's `|` line breaks are ignored here: write it as one sentence.
Files: `look.json`, `look.css`, `fonts.css`, `type-plain.css`, `hero.njk`, `favicon.svg`.
