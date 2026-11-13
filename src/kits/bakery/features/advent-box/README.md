# The advent box (Signature, seasonal)

The shop's own lid with 24 numbered windows, laid out in shuffled places like a printed calendar, a chocolate behind
each from its own photos (the box pieces' tiles). Before December every window opens, so customers see inside before
they order; from 1 December windows up to today open (the shop's date in the UK, not the visitor's clock) and the
rest say when they will; after the 24th, all open. Windows a visitor has opened stay open on their device for the
season. Pre-order on WhatsApp, with an optional Payment Link.

```json
"advent": {
  "year": 2026, "price": 38, "orderBy": "2026-11-24", "collectFrom": "2026-11-27",
  "windows": ["white-vanilla", "raspberry"],
  "payLink": "advent",
  "note": "Twenty-four chocolates, one for each morning."
}
```

`windows` is optional: ids of pieces with a `tile`, day 1 first; days without one take the box pieces in tasting
order, in turn. Add it to the home page from October and take it off after Christmas (`features`). Uses the same
tile photos as the box, so it adds almost nothing to the page.
