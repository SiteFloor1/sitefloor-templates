# Look: Datum (car hire, `hire` kit)

The private side of a flagship showroom: one car at a time, shown in detail at night, the facts handed over calmly.
Design system: `sitefloor-internal/docs/design/datum.md` (owner-approved 29 Oct 2026). Demo: Datum Hire (`sites/demos/car-hire`).

- **Palette, from a damson:** ground `#120E15`, surface `#1C1720`, plum hairlines `#3A2A42`, text `#ECEBF0`, muted
  `#9C97A6`; the bloom `#A9A8C2` (`--accent`, so a client's accent replaces it) only for thin underlines, the datum mark
  and the key in the handover, never a filled button or block.
- **Type:** Red Hat Display only (`@fontsource/red-hat-display` 5.3.0, from 29 Oct 2026: the wear look took Rethink Sans
  first): 300 for big lines, 600 for model names, 400 text, 500 tracked capitals for small labels. Size-matched fallback in `fonts.css`.
- **Layout:** 12-column grid, hairlines not boxes, square edges, no shadows or cards. Owns the header (over the first
  picture of every page), footer (with "Independent hire company, not affiliated with any manufacturer."), phone bar,
  section heads and the questions markup (which holds what to bring and the driver form on the hire kit).
- **Motion:** images fade in once; the shared scroll reveals and the photo band's parallax are switched off; the
  Signature hero film has Pause; nothing moves under reduced motion.
- **Mark:** the datum mark (circle and cross), `parts/mark.njk`, also `favicon.svg`.
