# The rooms (`popup-rooms`, Plus)

Each room or station of the experience with its photograph and the minutes it takes, and the whole visit door to door
("45 minutes, door to door"). Choosing a room brings it forward and shows its line. On a phone the rooms swipe sideways.

```json
"sections": { "rooms": { "title": "Three rooms" } },
"rooms": { "items": [
  { "id": "racks", "name": "The racks", "minutes": 10, "line": "The last three harvests, laid down along the arch.",
    "photo": { "src": "img/room-racks.webp", "width": 900, "height": 1200, "alt": "…" } }
] }
```

Up to six rooms. Minutes are the brand's own. `popup-experience` (Plus) gives the rooms their own page.
