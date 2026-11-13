# room-designer (electrician kit, Plus, ELEC-6)

The lighting page (`/lighting`): choose a room, its size and the layers of light (downlights, wall lights,
pendants, a lit plinth…). The fittings for that size of room and the price come only from the client's own figures:
how many of each layer they fit in a room that size and their price each, fitted, plus one scene keypad when more
than one layer is chosen. "Send this room" puts it all in a WhatsApp message.

```json
"lightingPage": { "kicker": "Lighting", "title": "Light, in layers", "intro": "…" },
"designer": { "message": "Hello <your business>, I've designed a room on your website.",
  "sizes": [{ "id": "s", "label": "Up to 12 m²" }, { "id": "m", "label": "12–25 m²" }],
  "rooms": [{ "id": "kitchen", "name": "Kitchen" }],
  "layers": [{ "id": "down", "name": "Downlights", "about": "Even light to work by.", "price": 145, "per": { "s": 4, "m": 8 } }],
  "control": { "name": "A scene keypad", "price": 420 } }
```
The page can also hold the dimmer and gift vouchers (look.json `onPages`).
