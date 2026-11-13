# Feature: postcode (hire kit)

Delivery and collection on the home page (`#delivery`). **Plan:** Starter.

Type a postcode: inside one of the client's zones (and that zone's fee), or outside them (and how to collect). Zones list
postcode areas (`SE`), district families (`SW1`, which covers SW1A–SW1Y but not SW11) or districts (`SW11`); the most
specific match wins. No paid map service: a postcode district is the whole test, so a zone is drawn by its districts.
Without JavaScript the zones table is the answer. With `meet-greet` (Plus) the client's airports and fees are listed too.

Config: `hire.delivery` `{ collect, zones: [{ name, fee, districts }], note? }`, `sections.postcode` `{ title, intro? }`.
