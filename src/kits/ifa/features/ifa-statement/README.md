# ifa-statement (IFA-6, Signature: the hero showpiece)

Fees in pounds. The visitor types an amount (or picks one of `fees.presets`) and the firm's published fees appear as a
statement: initial advice once, ongoing advice each year and each month, and the first year, in pounds and pence.

- Arithmetic on `fees.schedule` only (`lib/fees.js`); no growth, returns or projections. Owner approved 16 Nov 2026.
- Painted at build time for `fees.example`, so the page reads right without JavaScript.
- Fails closed: a broken schedule builds no figures (the card links to the fees page); an amount outside `from`/`to`,
  blank or not whole pounds shows dashes and says why.
- The basis line under the figures comes from the schedule itself, then `fees.other` (platform and fund charges) and the
  risk sentence.

The look draws the card's frame and places it in the hero (`looks/<look>/hero.njk`); `features/ifa-statement/mark.njk` in the look
gives it the firm's seal.
