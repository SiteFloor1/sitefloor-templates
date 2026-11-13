# Look: Mackerel (detailing kit)

A detailing studio's bay at night with the strip lights on. Demo: **Varnell** (`sites/demos/detailing`). The design
contract, references and the comparison with every other look are in `sitefloor-internal/docs/design/detailing.md`.

- **Ground:** the bay with the lights off, near-black `#0B0D0F`, one step up `#121619` for the car-in-progress band.
- **The motif:** the studio's strip light (`.tube`): a 2px lit bar with a soft glow, used as section openings, under
  the actions, along the top of the footer and the phone bar, as focus, and as the stages of a car in the bay (done
  dim, today lit, still to come off).
- **Accent from a mackerel's back:** `#6E9EA3`, used rarely ("Open", today's stage date). Photographs carry one bay
  grade: deep neutral shadows, a little warmth in the highlights.
- **Type:** Funnel Display 300/400 (the name, headings, prices) against Sora 300/500. Size-matched fallbacks in
  `fonts.css`.
- **Hero:** the headlight photograph at full height (`hero.photo`, with `hero.phonePhoto`), the line lit in the dark
  of the paint, one action over a lit tube. With the client's own matched pair the `inspection-light` feature turns
  it into the inspection light. A tube strikes once on load, never with reduced motion.
- **Header:** the name left, the pages small and muted, Book lit; over the photograph on the home page. On phones,
  Menu opens a full-screen sheet.
- **Home:** coating and film explained beside the water photograph, then your car in the bay; the rest moves to its
  pages (`onPages`) when they're on, so a Signature home is about six phone screens.
- **Footer:** a lit line across the top, the name large, address, hours, pages, the Sitefloor credit.
- **Phone bar:** Call, WhatsApp, Book (lit), a tube along its top edge; the page reserves its height.
- **Buttons:** words over a lit line; no pills, no fills.
