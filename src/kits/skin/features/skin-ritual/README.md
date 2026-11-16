# The ritual builder (BEAU-6, Signature)

`rituals.bases`: the menu treatments a ritual can begin with (ids). `rituals.addOns`: the clinic's add-ons, each with
`name`, the `minutes` and `price` it adds and a `line`. The card adds them up in the clinic's order and sends the
clinic's `message` with `{treatment}` (e.g. "Long facial with a scalp ritual and LED"), `{minutes}`, `{price}` and
`{name}` filled in. `note` sits under the card. Without JavaScript only the facials show, each bookable.
