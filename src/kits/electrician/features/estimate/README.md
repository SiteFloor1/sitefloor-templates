# estimate (electrician kit, Signature, ELEC-8)

The whole-house estimate: the kind of home, the number of bedrooms and the work wanted give a range, never a single
price, from the client's own bands: for each kind of work a base band plus a band per bedroom, times the client's
factor for that kind of home, rounded out to £50 (`estimateRange` in `lib/quotes.js`). "Ask for a proper quote" sends
the choices and the range on WhatsApp.

```json
"estimate": { "message": "Hello <your business>, I'd like a quote.", "bedroomsMax": 7,
  "homes": [{ "id": "flat", "label": "Flat", "factor": 0.8 }, { "id": "house", "label": "House", "factor": 1 }],
  "works": [{ "id": "rewire", "name": "A full rewire", "base": { "min": 3200, "max": 4200 }, "perBedroom": { "min": 1100, "max": 1500 } }] }
```
Every band is the client's from their own past jobs; never fill one in for them. Heading: `sections.estimate`.
