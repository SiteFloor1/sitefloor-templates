# Nacre (jeweller kit)

A Bond Street salon in daylight: the inside of an oyster shell. Demo: Aldous Marr (`sites/demos/jeweller`). The mini
design system is the contract: `sitefloor-internal/docs/design/aldous-marr.md`.

- **Ground and colour:** pearl `#F4F1EF`, mist `#E9E4E2`, shell-lip hairlines `#B9B4B6`, slate `#5A5658`, ink
  `#1B1A1C`. **Signature: conch pink** (`--brand`, the inside of a queen conch shell), used boldly and rarely: one
  full-width band (the box), the appointment button and the phone bar. It is worked out from the accent (`--accent`,
  deep conch `#A24A55`, 5.1:1 on pearl, the rare accent text) in OKLCH, so a client's own brand colour gives its own
  signature; `#EFA8AD` where OKLCH isn't supported.
- **Type:** Italiana (hairline capitals: names, collections, the monogram) and Albert Sans 300/400/500. Size-matched
  fallbacks in `fonts.css` (measured 29 Oct 2026).
- **Header:** the monogram (the client's initials in a rose-lined oval, `parts/cartouche.njk`) centred and alone; Menu
  and the first two pages on the left, Appointment (the booking link) on the right; one hairline; it doesn't stick.
  "Menu" opens every page full screen (`#mnav`).
- **Hero:** one still, large: a piece in studio light (or worn), no headline; its name, price and "See it in person"
  beneath. No video.
- **Home page:** six sections at most (`homeOrder`): the hero, the collections as four doors, the box in a band of
  conch, one commission from the bench, visit and appointment, the footer. Everything else (the room, your visit,
  reviews, the photo band, page links, the gallery…) sits on Plan your visit (`visitOrder`) or its own page. The giant
  hairline heading appears on inner page openings only.
- **Section intro:** a hairline, the name in hairline capitals (giant for a collection), one label.
- **Actions:** underlined words, and one filled button in conch for the appointment (`nc-btn`). Forms are hairline
  fields; choices are words that underline when chosen.
- **Phone bar:** one band of conch: "Request a private appointment".
- **Footer:** monogram, address, grouped hours, pages and the Sitefloor credit in one hairline-topped row. It also
  carries the piece viewer and the tray, which open over every page.
- **Shared features restyled:** questions, reviews, visit, plan-visit, seasonal, vouchers, pay-link (and its button),
  gallery, work, photo-band (no parallax), page-links, team, custom-pages (`features/`).
- **Motion:** images fade in once (600 ms); nothing tied to the scroll; no video.

The jeweller kit's own layout lives in `src/kits/jeweller/kit.css` and each feature's CSS (tokens only); this look sets
the tokens and the type system (`nc-*` classes) those templates use. A second jeweller look restyles both.
