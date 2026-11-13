# look-book (hair kit, Plus)

The look book (`/look-book`): the salon's own work as photographs in an uneven three-column hang, filtered by the
salon's tags (cut, colour, texture, occasion; only tags in use are offered). Each look names its stylist and level,
the "from" price of its service, and "Ask for this look" on WhatsApp with the look and the stylist in the message.
Without JavaScript every look shows. Hosts the gallery when the look moves it here, and shows before and after pairs
when `consent-pairs` is on.

```json
"looks": { "message": "Hello …, I'd like this look:", "filters": [{ "id": "colour", "name": "Colour" }],
  "items": [{ "id": "copper", "name": "Copper, blunt line", "tags": ["colour", "cut"], "stylist": "hana", "service": "full-colour",
    "photo": { "src": "img/look-copper.webp", "width": 960, "height": 1200, "alt": "…" } }] }
```
Photos are the salon's own work (licensed stock on the demo, credited).
