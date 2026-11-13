# Look: Loupe (mehndi kit)

A bridal mehndi artist's work in a black room, lit one piece at a time, like a jeweller's case. Demo: **Hatheli**
(`sites/demos/mehndi`). Directions, references and the comparison with every other demo:
`sitefloor-internal/docs/trades/mehndi/design/directions.md`.

- **Palette:** black `#0C0B0A` (page), a warmer black `#151311` (the palm's case, form fields), bone `#F3EEE7` (words),
  light warm grey `#CBC2B7` (secondary words, kept high on black), the first orange of a fresh stain `#DE7A40` (links,
  the ring round the hidden name, today's hours), and buttons in the deep rust of a dark stain (the accent mixed into
  the black, so a client's colour carries through). Gold is never drawn: it comes from the jewellery in the photographs.
- **Type:** Rozha One (Indian Type Foundry), 400, for what is said, at 24px and up; Source Serif 4 300/400 for every
  sentence, label and button. Body 19px (18px on phones). Size-matched fallbacks in `fonts.css`.
- **Photography:** the bride from the wrist down (chooda, kaleere, haath phool, rings, lehenga), the work close and
  large; faces never shown. One grade (`-level 4%,97% -modulate 98,104`) across every photo.
- **Hero:** one line, large ("There is a name in this hand.") beside a real finished palm in a black case; a magnifier
  follows the finger; "Show me" rings the name hidden in the design (`name-find`, ring position in `hero.find`).
- **Header:** the name in lowercase on the left; "Check a date" in the stain colour, WhatsApp, Menu. No row of links:
  Menu opens every page on a black sheet in large type, with the live status and the studio's address.
- **Section openings:** one line in Rozha One, large; the intro beneath in the reading face. No label above it.
- **Home:** the palm; for the bride (two tall photos of her hands, one dropped lower, the packages as a ruled list, a
  21:9 photo beneath); is your date free; the guest sum in very large numerals; natural henna with the NHS
  line; questions; the studio. `onPages` moves the reviews to the bridal page. On a Signature client with her own
  photographs, "Your stain, day by day" sits after the date check.
- **Footer:** the name in lowercase, very large; address, hours and pages in three columns; the credit.
- **Phone bar:** black; "Check a date" outlined, WhatsApp in deep rust.
- **Buttons:** square, deep rust with a thin lighter-rust edge, the reading face at 18px; links are underlined words.
