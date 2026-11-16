# Which facial is right for me (BEAU-3, Plus)

The clinic's question (`finder.title`), two to six words for how skin feels today, and a printed treatment card for
each word. A card shows only what the clinic wrote for that treatment in `menu`: its name, minutes and price,
`afterwards`, `patch` and, when the clinic wrote one, `evening` ("This evening"). The kit never writes a card line.
Book this treatment goes to WhatsApp (or the clinic's booking channel) with the clinic's `message`, filled in:
`{name}` the clinic, `{treatment}`, `{minutes}`, `{price}`, `{word}`. `note` sits under every card (e.g. "your
facialist looks at your skin first").

```json
"finder": { "title": "How does your skin feel today?", "note": "…", "message": "Hello {name}, I'd like to book the {treatment} ({minutes} minutes, £{price}). My skin feels {word} today.",
  "words": [{ "word": "tight", "item": "hydrating" }] }
```

Every card is in the page, so without JavaScript all of them show, each with its own Book link. A word must point at
a treatment with `afterwards` and `patch` lines, and no word or line may name a condition or promise a result
(`src/kits/skin/lib/rules.js`).
