# Let them choose (Signature)

`choose`: `title`, `intro?`, `amounts` (each `amount` and, on a client site, `payLink`: the house's Stripe Payment
Link for that amount; the house's Stripe promotion code is the voucher), `terms` (how long it lasts, samples
included or not), `message` (to the house after paying: `{price}`, `{to}`, `{from}`), `redeemTitle` and `redeemMessage`
(the one who receives it sends `{code}` and `{fragrance}`). The house checks the code in its own Stripe dashboard:
nothing here stores or checks codes, so a wrong or used code is never shown as good. On the gifts page.
