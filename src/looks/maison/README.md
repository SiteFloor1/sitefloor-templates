# Look: Maison

The restaurant after dark, for high-end and evening-led restaurants. Demo: Saffron & Ash (`sites/demos/restaurant`). Used by the restaurant kit.

| | Maison | Carte | Studio | Noir | Street |
|---|---|---|---|---|---|
| Colours | always dark: bottle-green night `#0C1311`, ivory `#EDE6D8`, saffron `#E0A03A` | menu-card paper by day, candlelight in the evening | cool studio white, signal red | near-black, gold | warm paper, enamel blue |
| Fonts | Cormorant Garamond (headings, dish names, prices) and Jost (light, wide-spaced capitals for labels), self-hosted | Bodoni Moda, Schibsted Grotesk | Hanken Grotesk | Playfair Display, Manrope | Bricolage Grotesque, Figtree |
| Buttons | hairline pills in wide capitals; filled saffron or an ivory hairline | printed double rule | square capitals | square gold blocks | pills with an ink shadow |
| Edges | hairline frames, 2px corners, no shadows | double rules, soft card shadows | hairlines | deep shadows | ink outlines |
| Hero | full screen: the Menu Book lying on the table in a pool of warm light, the restaurant's grill burning out of focus behind it (`hero-film`, a short loop), a very large headline, two buttons, the live status and the PDF menu to its left (below it on a phone). Without the book, the sittings run down the right | the menu card itself | a car in the studio | stacked headline | street plate |
| Layout | left-aligned editorial heads, a short saffron rule before the label, lots of dark space | centred heads between double rules | left-aligned, hairlines | split heads | tight bands |
| Leads with | the Menu Book (in the hero), today's specials, The Pass, the menu, then booking (`homeOrder`) | the menu | Showroom | chair board | queue |
| Copy | very little, large | short, menu-like | very little | longer | short |

**Footage matters.** Behind the book: a 5–10 second silent loop of the restaurant's own fire, pass or candles
(`heroFilm.video`). It sits far out of focus, so a phone clip is plenty: 960×540, blurred, under 200 KB. Photos work
too (`heroFilm.photos`). Without `hero-film` the book sits in its pool of light on the night colour, which still works.

**Seasons.** With `seasonal` on, the book's leather and foil change with the season's tint and the season's name is
stamped on the cover, before the first paint.

**Brand accent.** A client's accent must read on the dark green (`brand.accent.against`); the suggestions are tested.

Type options (`site.json` → `brand.type`): `classic` (Cormorant headings, default), `plain` ("Modern": Jost light capitals).

The hero title's `|` is a line break; this look fits 13 characters per line on a phone.
Files: `look.json`, `look.css`, `fonts.css`, `type-plain.css`, `hero.njk`, `favicon.svg`.
