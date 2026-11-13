# Your situation (Starter, hero part)

"I am [choose your situation] and I live in [the UK / another country]". The situation changes the line and where the
next step goes (that moment's page on Signature, the meeting page on Plus, a call on Starter); the place changes how
the firm meets ("in St James's or at your home", "by video, or when you're next in London"). Without scripts the
default line and step show and the selects are hidden.

```json
"situations": { "line", "next", "items": [{ "id", "label": "selling a business", "line", "next", "event": "selling-a-business" }],
  "places": [{ "id", "label": "the UK", "meet" }] }
```

Labels are lower case because they finish the sentence. `event` names a moment in `lifeEvents.items`.
