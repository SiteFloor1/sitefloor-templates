# skin-test (hair kit, Starter)

The skin test before colour, in the salon's words: who needs one, when, and how to walk in. Choose the colour day
(UK order, whatever the phone's language) and it says the last day for the test by the salon's own rule
(`hoursBefore`, rounded up to whole days), with "Add the skin test to my calendar" (an all-day event) and a WhatsApp
message with both dates. Never medical advice: the rule and the words are the salon's.

```json
"skinTest": { "hoursBefore": 48, "who": "New colour clients, and anyone who hasn't had colour with us for six months.",
  "walkIn": "Walk in any time we're open. It takes five minutes and it's free.",
  "message": "Hello …, I'd like to come in for a skin test." }
```
Heading: `sections.skinTest`. A look can move it to the colour page (look.json `onPages`: `"colour-page": ["skin-test"]`).
