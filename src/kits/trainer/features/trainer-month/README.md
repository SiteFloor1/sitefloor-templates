# Your first month (home, Signature showpiece)

One tool for a new client's questions: what a first session involves, where it happens, how often people come and
what it costs. Choose where (the studio, or the client's home) and how often (once, twice or three times a week). The
first session is the diary's earliest open hour; the sessions in the four weeks after keep its weekday pattern and
time. The cost comes from the trainer's own prices (travel added when they come to the client). Reserve the first
session on WhatsApp with every choice in the message, or add every session to a calendar (.ics, in UTC).

If the diary has no open hour (or its sheet is stale), the first session and prices still show; the dates, the total
and the calendar file don't, and the button asks for a first hour instead.

The heading and its line are `sections.firstMonth.title` and `.intro`.

```json
"firstMonth": {
  "photo": { "src": "img/stones.webp", "width": 1400, "height": 2100, "alt": "…" },
  "caption": "Most people I train come twice a week.",
  "places": [{ "id": "studio", "label": "The studio", "note": "Chelsea, SW3", "text": "…" },
             { "id": "home", "label": "Your home", "note": "SW1X · SW3 · SW7", "text": "…", "away": true }],
  "often": [{ "perWeek": 1, "label": "Once a week", "note": "steady" }, { "perWeek": 2, "label": "Twice a week", "default": true }],
  "steps": [{ "minute": 0, "text": "We sit down…" }, { "minute": 15, "text": "How you move…" }],
  "prices": { "first": 120, "session": { "1": 115, "2": 110 }, "travel": 20 },
  "policy": [{ "label": "Cancel 24 hours ahead", "value": "no charge" }],
  "message": "Hello, I'd like to reserve a first session:"
}
```
