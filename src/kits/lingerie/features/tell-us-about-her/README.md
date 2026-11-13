# tell-us-about-her (lingerie kit, Plus)

For the man buying: beside a campaign photograph, what he knows (her size if he knows it, what she wears, his
budget, what it's for), whether to wrap it, and the card. *Send* opens WhatsApp with all of it in one message; the shop
sets pieces aside and replies. What he leaves blank is said plainly ("Her size: I don't know"), never guessed.

```json
"her": { "wears": ["Black, always", "Colour", "Ivory and nude", "Silk more than lace"], "budgets": ["Up to £300", "£300 to £600", "£600 to £1,000", "More"], "occasions": ["Her birthday", "Our anniversary", "Valentine's", "The honeymoon"], "note": "…", "photo": { … } }
```
Heading: `sections.her`. Card length: `giftWrap.cardMax` (else 140). Message: `herText` in `src/kits/lingerie/lib/fit.js`.
