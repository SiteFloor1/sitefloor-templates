# ev-check (electrician kit, Plus, ELEC-5)

The EV charging page (`/ev-charging`): the client's standard install and its price, then four questions (where you
park, how far the charger is from the fuse board, the main fuse, other big loads) answered against the client's own
rules: a standard install at their price (with extra cable at their price a metre), or what needs a look first. A
street or shared space is never a "yes". The grant is a gov.uk link only (amounts change; the page never states one).

```json
"evPage": { "kicker": "Car chargers", "title": "A charger on your drive", "intro": "…" },
"ev": { "message": "Hello <your business>, about a car charger.", "standard": { "price": 1195, "includedMetres": 10, "what": "A 7 kW charger, fitted and set up." },
  "perMetre": 28, "maxMetres": 30, "minFuse": 80, "leadMetres": 7, "grantUrl": "https://www.gov.uk/…", "photo": { … } }
```
`leadMetres` (optional) is the charger's own lead, used by the charger in 3D (`ev-3d`).
