# The fragrances (FRAG-1, Starter)

`fragrances.items`: each scent with `id`, `name`, `line` (one line in the house's words), `notes` (`top`, `heart`,
`base`, the house's own notes), `character?` (a paragraph, shown on the fragrances page), `photo`, `sizes` (`ml`,
`price` and, on a client site, `payLink`, the house's Stripe Payment Link for that size), `sample?` (`ml`, `price`,
`payLink?`) and `isNew?`. Without a payment link Buy sends the order on WhatsApp in the house's `fragrances.message`
(`{name}`, `{fragrance}`, `{ml}`, `{price}`); `sampleMessage?` does the same for samples. `delivery?` sits under the
list. With the fragrances page on, the home page shows the first three. Costs the house nothing beyond Stripe's fee.
