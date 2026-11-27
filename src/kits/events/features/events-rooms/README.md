# events-rooms (Starter)

The rooms (EVT-1): the agency's own photographs of rooms on the night, each with its name, how many guests, where (in
words: "A panelled library, central London"; venue names only with the venue's permission) and "Ask about a room like
this", which opens WhatsApp naming the room. The home page shows the first four (`sections.rooms.show` to change).

```json
"rooms": { "items": [{ "id": "library-dinner", "name": "A library, by candlelight", "occasion": "wedding", "guests": 180,
  "where": "A panelled library, central London", "line": "…", "photo": { "src": "img/library.webp", "width": 2000, "height": 1333, "alt": "…" } }] }
```

`occasion` is one of wedding, corporate, private, launch, other. A design visual can never be a room here
(`config.js` refuses the same image in both): rooms are events the agency produced.
