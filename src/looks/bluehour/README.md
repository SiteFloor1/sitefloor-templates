# Look: Blue hour (electrician kit)

A finished house just after sunset. Demo: **Corbel Light & Power** (`sites/demos/electrician`). The design contract,
references and the comparison with every other look are in `sitefloor-internal/docs/design/electrician.md`.

- **Palette from a blueberry:** the skin's deep blue `#1C2B43` is the page (clearly blue, never black), its shadowed
  side `#152137` for the darker bands and the footer, slate `#243653` for panels, the pale green-white flesh `#E9ECDC` for text
  (dusty violet `#A4A8CE` for quieter text), and the bloom on the skin `#B3BFE6` as the one colour: the lit key, the
  chosen light, one phrase per heading. The
  only warm colour is the house's own light, inside the photographs; a full-width warm photograph (`photo-band`)
  breaks the run of blue.
- **Type:** Encode Sans Expanded 200 for headings (wide hairline, like the engraving on a keypad) and 400 for small
  engraved capitals (labels, keys, the name); Encode Sans 300–500 for reading. Size-matched fallbacks in `fonts.css`.
- **Hero:** the house edge to edge, the headline at its foot; with the scene keypad (Signature) three engraved keys
  change the photograph (`hero.scenes`, each `{ id, label, line, wide, tall }`). Without it, the first scene alone.
- **Header:** the name with a small line beneath (`mark = { word, line }`), the pages, "Request a visit" in a square
  outline. Over the house on the home page; on the blue elsewhere. The emergency line (`call-out`) sits above it.
- **Section openings:** the heading large on the left with one phrase in bloom (`*like this*`), the line small
  on the right, bottom-aligned. No label above, no rule.
- **Home:** hero, every light's reason, the house in 3D (Signature, full width), rooms lit, the warm band, the circuit chart with
  the registers, the fault guide, visit. `onPages` moves the rest to the pages when they're on.
- **Controls:** square, always. One filled action per section (pale on blue).
- **Footer:** the evening's deep blue: the name, what they do, registers, address, hours, pages, the credit.
- **Phone bar:** the keypad again: Call · WhatsApp · Estimate (or the fault guide).
- **Motion:** a slow cross-fade when a key is pressed; the breakers in the chart slide on when a circuit opens.
  Nothing is tied to the scroll (the shared photo band's parallax is replaced by a still band).
- **Inner pages and shared features (its own layouts in `features/`):** one language, read like an installation
  schedule: ruled lines numbered C01, C02… with engraved labels, square keys with a light for filters, and the week as
  a time switch (a 6am–10pm track per day with the opening hours lit). Plan your visit is the schedule (each journey
  opens to its steps as one run); the team is a register (one long row per person); work and the gallery are a lit
  wall (one large frame and two beside, numbered P01…); reviews read as test results (five lights); page links are
  ruled rows; the voucher is an engraved keypad plate; questions open with a small light; About is ruled rows.

