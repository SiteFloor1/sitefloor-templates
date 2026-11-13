# Look: Dove (bridal kit)

A Mayfair or Chelsea bridal salon with grey silk walls. Demo: **Wexley** (`sites/demos/bridal`). The design contract,
references and the comparison with every other look are in `sitefloor-internal/docs/design/wexley.md`.

- **Palette from a white dove:** white `#FFFFFF` (page), ivory `#F7F3EC` (the card, mounts, the diary band), dove
  grey `#CCC8C3` (hairlines, mounts, footer), slate `#29292D` (text), the neck's violet `#5B4A75` (Request, one
  hairline per section, a checked choice; never a fill). White gowns glow on white.
- **Type:** Gilda Display (names, headings; one weight) and Mulish 300/400/600. Size-matched fallbacks in `fonts.css`.
- **Hero:** the salon's three-way mirror: the gown's front in the middle pane, two other photographs of the same gown
  from one shoot (side, detail) angled in at either side, captioned. `hero.mirror = { label, left, centre, right }`, each
  `{ src, width, height, alt, label }`. The side panes settle into their angle once; never with reduced motion.
- **Header:** mirror emblem and the name in spaced capitals; pages right; "Appointments" underlined in violet.
- **Section openings:** the name in Gilda left, its line small right, a hairline above with a short violet start.
- **Home:** six sections; `onPages` moves the houses, band, reviews (quotes, no stars: `features/reviews.njk`),
  Instagram, vouchers and questions to their own pages.
- **The appointment:** the salon's room, a fitting ticket (punched hole, dashed note), one Request opening a sheet.
- **Footer:** dove grey, the name in spaced capitals, address, hours, pages, the Sitefloor credit.
- **Phone bar:** slate; where the salon is, and "Request an appointment" underlined in pale violet.
- **Buttons:** words with a line under them; no filled buttons, no rounded corners.
