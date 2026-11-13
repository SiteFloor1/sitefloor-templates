# colour-consult (hair kit, Plus)

The colour consultation on WhatsApp (`/colour-consultation`): the salon's steps, then two choices (the colour in mind,
when the hair was last coloured) and an optional line, sent as one message that ends by promising two photos in the
chat (a WhatsApp link can't attach photos, and the page says so). Never says "booked"; the salon replies with times.

```json
"consultation": { "title": "Colour consultation", "intro": "…", "description": "…", "photo": { … },
  "message": "Hello …, I'd like a colour consultation.", "wants": ["Blonde", "…"], "lastColour": ["Never coloured", "…"],
  "steps": ["…"], "note": "WhatsApp can't attach photos from a link, so send them in the chat once it opens." }
```
