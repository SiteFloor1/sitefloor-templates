# Look: Counter

The counter at 8 a.m., in a grand hotel's morning café. For cafés, coffee houses and bakery-cafés. Demo: Morrow (`sites/demos/cafe`). Used by the restaurant kit.

| | Counter | Carte | Maison | Studio | Noir | Street |
|---|---|---|---|---|---|---|
| Colours | daylight oat `#F3ECDF`, steamed-milk white, espresso ink `#1C1714`, tiled teal-green `#1E6B5C`, brass hairlines, a butter tag for fresh trays; light only | menu-card paper by day, candlelight in the evening | always dark: bottle green, ivory, saffron | cool studio white, signal red | near-black, gold | warm paper, enamel blue |
| Fonts | Gloock (headings, dish names; upright, never italic) and Onest, self-hosted | Bodoni Moda, Schibsted Grotesk | Cormorant Garamond, Jost | Hanken Grotesk | Playfair Display, Manrope | Bricolage Grotesque, Figtree |
| Buttons | order tickets: 14px corners, a 2px ink outline, a fine brass line inside, a hard ink shadow that presses in on tap | printed double rule | hairline pills | square capitals | square gold blocks | pills with an ink shadow |
| Edges | brass hairlines, rounded milk-white cards, a two-row teal tile frieze under the hero and above the footer | double rules | hairline frames | hairlines | deep shadows | ink outlines |
| Hero | the café's own counter photo in a tall brass-lined arch, each bake on it tagged live from the sheet ("Fresh out 8:10am", "Sold out"); beside it the line, Order ahead, the open status and the visitor's saved usual on a paper ticket | the menu card itself | the Menu Book on the table over a fire loop | a car in the studio | stacked headline | street plate |
| Layout | left-aligned, compact heads with a hand-drawn brass underline; leads with the counter (slip and espresso coffee board on a marble band), Your usual and the glass case | centred heads between double rules | editorial left heads | left-aligned | split heads | tight bands |

## Settings it uses
- `counter.photo` (+ `srcSmall`, `srcSmallWidth`) and `counter.spots` (bakes marked on the photo, x and y from 0 to 1)
  for the hero; without a photo the hero is the words alone. Spot positions stay true when the photo is cropped on a
  phone (the CSS works from the photo's own proportions).
- `counter.board` for the coffee board in the band under the hero.
- Type options: "Counter" (Gloock) and "Modern" (`type-plain.css`, Onest headings).

## Motion
Nothing in the hero moves for more than a few seconds (a fresh tray's dot pulses three times), so it needs no Pause
button. Reduced motion turns the pulses off.
