# The engraving desk (FRAG-4 with a live preview, Signature)

`engraving`: `title`, `intro?`, `price` (the house's engraving price), `maxLetters` (spaces count), `styles`
(`caps`, `lower`, `initials`), `places` (`glass`, `box`), `fragrance` and `ml` (the bottle the desk shows), `days?`
(how long it takes, in the house's words), `message` (the WhatsApp order: `{fragrance}`, `{ml}`, `{price}`,
`{words}`, `{style}`, `{place}`), `payLink?` (the house's Stripe link for the engraved bottle), and for the preview one
front-on `photo` with the engravable `area` (`x0`, `y0`, `x1`, `y1`, fractions of the photo, marked once). The words
are drawn on the glass as they're typed and the picture says "Preview": it's not a proof. Without the photo the desk
can't be on; the plain order form on the gifts page still works.
