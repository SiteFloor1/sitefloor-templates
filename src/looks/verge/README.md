# Verge (driving kit)

A driving instructor's site that answers before it's asked: practical, clear, honest numbers (Monzo and Octopus
Energy were the references, with gov.uk for plainness and RED and the AA for what learners ask first).

- **Hero idea:** the first screen is four white answer cards on a cool light ground, one big number each: prices
  (manual/automatic, block savings), "do you cover me?", the next free lessons, and "when could I pass?" with the cost to
  pass. The headline, three links (Ready to Pass?, test day, for parents) and a clean car on a local street sit beside
  them. Fewer cards on Starter and Plus close the grid up.
- **Phone:** the cards become four rows, each already showing its answer; tapping a row opens it in place. A floating
  green "Book a lesson" pill with a round Chat button.
- **Type:** Lexend throughout (300 headings, 400 numbers, 500 labels), size-matched fallback in `fonts.css`.
- **Colour:** ground #F1F2EF, cards white, ink #14161A, one accent: beech-leaf green #327524 (from a beech hedge in
  spring) for the pill, a block's saving and a yes. Photos lightly graded with green in the shadows.
- **Edges and motion:** 18 px card radius, pill controls; switches fade in 0.4 s; nothing follows the scroll.
- **Footer:** one white card: name and description, hours, every page, gov.uk's three links.

Hero settings (`site.hero`): `title` (one line; `|` splits it on phones), `intro`, `links` ([{ label, href | page,
feature }]), `photo` ({ src, width, height, alt, credit, focus }).
