# Feature: pay-link (shared)

Pay online with the business's **own Stripe Payment Links**: deposits (a celebration cake, a party, a booking) or full
payments (a gift box, a voucher), each with its amount, what it's for and a line saying payment happens on Stripe. No
checkout, server or fee of ours: each button is a link to a page in the business's own Stripe account
(Stripe → Payment Links → New → copy the `https://buy.stripe.com/…` link).

- **Plan:** Plus and up (any plan as an add-on). **Kits:** `bakery` for now (the hire kit adds itself with its demo); add a kit to its `kits` list in
  `src/features/registry.js` once one of that kit's demos shows it (every kit's demos must show every feature listed for it).
- **Home section** (`pay-link.njk`, heading from `sections.payLinks`): one card per link.
- **Button inside another feature** (`button.njk`): `{% set pay = "cake-deposit" %}{% include "features/pay-link/button.njk" %}`;
  set `payLabel` to change the words. Shows nothing if the id isn't in `payLinks.items` or the feature is off.
- **Demos** use obviously fake links (`https://buy.stripe.com/demo-…`); a tap shows "Demo site: no payment taken" instead
  of leaving the page. Client sites can't use a `demo-` link, and demo sites can't use a real one.
- No JavaScript is needed on client sites: the buttons are plain links.

## Deposits that hold a request (hire, appointments)

Some trades take a deposit before the business has confirmed anything (a car hire, a commission). Mark that deposit
`"holds": "request"` (only on `"kind": "deposit"`; the validator refuses it anywhere else). Then:

- the button reads "Pay the £500 deposit to hold your request", and the line under it says "Holds your request;
  [business] confirms with you. It isn't a booking until they do." The site never says booked, confirmed or reserved;
- one Payment Link per item or per deposit band (a car, a price band): Payment Links have fixed amounts, so the site
  never suggests a variable total is charged online. The rest is settled with the business;
- **the reference:** a kit can tie the deposit to the request it goes with. It shares
  `ctx.share("pay-ref:<item id>", payRef(["911-turbo", from, to]))` (`src/core/lib/pay-ref.js`) and the link gains
  Stripe's `client_reference_id`, which Stripe records with the payment. Letters, digits, dashes and underscores only,
  up to 200 characters (`payRef` makes sure); never names, phone numbers or anything personal, since links get shared.
  Put the same reference in the request message (WhatsApp) so both sides match;
- on demos the tap still shows "Demo site: no payment taken";
- a look that overrides `pay-link.njk` or uses its own button must show the "holds your request" line for these items
  and keep `data-pay-url` on the link (the reference needs it).

Every other Payment Link renders exactly as before.

## Config (`site.json`)

```json
"payLinks": {
  "note": "You pay on Stripe's own secure page; we never see your card details.",
  "items": [
    { "id": "cake-deposit", "label": "Celebration cake", "amount": 20, "kind": "deposit",
      "url": "https://buy.stripe.com/…", "for": "Holds your date; the rest is paid when you collect." }
  ]
}
```

| Key | |
|---|---|
| `items[].id` | lowercase-dashes, unique; other features point at it (e.g. `cakes.depositLink`) |
| `items[].label` | what it pays for |
| `items[].amount` | pounds, as set on the Stripe link (the site never changes it) |
| `items[].kind` | `"deposit"` or `"full"` |
| `items[].url` | `https://buy.stripe.com/…` only |
| `items[].for` | optional line under it, e.g. what the deposit holds |
| `items[].holds` | optional, `"request"` on a deposit: it holds a request the business confirms (see above) |
| `note` | one line under the cards, in the business's words |
