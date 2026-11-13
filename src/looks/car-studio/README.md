# Look: Car Studio

A bright photo studio for tint, wrap, PPF and detailing studios. Demo: Apex Studio (`sites/demos/car-studio`). Used by the car kit.

| | Studio | Noir | Street |
|---|---|---|---|
| Colours | cool studio white `#F1F3F5`, ink `#0A0C0F`, signal red `#C8102E` | near-black, gold | warm paper, enamel blue |
| Fonts | Hanken Grotesk only: light (300) headings set tight, wide-tracked capitals for labels and buttons, self-hosted | Playfair Display, Manrope | Bricolage Grotesque, Figtree |
| Buttons | square, capitals with wide tracking; ghost buttons a 1px ink line | square gold blocks | pills with a hard ink shadow |
| Edges | hairlines, square corners, no shadows | hard corners, deep shadows | 18px rounded cards outlined in ink |
| Hero | a cyclorama with a real car photographed on the floor; on Signature the Showroom is the hero; otherwise the still car and a build sheet of "from" prices | stacked headline, barber pole | street plate and queue ticket |
| Layout | hairline rule above every section, large light headings, kickers in tracked capitals with a red rule | split section heads, tall sections | tight bands on alternating paper |
| Leads with | Showroom, from prices, driver's seat view, protection planner, swatch library, model finder (`homeOrder` in `look.json`) | chair board, build your cut | queue, prices |
| Copy | very little: one-line intros | longer intros | short |

Type options (`site.json` → `brand.type`): `classic` (light headings, default), `plain` (bold headings, no extra download).

The hero title's `|` is a line break; this look fits 16 characters per line on a phone.
Files: `look.json`, `look.css`, `fonts.css`, `type-plain.css`, `hero.njk`, `favicon.svg`.
