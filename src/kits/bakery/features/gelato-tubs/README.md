# Take-home gelato (Plus)

Choose a tub, pick its flavours from the gelato wall, choose a collection time and send the order on WhatsApp for the
shop to confirm. A flavour the sheet says is off today can't be picked. Uses the `gelato` flavours and photos; needs
`gelato-wall`.

```json
"tubs": {
  "sizes": [
    { "id": "half", "name": "500ml tub", "price": 9, "flavours": 2 },
    { "id": "litre", "name": "Litre tub", "price": 16, "flavours": 3 }
  ],
  "note": "Packed in ice for the walk home; it keeps a month in the freezer."
}
```

`sections.tubs` gives the heading. Collection times follow `collect` (preparation time, days ahead) when it's set.
