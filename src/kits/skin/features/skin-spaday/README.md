# A spa day as a gift (BEAU-7 and BEAU-9, Signature)

`spaDays.days`: each day the clinic sells as a gift: `name`, `line`, what it `includes`, `minutes`, `price` and, on a
client site, its own Stripe Payment Link (`payLink`, https://buy.stripe.com/…; a demo takes no payments). The
visitor writes who it's for and from, and a line for the card; the card is drawn as they type. Buy opens the
clinic's payment link, then the names go to the clinic on WhatsApp in the clinic's `message` (`{treatment}`,
`{price}`, `{to}`, `{from}`; the card's line follows). Without a payment link the whole gift goes on WhatsApp.
`terms` (validity, how it's sent) sits under the card. Costs the clinic nothing beyond Stripe's own fee.
